const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const pdf = require('pdf-parse');
const fetch = require('node-fetch'); // Make sure you're using node-fetch@2

dotenv.config();

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '11mb' })); // 💡 Increase payload limit
app.use(express.static(path.join(__dirname, 'public')));


// Constants
const PDF_PATH = 'C:/Program Files (x86)/ACS Motion Control/SPiiPlus Documentation Kit/Software Guides/ACSPL-Commands-Variables-Reference-Guide.pdf';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Route: Search PDF for text
app.get('/search', async (req, res) => {
  const query = req.query.query?.toLowerCase();
  if (!query) return res.status(400).json({ error: 'No query provided' });

  try {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;

    const index = text.toLowerCase().indexOf(query);
    if (index === -1) {
      return res.json({ text: `No results found for "${query}".` });
    }

    const snippet = text.slice(Math.max(0, index - 300), index + 1000);
    res.json({ text: snippet });
  } catch (err) {
    console.error("📄 PDF parsing error:", err);
    res.status(500).json({ error: 'Failed to read the documentation.' });
  }
});

// Route: Chat with Gemini and log to daily folder
app.post('/api/gemini', async (req, res) => {
  const userInput = req.body.prompt;
  console.log("🔹 Received prompt:", userInput);

  if (!userInput) {
    console.log("❌ Missing prompt");
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userInput }] }]
      })
    });

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    res.json({ reply });

    // 📁 Log to dated folder
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0]; // e.g., 2025-03-24
    const logDir = path.join(__dirname, 'logs', dateFolder);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'log.txt');
    const logEntry = `[${now.toISOString()}]\nUSER: ${userInput}\nREPLY: ${reply}\n\n`;

    fs.appendFile(logFile, logEntry, (err) => {
      if (err) console.error("❌ Failed to write to log file:", err);
    });

  } catch (err) {
    console.error("❌ Gemini API error:", err);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Monty server is running at http://10.0.0.58:${PORT}`);
});
