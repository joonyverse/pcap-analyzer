# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based PCAP analyzer specifically designed for O-RAN (Open Radio Access Network) protocols. It processes eCPRI packet captures and provides advanced analysis capabilities including BFPC (Block Floating Point Compression) decompression, IQ data extraction, and RMS calculations.

## Common Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run preview            # Preview production build locally
npm run lint               # Run ESLint
npm run deploy             # Build and deploy to GitHub Pages (manual)

# Testing the build
npm run build && npm run preview
```

## Architecture

### Client-Side Only Architecture
This is a **frontend-only** application designed for GitHub Pages deployment. All processing happens in the browser using:
- React + TypeScript + Vite
- Client-side PCAP parsing with pure JavaScript
- Chart.js for visualization
- Zustand for state management

### Core Modules

1. **Parsers** (`src/parsers/`)
   - `pcap.ts`: PCAP file format parser with endianness detection
   - `oran.ts`: O-RAN protocol parser with eCPRI header processing

2. **Processors** (`src/processors/`)
   - `bfpc.ts`: BFPC compression/decompression algorithms
   - `rms.ts`: Signal quality calculations (RMS, PSD, SNR estimation)

3. **Components** (`src/components/`)
   - `viewer/`: Packet list and detail views
   - `charts/`: RMS visualization components
   - `analyzer/`: Statistical analysis displays
   - `ui/`: Reusable UI components including filtering

4. **Custom Hook** (`src/hooks/usePcapAnalyzer.ts`)
   - Main analysis workflow orchestration
   - File processing pipeline
   - State management for parsed packets

### Data Flow
1. User uploads PCAP file via HTML5 File API
2. `PcapParser` processes raw binary data
3. `OranParser` identifies and enriches O-RAN packets
4. `BFPCProcessor` handles compression/decompression
5. `RMSProcessor` calculates signal metrics
6. Results displayed in tabbed interface with filtering

## Key Implementation Details

### PCAP Processing
- Handles both little-endian and big-endian PCAP files
- Supports standard PCAP format (not PCAPNG yet)
- Processes Ethernet → eCPRI → O-RAN packet layers

### O-RAN Protocol Support
- eCPRI message type 0 (IQ data) processing
- U-plane packet parsing with frame/slot/symbol identification
- IQ sample extraction from payload data

### BFPC Compression
- Block Floating Point Compression implementation
- Automatic detection of compressed vs uncompressed data
- Scale factor and exponent processing

### Performance Considerations
- Large PCAP files are processed synchronously (consider Web Workers for files >100MB)
- IQ data is stored in memory - monitor usage for large captures
- Chart rendering optimized for up to 10K data points

## Development Guidelines

### File Organization
- Keep parsers pure and stateless
- Use TypeScript interfaces in `src/types/` for all data structures
- Component props should be strongly typed
- CSS uses utility-first approach with CSS Grid/Flexbox

### State Management
- Main application state in `usePcapAnalyzer` hook
- Local component state for UI interactions
- No global state management needed currently

### Adding New Analysis Features
1. Define data types in `src/types/index.ts`
2. Add processing logic in appropriate `src/processors/` file
3. Create visualization component in `src/components/charts/`
4. Update `usePcapAnalyzer` hook for data flow
5. Add UI controls in relevant viewer components

## Deployment

The application auto-deploys to GitHub Pages via GitHub Actions on push to main branch. The workflow:
1. Installs dependencies with `npm ci`
2. Runs linting with `npm run lint`
3. Builds with `npm run build`
4. Deploys to GitHub Pages

Base URL is configured for GitHub Pages at `/pcap-analyzer/` in `vite.config.ts`.

## Troubleshooting

### PCAP Parsing Issues
- Check endianness detection in `PcapParser`
- Verify packet header alignment (some captures have padding)
- O-RAN headers may vary by vendor implementation

### Performance Issues
- Large files may cause memory issues - consider file size limits
- Chart rendering can slow with >50K points - implement data decimation
- Consider implementing packet streaming for very large captures

### Build Issues
- Ensure TypeScript compilation passes before build
- Chart.js requires proper registration of components
- CSS-in-JS not used - all styles in `App.css`