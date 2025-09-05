# Test PCAP Samples

This directory contains several test PCAP files for validating the O-RAN PCAP analyzer functionality.

## Available Test Files

### 1. `sample_oran.pcap` (Original Sample)
- **Size**: 8 packets (103KB)
- **Content**: Basic O-RAN eCPRI packets with different RTC IDs and frame/symbol combinations
- **Use Case**: Basic functionality testing, UI validation
- **Packet Details**:
  - RTC IDs: 0x1234, 0x5678, 0x9abc
  - Frames: 0-4
  - Symbols: 0-3
  - IQ Data: Sine wave with noise

### 2. `test_simple.pcap` 
- **Size**: 5 packets (65KB)
- **Content**: Simple sequence for basic parser testing
- **Use Case**: Quick validation of parsing pipeline
- **Features**:
  - Sequential RTC IDs (0x1000-0x1004)
  - Progressive frame/symbol IDs
  - Clean sine wave IQ data
  - 1ms packet intervals

### 3. `test_rms_variations.pcap`
- **Size**: 5 packets (65KB)
- **Content**: Different signal patterns for RMS calculation testing
- **Use Case**: Signal processing validation, RMS calculation accuracy
- **Signal Types**:
  - **Low Power** (RTC 0x2000): Small amplitude sine (RMS ~70)
  - **Normal Sine** (RTC 0x2001): Medium amplitude sine (RMS ~1414)  
  - **High Power** (RTC 0x2002): Large amplitude sine (RMS ~5657)
  - **Chirp** (RTC 0x2003): Frequency sweep (Variable RMS)
  - **Noise** (RTC 0x2004): Random noise (Variable RMS)

### 4. `test_frame_sequence.pcap`
- **Size**: 280 packets (3.6MB)
- **Content**: Realistic frame/slot/symbol progression
- **Use Case**: Medium dataset testing, filtering performance, frame structure validation
- **Features**:
  - Complete frame structure simulation
  - Realistic timing (1ms per slot, ~70µs per symbol)
  - Single RTC ID (0x3000) for consistency
  - Sequential packet numbering

### 5. `test_medium_1k_1000.pcap` 🆕
- **Size**: 1,000 packets (12.5MB)
- **Content**: Medium-scale performance testing
- **Use Case**: Performance validation, memory usage testing
- **Features**:
  - 8 different RTC IDs (0x1000-0x1007)
  - Realistic frame/slot/symbol progression
  - 4 signal pattern types (sine, noise, low power, high power)
  - 71.4μs realistic symbol timing intervals

### 6. `test_large_10k.pcap` 🆕
- **Size**: 10,000 packets (125.4MB)
- **Content**: Large-scale performance and stress testing
- **Use Case**: Stress testing, large dataset handling, performance optimization
- **Features**:
  - 8 different RTC IDs (0x1000-0x1007)
  - Realistic O-RAN frame structure progression
  - 4 varied signal patterns with different RMS characteristics
  - High-fidelity 71.4μs symbol timing
  - Memory and processing performance validation

## Testing Scenarios

### Basic Functionality
1. Upload `test_simple.pcap`
2. Verify 5 packets are parsed correctly
3. Check packet list shows RTC IDs 0x1000-0x1004
4. Validate eCPRI and O-RAN headers are parsed

### RMS Calculation Testing  
1. Upload `test_rms_variations.pcap`
2. Navigate to Analysis tab
3. Verify RMS values show expected ranges:
   - Low power: RMS < 200
   - Normal: RMS ~1000-2000
   - High power: RMS > 4000
4. Check Charts tab shows RMS variation

### Filtering Testing
1. Upload `test_frame_sequence.pcap` 
2. Use filter panel to test:
   - **Frame ID filter**: Select Frame 0 → should show 140 packets
   - **Symbol ID filter**: Select Symbol 5 → should show 20 packets  
   - **RMS range**: Set min/max values
   - **Text search**: Search "3000" → should find all packets

### Performance Testing

#### Medium Scale (1K packets)
1. Upload `test_medium_1k_1000.pcap` (1,000 packets)
2. Verify parsing completes within 2-3 seconds
3. Check memory usage stays under 100MB
4. Test filtering responsiveness with 1K packets
5. Validate chart rendering with moderate dataset

#### Large Scale (10K packets) 
1. Upload `test_large_10k.pcap` (10,000 packets)
2. **Parsing Performance**: Should complete within 10-15 seconds
3. **Memory Usage**: Monitor browser memory (expect 200-400MB)
4. **UI Responsiveness**: 
   - Packet list should render progressively
   - Filtering should respond within 1-2 seconds
   - Chart rendering may take 3-5 seconds
5. **Browser Compatibility**: Test on Chrome, Firefox, Safari
6. **Large Dataset Features**:
   - Scroll performance in packet list
   - Filter combinations with large result sets
   - RMS chart with 10K data points

#### Expected Performance Benchmarks
- **Small (5-280 packets)**: < 1 second parsing
- **Medium (1K packets)**: 2-3 seconds parsing, smooth interactions
- **Large (10K packets)**: 10-15 seconds parsing, manageable performance

## Expected Results

### Parsing Validation
- All packets should be identified as O-RAN eCPRI packets
- Ethernet headers: MAC addresses parsed correctly
- eCPRI headers: Version=1, Message Type=0, payload sizes match
- O-RAN headers: Frame/slot/symbol progression logical

### Signal Processing
- IQ data extraction should work for all packets
- RMS calculations should complete without errors
- Values should be reasonable for signal types

### UI Functionality  
- Packet selection and detail view working
- Filtering produces expected results
- Charts render without errors
- Tab navigation functional

## Troubleshooting

If packets aren't parsing correctly:
1. Check browser console for JavaScript errors
2. Verify PCAP magic number detection
3. Validate endianness handling
4. Check eCPRI EtherType (0xAEFE)

If RMS values seem incorrect:
1. Verify IQ sample extraction from payload
2. Check 16-bit signed integer parsing
3. Validate RMS calculation formula
4. Test with known signal patterns

## Generating Custom Test Files

Use the provided Python scripts:
```bash
# Generate original sample
python3 create_sample_pcap.py

# Generate all test variants  
python3 create_test_samples.py
```

Both scripts require Python 3 with standard libraries only (no external dependencies).