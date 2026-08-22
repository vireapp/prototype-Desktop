<div align="center">
  <img src="resources/images/vire_logo.png" alt="VIRE Logo" width="150" height="150" />
  <h1>VIRE Desktop</h1>
  <p><b>A Next-Generation, AI-Powered Desktop Experience</b></p>
  
  [![Version](https://img.shields.io/badge/version-1.0.2-blue.svg?style=for-the-badge)](https://xvire.in)
  [![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
  [![Electron](https://img.shields.io/badge/Electron-41.0.4-191970.svg?style=for-the-badge&logo=Electron)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=for-the-badge&logo=React)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=for-the-badge&logo=TypeScript)](https://www.typescriptlang.org/)
</div>

<br/>

## 🚀 Overview

**VIRE** is a cutting-edge desktop application built to deliver a seamless, intelligent, and highly optimized user experience. Merging the capabilities of native desktop performance with the versatility of modern web technologies, VIRE provides a beautiful, fluid interface powered by both local and cloud-based AI.

Every pixel, animation, and system integration in VIRE has been meticulously crafted to bridge the gap between heavy AI functionalities and a lightning-fast native UI.

## ✨ Key Features & Modules

- **🧠 Deep AI Integration**: Powered by Groq, Google Generative AI, and local LLMs (`@mlc-ai/web-llm`) to offer blazing-fast, secure, and private AI interactions directly on your machine.
- **⚡ Blazing Fast Performance**: Built on Electron with a deeply optimized React & TypeScript frontend, ensuring low latency and smooth execution.
- **🎨 Stunning & Fluid UI/UX**: Crafted with TailwindCSS 4, Radix UI, Framer Motion, and GSAP. Enjoy buttery-smooth micro-interactions, responsive layouts, and a premium aesthetic.
- **🔄 Real-Time Synchronization**: Backed by Supabase for secure, real-time database updates and robust authentication across devices.
- **🎬 Rich Media & Interactions**: Fully integrated Giphy support, Lottie vector animations, native Emoji pickers, dynamic Markdown rendering, and native YouTube/video playback.
- **🏆 Gamification System**: Built-in logic for tracking user sessions, daily logins, and awarding XP to drive engagement and retention.
- **🖼️ Bento Grid Dashboard**: A visually striking, highly interactive dashboard layout that beautifully displays user stats and quick actions.

## 🛠️ Architecture & Tech Stack

VIRE utilizes a robust and modern stack designed for scalability and maintainability:

- **Core Framework**: [Electron](https://www.electronjs.org/) & [React 19](https://react.dev/)
- **Language**: Strictly typed [TypeScript](https://www.typescriptlang.org/)
- **Styling Engine**: [TailwindCSS 4](https://tailwindcss.com/) & Headless UI via [Radix UI](https://www.radix-ui.com/)
- **Motion & Animation**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) combined with [Immer](https://immerjs.github.io/immer/) for immutable state updates.
- **Backend Infrastructure**: [Supabase](https://supabase.com/) for Auth, Postgres DB, and Realtime subscriptions.
- **Build System**: [Electron Vite](https://electron-vite.org/) for rapid HMR and optimized production bundling.

## 🚀 Getting Started

### Prerequisites

To build and run VIRE locally, you will need:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn package manager

### Installation

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/vireapp/prototype-Desktop.git
cd prototype-Desktop
npm install
```

### Development Environment

Run the application in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Building for Production

Package and distribute the application for your specific operating system:

```bash
# Build a Windows executable
npm run build:win

# Build a macOS DMG/App
npm run build:mac

# Build a Linux AppImage/Snap
npm run build:linux
```

## 🔒 Privacy, Security, & Open Source Strategy

While VIRE embraces the open-source community by making this repository public, **certain system-critical files, proprietary backend configurations, and core application logic (such as native C++ modules and preload scripts) are intentionally excluded from the public view.** 

This hybrid approach allows the community to explore and learn from the UI/UX implementations, while maintaining the security and intellectual property of the core engine.

## 👨‍💻 The Solo Developer Journey

**VIRE is proudly built, designed, and maintained by a solo developer.** 

Creating a desktop application of this scale—balancing complex local LLM execution, real-time backend synchronization, and high-fidelity animations—has been a journey of immense passion. Every line of code, UI decision, and architectural design was crafted single-handedly with the goal of pushing the boundaries of what a modern desktop app can be.

## 🤝 Contributing

While the core modules are proprietary and closed-source, we welcome contributions to the open-source frontend UI! If you find a bug, have a feature request, or want to improve the UI components:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingUIFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingUIFeature'`)
4. Push to the Branch (`git push origin feature/AmazingUIFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

## 🌐 Links & Resources

- **Website**: [xvire.in](https://xvire.in)

---
<div align="center">
  <i>Built with immense passion and late nights.</i>
</div>
