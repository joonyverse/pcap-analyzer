# PCAP Analyzer for O-RAN

A web-based PCAP analyzer specifically designed for O-RAN (Open Radio Access Network) protocols. This tool processes eCPRI packet captures and provides advanced analysis capabilities including BFPC decompression, IQ data extraction, and RMS calculations.

## 🚀 Features

- **PCAP File Processing**: Supports standard PCAP format with automatic endianness detection
- **O-RAN Protocol Analysis**: eCPRI and O-RAN header parsing with U-plane packet support
- **BFPC Decompression**: Block Floating Point Compression handling for IQ data
- **Signal Processing**: RMS calculation, signal quality metrics, and statistical analysis
- **Interactive Viewer**: Packet list with detailed hex view and protocol breakdown
- **Advanced Filtering**: Filter by RTC ID, Frame ID, Message Type, RMS range, and text search
- **Data Visualization**: RMS value charts and statistical summaries
- **GitHub Pages Ready**: Client-side only architecture for easy deployment

## 🎯 Use Cases

This tool is designed for vRAN L1 SW developers and network engineers working with:
- eCPRI packet captures from RU/MMU to vDU communication
- DPDK-based packet processing analysis
- O-RAN fronthaul interface debugging
- IQ data quality analysis
- Signal processing validation

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Parsing**: Pure JavaScript PCAP and protocol parsers
- **Visualization**: Chart.js for RMS plotting
- **State Management**: React hooks with custom `usePcapAnalyzer`
- **Styling**: CSS Grid/Flexbox with modern design
- **Deployment**: GitHub Actions + GitHub Pages

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Upload PCAP File**: Drag and drop or select a .pcap file
2. **View Packets**: Browse parsed packets with protocol information
3. **Apply Filters**: Use the filter panel to narrow down packets
4. **Analyze Data**: Check the Analysis tab for statistics and RMS data
5. **Visualize**: View RMS charts in the Charts tab

## 📊 Analysis Capabilities

### Packet Analysis
- Ethernet header parsing (MAC addresses, EtherType)
- eCPRI header breakdown (version, message type, RTC ID, sequence)
- O-RAN header details (frame, subframe, slot, symbol, PRB info)
- Raw packet hex dump view

### Signal Processing
- IQ data extraction from O-RAN U-plane packets
- BFPC compression detection and decompression
- RMS (Root Mean Square) calculation per packet
- Signal quality metrics (peak-to-peak, dynamic range, SNR estimation)

### Filtering & Search
- Filter by RTC ID, Frame ID, Message Type
- RMS value range filtering
- Text search across MAC addresses and packet fields
- Real-time filter application

## 🏗 Architecture

Client-side only architecture suitable for GitHub Pages:

```
src/
├── components/          # React components
├── parsers/            # Protocol parsers
├── processors/         # Signal processing
├── hooks/              # React hooks
└── types/              # TypeScript definitions
```

## 🚀 Deployment

Automatically deploys to GitHub Pages via GitHub Actions on push to main branch.