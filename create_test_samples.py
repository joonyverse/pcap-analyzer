#!/usr/bin/env python3
"""
Multiple test PCAP samples for different testing scenarios
"""

import struct
import time
import random
import math

def create_pcap_global_header():
    """Create PCAP global header"""
    magic = 0xa1b2c3d4  # Little endian
    version_major = 2
    version_minor = 4
    thiszone = 0
    sigfigs = 0
    snaplen = 65535
    network = 1  # Ethernet
    
    return struct.pack('<LHHLLLL', 
                      magic, version_major, version_minor, 
                      thiszone, sigfigs, snaplen, network)

def create_packet_header(packet_data, timestamp):
    """Create packet header"""
    ts_sec = int(timestamp)
    ts_usec = int((timestamp - ts_sec) * 1000000)
    caplen = len(packet_data)
    origlen = caplen
    
    return struct.pack('<LLLL', ts_sec, ts_usec, caplen, origlen)

def create_ethernet_header(src_mac="00:11:22:33:44:55", dst_mac="aa:bb:cc:dd:ee:ff"):
    """Create Ethernet header"""
    def mac_to_bytes(mac_str):
        return bytes.fromhex(mac_str.replace(':', ''))
    
    dst = mac_to_bytes(dst_mac)
    src = mac_to_bytes(src_mac) 
    ethertype = 0xaefe  # eCPRI
    
    return dst + src + struct.pack('>H', ethertype)

def create_ecpri_header(message_type=0, rtc_id=0x1234, seq_id=0, payload_size=0):
    """Create eCPRI header"""
    # Byte 0: Version(4) + Reserved(1) + C(1) + Message Type(2)
    byte0 = (1 << 4) | (0 << 3) | (0 << 2) | (message_type & 0x03)
    
    header = struct.pack('>BHHH', 
                        byte0, payload_size, rtc_id, seq_id)
    
    return header

def create_oran_header(frame_id=0, subframe_id=0, slot_id=0, symbol_id=0, 
                      section_id=0, start_prbu=0, num_prbu=273):
    """Create O-RAN U-plane header"""
    # Byte 0: dataDirection(1) + payloadVersion(3) + filterIndex(4)
    byte0 = (0 << 7) | (1 << 4) | (0 & 0x0f)
    
    # Byte 2: subframeId(4) + slotId(4) 
    byte2 = (subframe_id << 4) | (slot_id & 0x0f)
    
    # Byte 3: symbolId(6) + reserved(2)
    byte3 = (symbol_id << 2) | 0
    
    # Section fields (4 bytes)
    # sectionId(12) + rb(1) + symInc(1) + startPrbu(10) + numPrbu(8)
    section_fields = (section_id << 20) | (1 << 19) | (0 << 18) | (start_prbu << 8) | num_prbu
    
    return struct.pack('>BBBB', byte0, frame_id, byte2, byte3) + struct.pack('>L', section_fields)

def generate_iq_samples_with_pattern(num_samples, pattern="sine"):
    """Generate different IQ sample patterns"""
    samples = []
    
    for i in range(num_samples):
        if pattern == "sine":
            # Sine wave
            t = i / num_samples * 4 * math.pi
            amplitude = 2000
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
        elif pattern == "noise":
            # Random noise
            i_sample = random.randint(-5000, 5000)
            q_sample = random.randint(-5000, 5000)
        elif pattern == "chirp":
            # Frequency chirp
            t = i / num_samples
            freq = 10 + 90 * t  # Frequency sweep from 10 to 100
            amplitude = 3000
            i_sample = int(amplitude * math.cos(2 * math.pi * freq * t))
            q_sample = int(amplitude * math.sin(2 * math.pi * freq * t))
        elif pattern == "low_power":
            # Low power signal
            t = i / num_samples * 2 * math.pi
            amplitude = 100
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
        else:  # "high_power"
            # High power signal
            t = i / num_samples * 2 * math.pi
            amplitude = 8000
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
        
        # Clamp to 16-bit signed range
        i_sample = max(-32768, min(32767, i_sample))
        q_sample = max(-32768, min(32767, q_sample))
        
        samples.append(struct.pack('>hh', i_sample, q_sample))
    
    return b''.join(samples)

