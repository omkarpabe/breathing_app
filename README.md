# ❄️ Wim Hof Breathing · Premium Guided Breathwork

A premium, high-performance web application designed for guided Wim Hof breathing exercises. This app features a responsive dark-themed interface, real-time audio synchronization, and comprehensive session tracking to elevate your daily practice.

Visit the app: [Live Demo](https://breathingwork.netlify.app)

![Wim Hof Breathing App](https://img.shields.io/badge/Status-Premium-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-brightgreen?style=for-the-badge)

## ✨ Features

- **Guided Breathing Cycle**: A dynamic, glowing orb guides your inhale/exhale rhythm, perfectly synced with the professional audio track.
- **Multiple Retention Options**: Choose between 30-second, 1-minute, or 1:30-minute guided retention tracks.
- **Multi-Round Sessions**: Configure up to 10 rounds per session. Each round automatically loops the guided audio.
- **Advanced Synchronization**: The UI automatically waits for the audio track to finish before transitioning to the next round, ensuring your practice is always in sync.
- **Session Intelligence**:
  - **Live Statistics**: Tracks total rounds, total breaths, and your best retention time.
  - **Comprehensive Log**: A detailed history of every round completed in the current session.
  - **Persistence**: Automatically saves your preferences (breath count, rounds, sound state) and session history to your browser's local storage.
- **Premium Aesthetics**:
  - Glossy glassmorphism UI components.
  - Ambient particle background animation.
  - Responsive design for mobile and desktop.
  - Toast notifications for system feedback.

## ⌨️ Controls & Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Start / Pause Session** | `Space` / Click Orb |
| **Reset Session** | `Esc` / Reset Button |
| **Toggle Mute** | `M` / Sound Icon |

## 🛠️ Technical Overview

- **Core**: Semantic HTML5 and Vanilla TypeScript-ready JavaScript.
- **Styling**: Modern CSS3 using Custom Properties (Variables), Flexbox/Grid, and GPU-accelerated animations for 60FPS performance.
- **Audio Logic**: Integrated `<audio>` elements with event-driven state management to handle seamless looping and phase transitions.
- **Data**: Browser `localStorage` API for no-server persistence.

## 📂 File Structure

```text
wimhof/
├── audio/                   # Source MP3 guided tracks
│   ├── 30sec_retentation.mp3
│   ├── 1_minute_retentation.mp3
│   └── 1min30sec_retentation.mp3
├── app.js                   # State management and core logic
├── styles.css               # Premium design system and animations
├── index.html               # Main application entry point
└── README.md                # Documentation
```

## 🚀 Getting Started

Simply open `index.html` in any modern web browser. No installation or build process is required. Ensure the `audio/` directory contains the required MP3 files for the full experience.

---
*Inspired by the Wim Hof Method. Breathe deep and enjoy the cold.*
