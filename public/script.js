let uploadedPdfText = "";

window.onload = () => {
  appendMessage("Monty", "👋 Hello! I’m 🐎Monty - Your ACS AI Assistant.\nPlease upload the ACS documentation PDF file to begin.");
};

// async function getAIResponse(userInput) {
//   try {
//     const response = await fetch('http://localhost:11434/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         model: 'llama3.2',
//         messages: [
//           { role: "system", content: "You are Monty, an AI assistant specialized in ACS Motion Control and technical guidance." },
//           { role: "user", content: userInput }
//         ],
//         stream: false
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.text();
//       throw new Error(`${response.status} - ${errorData}`);
//     }

//     const data = await response.json();
//     let formattedResponse = data.message.content || "No response received.";
//     formattedResponse = formatAIResponse(formattedResponse);
//     return formattedResponse;

//   } catch (err) {
//     console.error("❌ Ollama error:", err);
//     return `❌ Error: ${err.message}`;
//   }
// }

async function getAIResponse(userInput) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userInput })
    });

    const data = await response.json();
    console.log("🌟 AI Response (Frontend):", data);

    return formatAIResponse(data.reply || "❌ Empty response.");
  } catch (err) {
    console.error("❌ Error calling Gemini:", err);
    return `❌ Error: ${err.message}`;
  }
}


function copyCode(button) {
  const codeBlock = button.parentElement.querySelector('code');
  if (!codeBlock) {
    console.warn("Code block not found.");
    return;
  }

  const text = codeBlock.textContent;
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  }).catch(err => {
    console.error("❌ Failed to copy:", err);
    button.textContent = "❌ Error";
  });
}


function formatAIResponse(response) {
  return response
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Replace semicolons in code with '!' only inside code blocks
    .replace(/```([\s\S]*?)```/g, (_, code) => {
      const cleaned = code
        .replace(/;/g, '!')                     // Replace semicolons with exclamation marks
        .replace(/^acspl\s*/i, '')              // Remove 'acspl' at the start if present
        .replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Escape HTML

      return `
     <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre><code>${cleaned}</code></pre>
  </div>`;
    })

    // Bullet list formatting
    .replace(/\n\s*-\s/g, "<ul><li>")
    .replace(/<\/li>\n/g, "</li>")
    .replace(/<ul><br>/g, "<ul>")

    // Replace newlines with <br> for spacing (outside code blocks)
    .replace(/\n/g, "<br>");
}

async function sendMessage() {
  const input = document.getElementById('message');
  const userInput = input.value.trim();
  if (!userInput) return;

  appendMessage("You", userInput);
  input.value = "";

  const systemIntro = "You are Monty, an AI assistant specialized in ACS Motion Control and technical guidance.";

  // Search inside uploaded PDF text if available
  if ((userInput.toLowerCase().includes("acspl") || userInput.toLowerCase().includes("command")) && uploadedPdfText) {
    await queryDocsByText(userInput);
  } else if ((userInput.toLowerCase().includes("acspl") || userInput.toLowerCase().includes("command")) && !uploadedPdfText) {
    appendMessage("System", "⚠️ Please upload the ACS documentation PDF first so I can help you search.");
  }

  const queryText = `${systemIntro}\n${userInput}`;
  const finalText = uploadedPdfText ? `${queryText}\n\nDocs:\n${uploadedPdfText}` : queryText;
  const response = await getAIResponse(finalText);
  
  appendMessage("Monty", response);
}

function appendMessage(sender, text) {
  const box = document.getElementById('chat-container');
  const wrapper = document.createElement('div');
  wrapper.className = sender === "You" ? "message-wrapper user" : "message-wrapper ai";

  const message = document.createElement('div');
  message.className = sender === "You" ? "message-bubble message-user" : "message-bubble message-ai";
  message.innerHTML = text;

  wrapper.appendChild(message);
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}

async function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdfText = await extractTextFromPdf(typedArray);
    uploadedPdfText = pdfText;
    appendMessage("System", "✅ PDF uploaded successfully! You can now ask questions like 'What is the PTP command in acspl?'.");
  };
  reader.readAsArrayBuffer(file);
}
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
  }
}
// Extract text from uploaded PDF using PDF.js
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

async function queryDocsByText(searchTerm) {
  try {
    const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(searchTerm)}`);
    const data = await res.json();

    if (data.error) {
      appendMessage("System", `❌ Error searching documentation: ${data.error}`);
      return true;
    }

    if (data.text) {
      uploadedPdfText = data.text;
      appendMessage("System", `📄 Found documentation related to "${searchTerm}".`);
      return false;
    } else {
      appendMessage("System", `⚠️ No relevant documentation found for "${searchTerm}".`);
      return true;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    appendMessage("System", "❌ Could not connect to the documentation service.");
    return true;
  }
}

