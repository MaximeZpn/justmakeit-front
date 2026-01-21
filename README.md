# justmakeit


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.






# 🎵 justmakeit

> **The AI-powered music maker to resample audio & jumpstart composition. No more writer's block.**

## 📖 Overview

**justmakeit** is a web-based "Simili-DAW" (Digital Audio Workstation) designed to bridge the gap between inspiration and production. It allows producers to upload raw audio samples and instantly generate rhythmic context around them using Artificial Intelligence.

The project is built with a **Cloud-Native approach**, leveraging **Java Spring Boot** for complex backend logic and **AWS** for scalable infrastructure.

## 🚀 Key Features & Roadmap

The project is divided into two development phases:

### Phase 1: The Core Sequencer (MVP)
* **Interactive Web Sequencer:** A responsive 16-step grid interface for pattern composition.
* **Sample Management:** Upload custom `.wav` files directly to cloud storage.
* **BPM Control:** Manual BPM adjustment with visual feedback.
* **Drum Rack:** Add/Remove drum instruments (Kick, Snare, Hi-Hats) from a curated server-side library.
* **Real-time Playback:** Browser-based audio rendering using `Tone.js`.

### Phase 2: AI Co-Producer (In Progress)
* **Smart Analysis:** Automatic BPM and key detection of uploaded samples using audio processing algorithms (Java DSP).
* **AI Pattern Generation:** Generative Drum patterns based on requested style (e.g., *Trap, House, Lo-Fi*) and tempo context.
* **Intelligent Resampling:** Auto-chopping and time-stretching samples to fit the grid.
* **Export:** Generate downloadable MIDI files and Project ZIPs for major DAWs (FL Studio, Ableton).

## 🛠 Technical Stack

### Backend
* **Language:** Java 21
* **Framework:** Spring Boot 3 (Web, Data JPA)
* **AI & Logic:** LangChain4j (LLM Integration), TarsosDSP (Audio Processing)
* **Database:** PostgreSQL (Metadata & User Projects)

### Frontend
* **Framework:** React (Vite)
* **Audio Engine:** Tone.js (Web Audio API wrapper)
* **Styling:** Tailwind CSS

### Infrastructure & DevOps (AWS)
* **IaC:** AWS CDK (Infrastructure as Code in Java/TypeScript)
* **Storage:** Local Filesystem (Dev/MVP)
* **Compute:** AWS Fargate (Serverless Containers)
* **CI/CD:** GitHub Actions

## 🏗 Architecture

* **Controller Layer:** REST API endpoints handling project state and user uploads.
* **Service Layer:** Business logic for sample processing and LLM prompt engineering.
* **Integration:**
    * *Storage Service:* Asynchronous file upload/download.
    * *AI Service:* Prompt generation for drum patterns (JSON output) + Audio feature extraction.

## 📦 Getting Started

### Prerequisites
* JDK 21
* Docker & Docker Compose
* Node.js 20+
* AWS CLI configured (for deployment)

### Installation
1.  Clone the repo
    ```bash
    git clone https://github.com/MaximeZpn/justmakeit.git
    ```
2.  Start the Backend (Local)
    ```bash
    # From the project root
    ./mvnw spring-boot:run
    ```
3.  Start the Frontend
    ```bash
    cd frontend
    npm install && npm run dev
    ```
    > Open [http://localhost:5173](http://localhost:5173) to view the app. The backend runs on port 8080.

---
*Built by [Maxime Zoppini] - 2026*

framework:
- next.js
- UI - garder l'existant

BDD:
- Supabase 

Auth
- Better auth pour nextJS

