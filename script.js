let uploadedPdfText = "";

window.onload = () => {
  appendMessage("Monty", "👋 Hello! I’m 🐎Monty - Your ACS AI Assistant.\nHow can I help you today?");
};
async function getAIResponse(userInput) {
  const apiKey = 'AIzaSyBDU5lpolgT-6W_gYdQeYASXqIikl9QamE'; // Replace with your actual key

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userInput }] }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let formattedResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    // Optional: Format response (replace this with your real formatter)
    formattedResponse = formatAIResponse(formattedResponse);

    return formattedResponse;

  } catch (err) {
    return `❌ Error: ${err.message}`;
  }
}
function formatAIResponse(response) {
  return response
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **bold** to <strong>
      .replace(/\/\/.*?!/g, "!") // Replace everything from // to ! with !
      .replace(/\n\s*\n/g, "<br><br>") // Add extra spacing between paragraphs
      .replace(/\n- /g, "<ul><li>") // Convert bullet points to lists
      .replace(/<\/li>\n/g, "</li>") // Ensure bullet points close properly
      .replace(/<ul><br>/g, "<ul>") // Fix bullet point formatting issues
      .replace(/```([\s\S]*?)```/g, (_, code) => {
          const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return `
      <div class="code-block">
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
        <pre><code class="language-acspl">${escaped}</code></pre>
      </div>`;
      })
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // Format generic code
      .replace(/\n/g, "<br>"); // Convert new lines to HTML <br> for spacing
}

async function sendMessage() {
const input = document.getElementById('message'); // was 'userInput'
  const userInput = input.value.trim();
  if (!userInput) {
    return;
  }

  appendMessage("You", userInput);
  input.value = "";

  const systemIntro = "You are Monty, an AI assistant specialized in ACS Motion Control and technical guidance.";

  try {
    let response = "";
    if (uploadedPdfText) {
      response = await queryAIWithPdf(`${systemIntro} ${userInput}`, uploadedPdfText);
    } else {
      response = await getAIResponse(`${systemIntro} ${userInput}`);
    }
    appendMessage("Monty", response);
  } catch (err) {
    appendMessage("System", "❌ Failed to contact AI.");
    console.error(err);
  }
}

function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdfText = await extractTextFromPdf(typedArray);
    uploadedPdfText = pdfText;
    appendMessage("System", "✅ PDF uploaded successfully! Now enter a query.");
  };
  reader.readAsArrayBuffer(file);
}

function appendMessage(sender, text) {
  const box = document.getElementById('chat-container');

  const wrapper = document.createElement('div');
  wrapper.className = sender === "You" ? "message-wrapper user" : "message-wrapper ai";

  const message = document.createElement('div');
  message.className = sender === "You" ? "message-bubble message-user" : "message-bubble message-ai";
  message.innerText = text;

  wrapper.appendChild(message);
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}


// Replace with actual API call
// Remove or rename this block if you're using Gemini


// Replace with actual API for PDF + question
async function queryAIWithPdf(query, pdfText) {
  const res = await fetch('http://10.0.0.87:8000/api/chat-with-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, pdfContent: pdfText })
  });
  const data = await res.json();
  return data.reply;
}

// Uses pdf.js or similar - placeholder
async function extractTextFromPdf(typedArray) {
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}