def create_oran_packet(rtc_id=0x1234, seq_id=0, frame_id=0, symbol_id=0, pattern="sine"):
    """Create a complete O-RAN packet with specific IQ pattern"""
    # Create headers
    eth_header = create_ethernet_header()
    oran_header = create_oran_header(frame_id=frame_id, symbol_id=symbol_id)
    iq_data = generate_iq_samples_with_pattern(273*12, pattern)
    
    # Calculate eCPRI payload size (O-RAN header + IQ data)
    payload_size = len(oran_header) + len(iq_data)
    ecpri_header = create_ecpri_header(message_type=0, rtc_id=rtc_id, seq_id=seq_id, payload_size=payload_size)
    
    # Combine all parts
    packet_data = eth_header + ecpri_header + oran_header + iq_data
    
    return packet_data

def create_test_pcap_simple(filename="test_simple.pcap"):
    """Simple test with basic O-RAN packets"""
    with open(filename, 'wb') as f:
        f.write(create_pcap_global_header())
        
        base_time = time.time()
        
        # Simple 5 packet sequence
        for i in range(5):
            packet_data = create_oran_packet(
                rtc_id=0x1000 + i,
                seq_id=i,
                frame_id=i // 2,
                symbol_id=i % 4,
                pattern="sine"
            )
            
            packet_timestamp = base_time + (i * 0.001)
            packet_header = create_packet_header(packet_data, packet_timestamp)
            
            f.write(packet_header)
            f.write(packet_data)
    
    print(f"Created {filename}: 5 simple O-RAN packets with sine wave IQ data")

def create_test_pcap_rms_variations(filename="test_rms_variations.pcap"):
    """Test with different RMS levels"""
    with open(filename, 'wb') as f:
        f.write(create_pcap_global_header())
        
        base_time = time.time()
        
        patterns = [
            ("low_power", 0x2000),
            ("sine", 0x2001), 
            ("high_power", 0x2002),
            ("chirp", 0x2003),
            ("noise", 0x2004)
        ]
        
        for i, (pattern, rtc_id) in enumerate(patterns):
            packet_data = create_oran_packet(
                rtc_id=rtc_id,
                seq_id=i,
                frame_id=0,
                symbol_id=i,
                pattern=pattern
            )
            
            packet_timestamp = base_time + (i * 0.002)
            packet_header = create_packet_header(packet_data, packet_timestamp)
            
            f.write(packet_header)
            f.write(packet_data)
    
    print(f"Created {filename}: 5 packets with different RMS levels (low_power, sine, high_power, chirp, noise)")

def create_test_pcap_frame_sequence(filename="test_frame_sequence.pcap"):
    """Test with frame/slot/symbol progression"""
    with open(filename, 'wb') as f:
        f.write(create_pcap_global_header())
        
        base_time = time.time()
        packet_count = 0
        
        # Generate packets for 2 frames, 10 slots each, 14 symbols each
        for frame in range(2):
            for slot in range(10):
                for symbol in range(14):
                    packet_data = create_oran_packet(
                        rtc_id=0x3000,
                        seq_id=packet_count,
                        frame_id=frame,
                        symbol_id=symbol,
                        pattern="sine"
                    )
                    
                    # Realistic timing: 1ms per slot, symbols within slot
                    packet_timestamp = base_time + (frame * 10 + slot) * 0.001 + symbol * 0.00007
                    packet_header = create_packet_header(packet_data, packet_timestamp)
                    
                    f.write(packet_header)
                    f.write(packet_data)
                    packet_count += 1
    
    print(f"Created {filename}: {packet_count} packets in frame/slot/symbol sequence (2 frames × 10 slots × 14 symbols)")

def create_all_test_samples():
    """Create all test PCAP samples"""
    print("Creating test PCAP samples...")
    create_test_pcap_simple()
    create_test_pcap_rms_variations() 
    create_test_pcap_frame_sequence()
    print("All test samples created successfully!")

if __name__ == "__main__":
    create_all_test_samples()