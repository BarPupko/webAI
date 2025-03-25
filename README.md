# 🐎 Monty - ACS AI Assistant

**Monty** is a local AI-powered assistant designed to help users interact with and understand the **ACS Motion Control** ecosystem. It integrates **Gemini AI**, local PDF search, and a lightweight chat interface to provide quick technical help — including **ACSPL command examples**, real-time responses, and documentation snippets.

---

## ✨ Features

- 💬 Chat with Monty, a smart assistant specialized in ACS Motion Control.
- 📄 Upload or connect to local ACS documentation PDFs.
- 🔍 Search PDF content by text or command queries.
- 🤖 AI responses powered by [Gemini 2.0 Flash](https://ai.google.dev/).
- 🧠 Understand ACSPL commands with code examples.
- 📁 Logs all user queries and responses daily.
- 📌 Supports copy-to-clipboard for generated code blocks with `!`-style ACSPL comments.

---

## 🧱 Tech Stack

| Component       | Description                         |
|----------------|-------------------------------------|
| Node.js         | Backend server                     |
| Express.js      | Web framework                      |
| PDF-Parse       | Local PDF content extraction       |
| dotenv          | Environment variable management     |
| Gemini API      | AI responses via Google's Gemini   |
| HTML + JS       | Frontend interface                 |
| PDF.js          | Client-side PDF rendering (optional)|
| Tailwind CSS / Toast (optional) | For styling & UX        |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-username/monty-ai-chat.git
cd monty-ai-chat
