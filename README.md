# Sankam - AI Native Language Tutor 🌍

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Gemini API](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Sankam** is a high-performance, real-time conversational language learning platform powered by the **Google Gemini Multimodal Live API**. 

Unlike standard text-based chatbots, Sankam establishes a low-latency, bi-directional WebSocket audio stream to simulate natural human conversation. It features real-time pronunciation assessment using algorithmic string matching, a custom data analytics engine for fluency tracking, and a robust client-side architecture designed for scalability.

---

## 🛠️ Tech Stack

*   **Core Framework:** React 19, TypeScript, Vite
*   **AI Integration:** Google GenAI SDK (`@google/genai`), Gemini Multimodal Live API
*   **Audio Processing:** Web Audio API (`AudioContext`, `ScriptProcessorNode`), Raw PCM 16kHz Streaming
*   **Styling:** TailwindCSS (Glassmorphism Design System)
*   **State Management:** React Hooks + Repository Pattern
*   **Persistence:** `localStorage` (via Service Layer)

---

## 🧠 Architecture & Engineering

Sankam is built with a focus on separation of concerns and algorithmic efficiency.

### 1. Repository Pattern (`utils/history-service.ts`)
To decouple the UI layer from the data persistence layer, a **Service Repository Pattern** was implemented. The `SessionRepository` class manages all CRUD operations for user history. 
*   **Benefit:** This abstraction allows the underlying storage mechanism (currently `localStorage`) to be swapped for a remote database (PostgreSQL/Firebase) without refactoring UI components.
*   **Simulation:** Async methods mimic real-world network latency to handle loading states gracefully.

### 2. Real-time Audio Pipeline (`hooks/use-live-api.ts`)
The application bypasses standard high-latency HTTP requests in favor of a persistent WebSocket connection.
*   **Input:** Captures microphone input via `MediaStream`, downsamples Float32 audio to **16kHz Int16 PCM** chunks, and streams directly to Gemini.
*   **Output:** Receives raw PCM chunks from the model, buffers them dynamically using an `AudioBufferSourceNode`, and manages a play-queue cursor (`nextStartTime`) to ensure gapless playback.

### 3. Algorithmic Pronunciation Analysis (`utils/pronunciation-service.ts`)
Pronunciation scoring is determined mathematically, not randomly.
*   **Levenshtein Distance Algorithm:** A dynamic programming approach that calculates the minimum number of single-character edits (insertions, deletions, substitutions) required to change the spoken word into the target word.
*   **Complexity:** O(m*n) matrix calculation per word.
*   **Visualization:** This score (0.0 - 1.0) drives the Green/Yellow/Red UI feedback loop.

### 4. Analytics Engine (`utils/analytics-engine.ts`)
A dedicated math utility calculates learning metrics on the fly:
*   **WPM (Words Per Minute):** `(Word Count / Duration in Minutes)`
*   **Fluency Score:** A weighted composite index combining speed (WPM) and interaction density.
*   **Vocabulary Diversity:** Statistical analysis of unique token usage.

---

## ⚡ Key Features

### 🎙️ Low-Latency Voice Interaction
Full-duplex communication allowing the user to interrupt the AI. The system handles audio buffering and context management to prevent drift.

### 📊 Active Learning Feedback
*   **Color-Coded Transcripts:** Words are analyzed in real-time.
    *   🟢 **Green:** Perfect match (Levenshtein score > 0.8)
    *   🟡 **Yellow:** Understandable accent (Score > 0.5)
    *   🔴 **Red:** Mispronounced (Score < 0.5)
*   **Click-to-Pronounce:** Users can click any word to trigger a high-fidelity TTS generation of that specific term for comparison.

### 🎭 Scenario-Based Roleplay
State injection is used to condition the LLM into specific personas (e.g., "Stubborn Taxi Driver," "Greedy Market Vendor"). Hidden objectives are injected into the system prompt to prevent passive AI behavior.

### 📉 User Analytics Dashboard
A glassmorphic dashboard visualizing study streaks, total speaking time, and fluency progression over time using the aggregated data from the `SessionRepository`.

---

## 🔧 Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/sankam.git
    cd sankam
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file and add your Google Gemini API key:
    ```env
    API_KEY=your_google_genai_api_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📝 License
[MIT](https://choosealicense.com/licenses/mit/)
