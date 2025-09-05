#!/usr/bin/env python3
"""
Large PCAP generator for performance testing
Creates a PCAP file with 10,000 O-RAN eCPRI packets
"""

import struct
import time
import random
import math
import sys

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

def generate_iq_samples_fast(num_samples, pattern_type, seed):
    """Generate IQ samples efficiently for large datasets"""
    random.seed(seed)  # Deterministic but varied patterns
    samples = []
    
    if pattern_type == 0:  # Sine wave
        amplitude = 2000 + random.randint(-500, 500)
        frequency = 1 + random.random() * 3
        phase = random.random() * 2 * math.pi
        
        for i in range(num_samples):
            t = i / num_samples * 2 * math.pi * frequency + phase
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
            
            # Clamp to 16-bit signed range
            i_sample = max(-32768, min(32767, i_sample))
            q_sample = max(-32768, min(32767, q_sample))
            
            samples.append(struct.pack('>hh', i_sample, q_sample))
    
    elif pattern_type == 1:  # Noise
        amplitude = 1000 + random.randint(-300, 300)
        for i in range(num_samples):
            i_sample = random.randint(-amplitude, amplitude)
            q_sample = random.randint(-amplitude, amplitude)
            samples.append(struct.pack('>hh', i_sample, q_sample))
    
    elif pattern_type == 2:  # Low power
        amplitude = 200 + random.randint(-50, 50)
        for i in range(num_samples):
            t = i / num_samples * 2 * math.pi
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
            samples.append(struct.pack('>hh', i_sample, q_sample))
    
    else:  # High power
        amplitude = 6000 + random.randint(-1000, 1000)
        for i in range(num_samples):
            t = i / num_samples * 2 * math.pi
            i_sample = int(amplitude * math.cos(t))
            q_sample = int(amplitude * math.sin(t))
            
            i_sample = max(-32768, min(32767, i_sample))
            q_sample = max(-32768, min(32767, q_sample))
            
            samples.append(struct.pack('>hh', i_sample, q_sample))
    
    return b''.join(samples)

def create_oran_packet_fast(packet_id):
    """Create O-RAN packet efficiently with varied parameters"""
    # Vary parameters based on packet ID to simulate realistic traffic
    rtc_id = 0x1000 + (packet_id % 8)  # 8 different RTC IDs
    frame_id = (packet_id // 140) % 1024  # Frame progression
    slot_id = (packet_id // 14) % 10     # 10 slots per frame
    symbol_id = packet_id % 14           # 14 symbols per slot
    section_id = packet_id % 4096        # Vary section ID
    
    # Create headers
    eth_header = create_ethernet_header()
    oran_header = create_oran_header(
        frame_id=frame_id,
        subframe_id=(slot_id // 2) % 10,
        slot_id=slot_id,
        symbol_id=symbol_id,
        section_id=section_id
    )
    
    # Generate IQ data with different patterns
    pattern_type = packet_id % 4  # 4 different patterns
    iq_data = generate_iq_samples_fast(273*12, pattern_type, packet_id)
    
    # Calculate eCPRI payload size
    payload_size = len(oran_header) + len(iq_data)
    ecpri_header = create_ecpri_header(
        message_type=0, 
        rtc_id=rtc_id, 
        seq_id=packet_id & 0xFFFF,  # 16-bit sequence ID
        payload_size=payload_size
    )
    
    # Combine all parts
    packet_data = eth_header + ecpri_header + oran_header + iq_data
    return packet_data

def create_large_pcap(filename="test_large_10k.pcap", num_packets=10000):
    """Create large PCAP file with specified number of packets"""
    
    print(f"Creating {filename} with {num_packets:,} packets...")
    
    with open(filename, 'wb') as f:
        # Write PCAP global header
        f.write(create_pcap_global_header())
        
        base_time = time.time()
        
        # Generate packets in batches for memory efficiency
        batch_size = 100
        
        for batch_start in range(0, num_packets, batch_size):
            batch_end = min(batch_start + batch_size, num_packets)
            
            # Show progress
            if batch_start % 1000 == 0:
                progress = (batch_start / num_packets) * 100
                print(f"Progress: {progress:.1f}% ({batch_start:,}/{num_packets:,} packets)")
                sys.stdout.flush()
            
            # Process batch
            for i in range(batch_start, batch_end):
                # Create packet with realistic timing
                # Simulate 1ms per slot (14 symbols), so ~71.4μs per symbol
                time_offset = (i * 0.0000714)  # ~71.4 microseconds per packet
                packet_timestamp = base_time + time_offset
                
                # Generate packet
                packet_data = create_oran_packet_fast(i)
                packet_header = create_packet_header(packet_data, packet_timestamp)
                
                # Write to file
                f.write(packet_header)
                f.write(packet_data)
    
    print(f"\n✅ Successfully created {filename}")
    print(f"📊 File details:")
    print(f"   • Packets: {num_packets:,}")
    print(f"   • RTC IDs: 8 different (0x1000-0x1007)")
    print(f"   • Frame progression: Realistic frame/slot/symbol structure")
    print(f"   • Signal patterns: 4 types (sine, noise, low power, high power)")
    print(f"   • Timing: ~71.4μs intervals (realistic symbol timing)")
    
    # Calculate file size
    import os
    file_size = os.path.getsize(filename)
    print(f"   • File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")

def main():
    """Main function with option to specify packet count"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate large PCAP file for testing')
    parser.add_argument('--packets', '-p', type=int, default=10000,
                        help='Number of packets to generate (default: 10000)')
    parser.add_argument('--filename', '-f', type=str, default="test_large_10k.pcap",
                        help='Output filename (default: test_large_10k.pcap)')
    
    args = parser.parse_args()
    
    # Adjust filename if packets count is different
    if args.packets != 10000:
        base_name = args.filename.replace('.pcap', '')
        args.filename = f"{base_name}_{args.packets}.pcap"
    
    create_large_pcap(args.filename, args.packets)

if __name__ == "__main__":
    main()