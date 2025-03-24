const express = require('express');
const cors = require('cors');
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const PDF_PATH = 'C:/Program Files (x86)/ACS Motion Control/SPiiPlus Documentation Kit/Software Guides/ACSPL-Commands-Variables-Reference-Guide.pdf';

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
    console.error("PDF parsing error:", err);
    res.status(500).json({ error: 'Failed to read the documentation.' });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 Monty server is running at http://localhost:${PORT}`);
});
