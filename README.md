# OpenBrain

> A fully client-side, privacy-first AI chat application that runs large language models entirely in your browser. No servers, no data collection, no compromises.

[![Built with React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Supported Models](#supported-models)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Browser Compatibility](#browser-compatibility)
- [Performance Notes](#performance-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

OpenBrain is an open-source AI assistant that executes large language models (LLMs) **entirely within the user's browser**. Unlike traditional AI chat services, OpenBrain never sends your data to external servers. The model weights are downloaded once, cached locally, and all inference happens on-device using WebGPU acceleration (with WASM fallback).

This makes OpenBrain ideal for:
- Users who value **data privacy** and don't want conversations stored on third-party servers
- Developers exploring **client-side ML inference** with modern browser APIs
- Offline environments where internet access is limited or unavailable after initial setup
- Research into **decentralized AI** and edge computing paradigms

---

## Key Features

### 1. 🔒 Complete Privacy — Local Execution
- All AI inference runs on the client device (CPU/GPU)
- Zero network requests after model download
- Chat history stored in **IndexedDB** — never leaves your browser
- Settings persisted in **localStorage**
- No analytics, no telemetry, no tracking

### 2. ⚡ Hardware-Accelerated Inference (WebGPU + Web Worker)
- Automatic **WebGPU** detection for GPU-accelerated inference
- Transparent fallback to **WebAssembly (WASM)** on unsupported browsers
- **Web Worker isolation** — all model loading and inference runs in a dedicated worker thread, keeping the UI fully responsive during generation
- Leverages `@huggingface/transformers` v3 pipeline API

### 3. 🌊 Real-Time Streaming Responses
- Token-by-token streaming output using `TextStreamer` API
- Responses appear progressively (ChatGPT-style typing effect)
- **Stop generation** button to abort responses mid-stream
- Accumulated tokens rendered via `react-markdown` with live cursor indicator

### 4. 📄 Local PDF Analysis (Client-Side RAG)
- Upload PDF documents directly in the chat interface
- Text extraction powered by `pdfjs-dist` (Mozilla's PDF.js)
- Extracted content injected as context into the system prompt
- Smart context truncation to prevent overwhelming small models
- All processing happens in-browser — documents never leave your device

### 5. 🧠 Persistent User Memory
- AI automatically extracts facts about the user from conversations
- Memory stored locally in IndexedDB for cross-session personalization
- Manual fact addition and deletion supported
- Memory context injected into system prompt for personalized responses

### 6. 📚 Knowledge Base (RAG)
- Upload permanent reference documents (PDF, TXT, MD, CSV, JSON)
- Documents stored in IndexedDB and available across all conversations
- Full document content used as retrieval context for AI responses
- Manage and delete documents from the Knowledge Base panel

### 7. 🗂️ Model Management System
- **Quick activation bar** in chat — switch models without going to settings
- **Cache detection** — identifies downloaded models for instant activation
- **Delete from cache** — remove model weights to free disk space
- **Hardware-aware recommendations** — suggests the best model based on device RAM
- **Model switching** — properly unloads previous model before loading a new one

### 8. 📶 Offline-First PWA
- Installable as a **Progressive Web App** (PWA)
- Service Worker caches application shell (HTML/CSS/JS)
- Model weights cached via Cache Storage API after first download
- Full functionality in airplane mode after initial setup

### 9. 🌐 Bilingual Interface (English / Arabic)
- Complete UI localization for **English** and **Arabic**
- RTL (Right-to-Left) layout support for Arabic
- Language toggle accessible from the sidebar
- AI responds in whatever language the user writes in

### 10. 💬 Conversation Management
- Persistent chat history with IndexedDB
- Multiple conversations with automatic titling
- Create, switch, and delete conversations from the sidebar
- Full conversation context maintained across sessions

### 11. 🔐 Data Sovereignty (Export / Import / Delete)
- **Export** all data (conversations, memory, knowledge base) as a JSON backup file
- **Import** data from backup to restore or migrate between devices
- **Delete all data** with confirmation dialog for complete privacy wipe
- Full user control over their data at all times

### 12. 🎛️ Customizable AI Identity
- Configure a custom **assistant name**
- Define **system instructions** to control personality, tone, and behavior
- Adjustable generation parameters:
  - `temperature` (0.0 – 1.5) — controls response creativity
  - `maxTokens` (64 – 2048) — controls response length

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐  │
│  │   React UI   │   │         Web Worker Thread            │  │
│  │  (ChatArea,  │   │  ┌──────────────────────────────┐   │  │
│  │  Sidebar,    │◄──┤  │  AI Engine (@huggingface/    │   │  │
│  │  Settings,   │   │  │  transformers pipeline)       │   │  │
│  │  Knowledge)  │   │  └──────────────────────────────┘   │  │
│  └──────┬───────┘   └──────────────────────────────────────┘  │
│         │                                                      │
│  ┌──────▼──────────────────────────────────────────────────┐  │
│  │                   Storage Layer                          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │  │
│  │  │  IndexedDB    │ │Cache Storage │ │  localStorage   │  │  │
│  │  │ • Chats       │ │ • Model      │ │ • Settings      │  │  │
│  │  │ • Memory      │ │   Weights    │ │ • Preferences   │  │  │
│  │  │ • Knowledge   │ │              │ │                 │  │  │
│  │  └──────────────┘ └──────────────┘ └─────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              WebGPU / WASM Runtime                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │
         │ (One-time download only)
         ▼
┌─────────────────┐
│  Hugging Face   │
│  Model Hub      │
│  (CDN)          │
└─────────────────┘
```

### Data Flow

1. **Model Loading**: User selects a model → Web Worker downloads weights from HF CDN → cached in Cache Storage → loaded into WebGPU/WASM runtime
2. **Message Processing**: User input → memory & knowledge context gathered → prepended with system instructions → sent to Worker → tokens streamed back to UI
3. **PDF Analysis**: PDF uploaded → text extracted via `pdfjs-dist` → truncated to 3000 chars → appended to system prompt
4. **Memory Extraction**: User messages analyzed for personal facts → stored in IndexedDB → injected into future conversations
5. **Data Export**: All IndexedDB stores serialized to JSON → downloaded as backup file

---

## Supported Models

| Model | ID | Size | Arabic | Min RAM | Description |
|-------|------|------|--------|---------|-------------|
| **SmolLM2 360M** | `smollm2-360m` | ~350 MB | ❌ | 1 GB | Ultra-lightweight. Fast loading, good for testing. English-focused. |
| **Qwen2.5 0.5B** | `qwen2.5-0.5b` | ~300 MB | ✅ | 2 GB | Small & multilingual. Supports Arabic, English, Chinese & more. 4-bit quantized (q4). |
| **Qwen2.5 1.5B** | `qwen2.5-1.5b` | ~900 MB | ✅ | 4 GB | Great quality. Excellent Arabic & multilingual support. 4-bit quantized (bnb4). |
| **SmolLM2 1.7B** | `smollm2-1.7b` | ~1.7 GB | ❌ | 4 GB | Good English quality. Fast inference. |

> **Note**: Models are downloaded once and cached. Subsequent visits load from cache instantly. The system auto-recommends a model based on your device's available RAM.

### Why Not Gemma 4?

Gemma 4 models (E2B, E4B) use a multimodal architecture (image-text-to-text) with Per-Layer Embeddings (PLE) that result in enormous embedding tables (~9.4 GB for E2B). This makes them impractical for browser-based inference. OpenBrain focuses on text-generation models that fit within browser memory constraints.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript 5 |
| **Build Tool** | Vite 5 (with ES module Web Worker support) |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **AI Runtime** | `@huggingface/transformers` v3 (Web Worker) |
| **PDF Parsing** | `pdfjs-dist` 4.4 |
| **Local DB** | IndexedDB via `idb` (v8) |
| **Markdown** | `react-markdown` |
| **Routing** | React Router 6 |
| **Icons** | Lucide React |
| **PWA** | Custom Service Worker |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 or **Bun** ≥ 1.0
- A modern browser with **WebGPU** support (Chrome 113+, Edge 113+) for GPU acceleration
- At least **4 GB free RAM** for smaller models, **8 GB+** recommended for larger ones

### Installation

```bash
# Clone the repository
git clone https://github.com/zeyad-zahran/OpenBrain-OS.git
cd OpenBrain-OS

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

### Deployment

OpenBrain is a static site — deploy to any static hosting provider:

```bash
# Vercel (recommended — vercel.json included)
npx vercel

# Netlify
npx netlify deploy --prod --dir=dist

# GitHub Pages
# Set base in vite.config.ts, then deploy dist/ folder
```

---

## Usage Guide

### First Launch

1. Open the app in Chrome (WebGPU support recommended)
2. The **Model Activation Bar** appears on the chat screen
3. Select a model — cached models activate instantly, new models download first
4. Start chatting!

### Model Management

- **Quick activation**: Use the activation bar directly in chat
- **Switch models**: Click the dropdown next to the active model name
- **Delete cached models**: Click the 🗑️ icon to remove model weights from cache
- **Full management**: Go to **Settings** → **Model Manager** for detailed info

### Chatting

- Type your message and press **Enter** (or click Send)
- Responses stream in real-time, token by token
- Click the **■ Stop** button to abort generation mid-stream
- Use **Shift+Enter** for multi-line input
- Previous conversations are listed in the sidebar

### Attaching PDFs

- Click the **📎 paperclip** icon next to the input field
- Select a PDF file from your device
- The extracted text appears as a badge above the input
- All subsequent messages will use the PDF content as context
- Click **✕** on the badge to remove the PDF context

### Knowledge Base

- Open **Knowledge Base** from the sidebar
- Upload permanent reference documents (PDF, TXT, MD, CSV, JSON)
- Documents are available as context in all conversations
- Manage and delete documents as needed

### Data Privacy Controls

- **Export**: Click **Export Data** in the sidebar to download a JSON backup
- **Import**: Click **Import Data** to restore from a backup file
- **Delete All**: Click **Delete All Data** to permanently erase everything

### Customizing the Assistant

- **Settings** → **Personality** → **Assistant Name**: Change the displayed name
- **Settings** → **Personality** → **System Instructions**: Define personality and behavior
- **Settings** → **General** → **Temperature**: Lower = more focused, Higher = more creative
- **Settings** → **General** → **Max Tokens**: Control maximum response length

### Switching Languages

- Click the **🌐 language** button in the sidebar
- Toggle between English and العربية
- The entire UI adapts, including RTL layout for Arabic

---

## Project Structure

```
openbrain/
├── public/
│   ├── brain-icon.svg          # App icon (SVG)
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker for offline support
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ChatArea.tsx        # Main chat interface with messages & input
│   │   ├── ChatSidebar.tsx     # Conversation list, export/import, navigation
│   │   ├── ModelActivationBar.tsx # Quick model activation widget
│   │   ├── KnowledgePanel.tsx  # RAG knowledge base management
│   │   ├── SettingsPanel.tsx   # Model selection & configuration UI
│   │   ├── NavLink.tsx         # Navigation link component
│   │   └── ui/                 # shadcn/ui component library
│   ├── hooks/
│   │   ├── useChat.ts          # Chat state management, generation, abort
│   │   ├── useAppSettings.ts   # Settings context & persistence
│   │   └── use-mobile.tsx      # Responsive breakpoint detection
│   ├── lib/
│   │   ├── ai-engine.ts        # WebGPU detection, model recommendation
│   │   ├── ai-worker.ts        # Web Worker: model loading & inference
│   │   ├── ai-worker-client.ts # Worker client: async message-passing API
│   │   ├── data-manager.ts     # Export/import/delete user data
│   │   ├── db.ts               # IndexedDB wrapper (chats, memory, knowledge)
│   │   ├── i18n.ts             # Internationalization (EN/AR translations)
│   │   ├── memory-manager.ts   # User fact extraction and storage
│   │   ├── pdf-extractor.ts    # Client-side PDF text extraction
│   │   ├── settings.ts         # Settings types, defaults, model registry
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx           # Main app page with layout
│   │   └── NotFound.tsx        # 404 page
│   ├── App.tsx                 # Router configuration
│   ├── index.css               # Global styles & design tokens
│   └── main.tsx                # App entry point
├── index.html                  # HTML template with PWA meta tags
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite build configuration (ES worker format)
├── tsconfig.json               # TypeScript configuration
└── vercel.json                 # Vercel deployment config (SPA routing)
```

---

## Browser Compatibility

| Browser | WebGPU | WASM Fallback | Status |
|---------|--------|---------------|--------|
| Chrome 113+ | ✅ | ✅ | **Recommended** |
| Edge 113+ | ✅ | ✅ | Full support |
| Firefox 120+ | ⚠️ Flag | ✅ | WASM mode works well |
| Safari 18+ | ⚠️ Partial | ✅ | Limited WebGPU support |
| Mobile Chrome | ❌ | ✅ | Works but slow on most devices |

> **Best experience**: Desktop Chrome/Edge with a discrete GPU (NVIDIA/AMD).

---

## Performance Notes

### Memory Usage
- **SmolLM2 360M**: ~1 GB RAM during inference
- **Qwen2.5 0.5B**: ~1.5 GB RAM during inference
- **Qwen2.5 1.5B**: ~3 GB RAM during inference
- **SmolLM2 1.7B**: ~3.5 GB RAM during inference

### Inference Speed (Approximate)
| Device | Model | Tokens/sec |
|--------|-------|-----------|
| RTX 3060 (WebGPU) | SmolLM2 360M | ~40-60 |
| RTX 3060 (WebGPU) | Qwen2.5 1.5B | ~15-25 |
| M1 MacBook (WASM) | SmolLM2 360M | ~10-20 |
| M1 MacBook (WASM) | Qwen2.5 1.5B | ~3-8 |

### Optimization Tips
- Close other browser tabs to free GPU memory
- Use WebGPU-enabled browsers for 3-5x speed improvement over WASM
- Start with smaller models to verify your setup works
- Clear model cache from the Settings panel if you need to free disk space

---

## Roadmap

- [x] Web Worker isolation for non-blocking UI during inference
- [x] Multilingual model support (Qwen2.5 with Arabic)
- [x] Smart model recommendation based on device capabilities
- [x] Model cache detection and quick activation system
- [x] Model deletion from cache
- [x] Stop generation mid-stream
- [x] Persistent user memory system
- [x] Knowledge Base (RAG) with document upload
- [x] Data export/import/delete for full privacy control
- [ ] Local vector database (Orama/Voy) for advanced semantic RAG
- [ ] Dark/Light theme toggle
- [ ] Code syntax highlighting in responses
- [ ] Voice input (Web Speech API)
- [ ] Multi-turn context window management
- [ ] Custom model URL support (ONNX)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode conventions
- Use semantic Tailwind tokens from the design system (no hardcoded colors)
- Keep components small and focused (< 200 lines)
- Test in both WebGPU and WASM modes
- Ensure RTL compatibility for Arabic locale

---

## 🛡️ License & Data Sovereignty

This project is licensed under the **Polyform Noncommercial License 1.0.0**. 

* **For Individuals & Researchers:** You are free to explore, contribute, and evolve this collective intelligence.
* **For Commercial Entities:** Use, redistribution, or integration into commercial products is **strictly prohibited** without explicit written permission.
* **Privacy First:** Users maintain 100% ownership of their cognitive data. You can view, export, or permanently purge your learned patterns at any time.

---

<p align="center">
  <strong>OpenBrain</strong> — The Decentralized Collective Intelligence. <br>
  <em>Owned by Everyone. Controlled by No One. Private by Design.</em>
</p>


