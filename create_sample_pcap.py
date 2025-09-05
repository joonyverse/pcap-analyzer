#!/usr/bin/env python3
"""
Sample PCAP generator for O-RAN eCPRI packets
Creates a test PCAP file with synthetic eCPRI O-RAN packets containing IQ data
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

def create_ecpri_header(message_type=0, rtc_id=0x1234, seq_id=0):
    """Create eCPRI header"""
    # Byte 0: Version(4) + Reserved(1) + C(1) + Message Type(2)
    byte0 = (1 << 4) | (0 << 3) | (0 << 2) | (message_type & 0x03)
    
    # Payload size (will be updated later)
    payload_size = 0
    
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

def generate_iq_samples(num_samples=273*12):  # 273 PRBs * 12 subcarriers
    """Generate synthetic IQ samples"""
    samples = []
    
    for i in range(num_samples):
        # Generate sine wave with some noise
        t = i / num_samples * 2 * math.pi
        amplitude = 1000
        
        i_sample = int(amplitude * math.cos(t) + random.randint(-100, 100))
        q_sample = int(amplitude * math.sin(t) + random.randint(-100, 100))
        
        # Clamp to 16-bit signed range
        i_sample = max(-32768, min(32767, i_sample))
        q_sample = max(-32768, min(32767, q_sample))
        
        samples.append(struct.pack('>hh', i_sample, q_sample))
    
    return b''.join(samples)

def create_oran_packet(rtc_id=0x1234, seq_id=0, frame_id=0, symbol_id=0):
    """Create a complete O-RAN packet"""
    # Create headers
    eth_header = create_ethernet_header()
    oran_header = create_oran_header(frame_id=frame_id, symbol_id=symbol_id)
    iq_data = generate_iq_samples()
    
    # Calculate eCPRI payload size (O-RAN header + IQ data)
    payload_size = len(oran_header) + len(iq_data)
    ecpri_header = create_ecpri_header(message_type=0, rtc_id=rtc_id, seq_id=seq_id)
    
    # Update payload size in eCPRI header
    ecpri_header = ecpri_header[:1] + struct.pack('>H', payload_size) + ecpri_header[3:]
    
    # Combine all parts
    packet_data = eth_header + ecpri_header + oran_header + iq_data
    
    return packet_data

def create_sample_pcap(filename="sample_oran.pcap"):
    """Create a sample PCAP file with O-RAN packets"""
    
    with open(filename, 'wb') as f:
        # Write PCAP global header
        f.write(create_pcap_global_header())
        
        base_time = time.time()
        
        # Generate multiple packets with different parameters
        packet_configs = [
            {"rtc_id": 0x1234, "frame_id": 0, "symbol_id": 0},
            {"rtc_id": 0x1234, "frame_id": 0, "symbol_id": 1},
            {"rtc_id": 0x1234, "frame_id": 0, "symbol_id": 2},
            {"rtc_id": 0x5678, "frame_id": 1, "symbol_id": 0},
            {"rtc_id": 0x5678, "frame_id": 1, "symbol_id": 1},
            {"rtc_id": 0x9abc, "frame_id": 2, "symbol_id": 0},
            {"rtc_id": 0x1234, "frame_id": 3, "symbol_id": 3},
            {"rtc_id": 0x5678, "frame_id": 4, "symbol_id": 2},
        ]
        
        for i, config in enumerate(packet_configs):
            # Create packet
            packet_data = create_oran_packet(
                rtc_id=config["rtc_id"],
                seq_id=i,
                frame_id=config["frame_id"], 
                symbol_id=config["symbol_id"]
            )
            
            # Create packet header with timestamp
            packet_timestamp = base_time + (i * 0.001)  # 1ms intervals
            packet_header = create_packet_header(packet_data, packet_timestamp)
            
            # Write packet header and data
            f.write(packet_header)
            f.write(packet_data)
    
    print(f"Created sample PCAP file: {filename}")
    print(f"Contains {len(packet_configs)} O-RAN eCPRI packets")
    print("Packet details:")
    for i, config in enumerate(packet_configs):
        print(f"  Packet {i}: RTC ID 0x{config['rtc_id']:04x}, Frame {config['frame_id']}, Symbol {config['symbol_id']}")

if __name__ == "__main__":
    create_sample_pcap()