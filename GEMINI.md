# Project: PCAP Analyzer for O-RAN

## Project Overview

This is a web-based PCAP (Packet Capture) analyzer specifically designed for O-RAN (Open Radio Access Network) protocols. It's a client-side tool built with React and TypeScript that allows users to upload PCAP files, view detailed packet information, and perform analysis on the captured data. The primary focus is on eCPRI and O-RAN U-plane packets, including features like BFPC (Block Floating Point Compression) decompression and RMS (Root Mean Square) value calculations for IQ data.

The application is architected to be deployed on static web hosting services like GitHub Pages, with all processing and analysis performed in the browser.

## Building and Running

The project uses `npm` for package management and `vite` as a build tool.

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Run Development Server:**
    ```bash
    npm run dev
    ```
    This will start a local development server, typically at `http://localhost:5173`.

*   **Build for Production:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript code and bundles the application for production into the `dist` directory.

*   **Preview Production Build:**
    ```bash
    npm run preview
    ```
    This command serves the production build locally to test it before deployment.

*   **Deploy to GitHub Pages:**
    ```bash
    npm run deploy
    ```
    This script first builds the project and then uses the `gh-pages` library to deploy the contents of the `dist` directory to the `gh-pages` branch of the GitHub repository.

## Development Conventions

*   **Technology Stack:**
    *   **Frontend:** React 18 with TypeScript
    *   **Build Tool:** Vite
    *   **State Management:** React Hooks (including a custom `usePcapAnalyzer` hook) and potentially Zustand (based on dependencies).
    *   **Charting:** Chart.js with `react-chartjs-2` for data visualization.
    *   **Linting:** ESLint with TypeScript support.

*   **Project Structure:**
    The source code is organized in the `src` directory with a clear separation of concerns:
    *   `components/`: Contains the React components, further subdivided into `analyzer`, `charts`, `ui`, and `viewer`.
    *   `hooks/`: Holds custom React hooks, with `usePcapAnalyzer.ts` being the central piece of logic.
    *   `parsers/`: Includes modules for parsing PCAP files (`pcap.ts`) and O-RAN specific data (`oran.ts`).
    *   `processors/`: Contains logic for data processing, such as BFPC decompression (`bfpc.ts`) and RMS calculations (`rms.ts`).
    *   `types/`: Defines TypeScript types and interfaces used throughout the application.
    *   `utils/`: For utility functions.

*   **Deployment:**
    The project is set up for continuous deployment to GitHub Pages via a GitHub Actions workflow defined in `.github/workflows/deploy.yml`. The `vite.config.ts` is configured with `base: '/pcap-analyzer/'` to ensure correct asset paths on GitHub Pages.
