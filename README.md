# justmakeit

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

