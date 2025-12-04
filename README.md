# wwwtriplew.me 🎯

[![Live Site](https://img.shields.io/badge/Live-wwwtriplew.me-7B9669?style=flat-square)](https://wwwtriplew.me)
[![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-181717?style=flat-square&logo=github)](https://pages.github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> **Personal portfolio and interactive chess engine platform by Ng Ho Hin**  
> A minimalist, scroll-driven storytelling site featuring **Piperlove**, a custom-built chess engine with drag-and-drop gameplay.

---

## 🌐 Overview

This is my personal website showcasing my journey in algorithm design, performance computing, and human-centered interface development. The centerpiece is **Piperlove**, a chess engine I built from scratch with bitboard representation and UCI protocol support.

**Live Demo:** [wwwtriplew.me](https://wwwtriplew.me)  
**Play Chess:** [wwwtriplew.me/piperlove/play.html](https://wwwtriplew.me/piperlove/play.html)

---

## ✨ Features

### 🎨 **Portfolio Site**
- **Scroll-driven storytelling** with parallax effects and layered animations
- **Minimal, elegant design** optimized for readability and performance
- **Bilingual content** (English & Chinese) for journal entries
- **Responsive layout** that adapts seamlessly across devices

### ♟️ **Piperlove Chess Engine**
- **Interactive gameplay** with drag-and-drop piece movement
- **Legal move validation** with visual indicators (dots for moves, rings for captures)
- **Complete chess rules** including castling, en passant, and pawn promotion
- **Real-time evaluation bar** showing position advantage (±5 pawns range)
- **Move history** with algebraic notation display
- **Board flipping** to view from either player's perspective
- **Engine statistics** including search depth, nodes evaluated, and principal variation

### ⚙️ **Backend API**
- **FastAPI server** hosted on RackNerd VPS at `api.wwwtriplew.me`
- **UCI protocol** for engine communication
- **Bitboard representation** for efficient position evaluation
- **Configurable thinking time** (100ms - 60s per move)
- **CORS-enabled** for cross-origin requests from GitHub Pages

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     wwwtriplew.me                           │
│                   (GitHub Pages)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Portfolio   │  │  Piperlove   │  │    Blog      │     │
│  │   Landing    │  │   Landing    │  │  Journals    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                               │
│         └──────────────────┴───────────┐                   │
│                                        │                   │
│                          ┌─────────────▼─────────────┐     │
│                          │   play.html (Game UI)     │     │
│                          │  • Drag & Drop Interface  │     │
│                          │  • Move Validation        │     │
│                          │  • Evaluation Bar         │     │
│                          └─────────────┬─────────────┘     │
└────────────────────────────────────────┼───────────────────┘
                                         │
                          HTTPS POST     │
                          /move          │
                                         │
┌────────────────────────────────────────▼───────────────────┐
│              api.wwwtriplew.me (RackNerd VPS)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI Backend                         │  │
│  │  • UCI Protocol Communication                        │  │
│  │  • Bitboard Chess Engine                            │  │
│  │  • Position Evaluation & Move Generation            │  │
│  │  • Search Algorithm (Minimax + Alpha-Beta)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

### Frontend
- **Pure HTML/CSS/JavaScript** – No frameworks, just clean, performant code
- **SVG chess pieces** – Crisp rendering at any scale
- **CSS Grid & Flexbox** – Modern layout system
- **Fetch API** – Async communication with backend

### Backend
- **FastAPI** (Python) – High-performance API framework
- **UCI Protocol** – Universal Chess Interface for engine communication
- **Bitboards** – Efficient 64-bit board representation
- **CORS middleware** – Secure cross-origin requests

### Infrastructure
- **GitHub Pages** – Static site hosting (frontend)
- **RackNerd VPS** – Ubuntu 24.04 LTS server (backend)
- **Custom domain** – `wwwtriplew.me` with CNAME configuration

---

## 📂 Project Structure

```
wwwtriplew.github.io/
├── index.html              # Main landing page
├── CNAME                   # Custom domain config
├── README.md               # This file
│
├── assets/
│   ├── css/
│   │   └── style.css       # Global styles
│   ├── js/
│   │   ├── chess-engine.js # API client for engine
│   │   └── api-test.html   # API testing interface
│   ├── chessBoardUI/       # SVG piece assets (wK.svg, bQ.svg, etc.)
│   ├── img/                # Bitmap emojis & decorative images
│   └── audio/              # (Reserved for future features)
│
├── piperlove/
│   ├── index.html          # Piperlove landing page
│   └── play.html           # Interactive chess game (1098 lines)
│
└── blog/
    ├── first-post.html     # Initial journal entry
    ├── journal-01-en.html  # Journal #1 (English)
    ├── journal-01-zh.html  # Journal #1 (Chinese)
    ├── journal-02-en.html  # Journal #2 (English) - VPS migration
    └── journal-02-zh.html  # Journal #2 (Chinese)
```

---

## 🎮 How to Play

1. **Visit the game page:** [wwwtriplew.me/piperlove/play.html](https://wwwtriplew.me/piperlove/play.html)
2. **Play as White** (engine plays Black)
3. **Make your move:**
   - **Click** a piece to select it, then click the destination square
   - **Drag & drop** a piece to the desired location
4. **Legal moves** are highlighted with dots (empty squares) or rings (captures)
5. **Castling:** Click the king and then the target square (g1 for kingside, c1 for queenside)
6. **Pawn promotion:** A modal appears when reaching the back rank
7. **Engine thinks for ~12 seconds** per move (configurable in code)

### Game Controls
- **New Game** – Reset the board
- **Undo Move** – Take back the last 2 moves (yours + engine's)
- **Flip Board** – View from Black's perspective

---

## 🔧 API Reference

### `POST /move`

**Endpoint:** `https://api.wwwtriplew.me/move`

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "ai_thinking_ms": 12000
}
```

**Response:**
```json
{
  "move": "e2e4",           // UCI format
  "score": 15,              // Centipawns (+ = White, - = Black)
  "depth": 50,              // Search depth reached
  "nodes": 85441,           // Positions evaluated
  "nps": 5187,              // Nodes per second
  "time_ms": 16470,         // Actual computation time
  "pv": "e2e4 e7e5 g1f3"    // Principal variation (best line)
}
```

### `GET /health`

**Endpoint:** `https://api.wwwtriplew.me/health`

**Response:**
```json
{
  "status": "ok",
  "engine": "Piperlove",
  "version": "1.0"
}
```

---

## 📊 Engine Specifications

| Feature | Status |
|---------|--------|
| **Board Representation** | 8×8 array (row 0 = rank 8, row 7 = rank 1) |
| **Move Generation** | Pseudo-legal moves with legal validation |
| **Castling** | ✅ Kingside & Queenside (both colors) |
| **En Passant** | ✅ Fully implemented |
| **Pawn Promotion** | ✅ Queen, Rook, Bishop, Knight |
| **Search Algorithm** | Minimax with Alpha-Beta pruning |
| **Evaluation** | Material + positional heuristics |
| **Opening Book** | 🚧 In development |
| **Estimated ELO** | ~1000 (improving with each iteration) |

---

## 🛠️ Development Setup

### Frontend (Local Testing)

```bash
# Clone the repository
git clone https://github.com/wwwtriplew/wwwtriplew.github.io.git
cd wwwtriplew.github.io

# Serve locally (any HTTP server works)
python3 -m http.server 8000
# OR
npx serve

# Open in browser
open http://localhost:8000
```

### Backend (API Server)

The backend is hosted on a private VPS. To run your own instance:

1. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn chess python-chess
   ```

2. **Run the server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Update API endpoint** in `assets/js/chess-engine.js`:
   ```javascript
   const ChessEngine = {
     API_URL: 'http://localhost:8000',
     // ...
   }
   ```

---

## 📝 Journal Entries

The blog documents my journey building Piperlove:

- **[Journal #1](blog/journal-01-en.html)** – Initial launch and first insights
- **[Journal #2](blog/journal-02-en.html)** – VPS migration and opening table work

Each entry is available in both **English** and **中文 (Chinese)**.

---

## 🐛 Known Issues & Future Plans

### Current Limitations
- ⚠️ **No check/checkmate detection** in UI (engine knows, but UI doesn't highlight)
- ⚠️ **No draw detection** (50-move rule, threefold repetition, insufficient material)
- ⚠️ **No time controls** (games are untimed)

### Roadmap
- [ ] Opening book integration (Polyglot format)
- [ ] Endgame tablebase support (Syzygy)
- [ ] Advanced evaluation (pawn structure, king safety, mobility)
- [ ] Search improvements (null move pruning, late move reductions)
- [ ] Multiplayer mode (human vs. human)
- [ ] Difficulty levels (adjustable depth/time)
- [ ] Move analysis mode (show engine's top 3 moves)
- [ ] PGN export/import
- [ ] Game replay with annotations

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

- **Report bugs:** [GitHub Issues](https://github.com/wwwtriplew/wwwtriplew.github.io/issues)
- **Suggest features:** Open a discussion or issue
- **Contact:** s2121645@student.hpccss.edu.hk

---

## 👤 About the Author

**Ng Ho Hin (Andrew Wu / wwwtriplew)**

High school technologist passionate about algorithm design, performance computing, and building systems that feel magical. Currently focused on chess engine development and recommendation systems.

- **Website:** [wwwtriplew.me](https://wwwtriplew.me)
- **GitHub:** [@wwwtriplew](https://github.com/wwwtriplew)
- **Location:** Hong Kong

---

## 🙏 Acknowledgments

- **Chess piece SVGs** – Custom-designed for crisp rendering
- **Hosting** – GitHub Pages (frontend) + RackNerd VPS (backend)
- **Inspiration** – Stockfish, Lichess, and the chess programming community

---

<div align="center">
  <strong>Built with ♟️ by wwwtriplew</strong><br>
  <sub>© 2025 Ng Ho Hin · Piperlove</sub>
</div>
