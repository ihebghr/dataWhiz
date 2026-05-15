<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 DataWhiz AI - Intelligent Data Cleaning Suite

DataWhiz AI is a sophisticated, AI-powered web application designed to turn messy datasets into analysis-ready insights in seconds. It combines automated statistical profiling with an intelligent cleaning engine to handle the most tedious parts of data preparation.

## ✨ Features

- ⚡ **Quick Clean (AI-Powered)**: A principal-engineer level agent analyzes your dataset and applies complex repairs (encoding, type casting, imputation) instantly.
- 💬 **Interactive Data Chat**: Chat with your dataset! Ask questions for analysis or give natural language commands like *"make names uppercase"* or *"fill nulls in Age with mean"*.
- 📊 **Automated Profiling**: Instant statistical breakdown of every column (missing values, distributions, unique counts, data types).
- 🧠 **Smart Suggestions**: Proactive recommendations based on detected vulnerabilities in your data.
- 🔄 **Full Audit Trail**: Every action is logged with "Undo" capabilities to ensure data integrity.
- ☁️ **Cloud Integration**: Seamlessly save your cleaned data to Google Drive or export as CSV, JSON, and PDF.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Express & Node.js (Vercel Serverless Functions).
- **AI Engine**: Groq SDK (Llama 3.1 8B/70B) for ultra-fast inference.
- **Authentication**: Firebase Auth (Google Login).
- **Storage**: Google Drive API integration.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Groq API Key (get it at [console.groq.com](https://console.groq.com/))
- Firebase project credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/datawhiz-ai.git
   cd datawhiz-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   # Add your Firebase and Google Drive credentials here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is optimized for **Vercel**. 

1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Add your Environment Variables (especially `GROQ_API_KEY`) in the Vercel Dashboard.
4. Deploy!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ for data engineers and analysts.
