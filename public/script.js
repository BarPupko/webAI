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
    const response = await fetch(`${window.location.origin}/api/gemini`, {

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
  const codeBlock = button.parentElement.querySelector('.hidden-raw-code');
  if (!codeBlock) {
    console.error("❌ Hidden textarea not found.");
    return;
  }

  codeBlock.style.display = 'block'; // Show temporarily if needed
  codeBlock.select();
  codeBlock.setSelectionRange(0, codeBlock.value.length); // Mobile fix

  try {
    document.execCommand('copy');
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  } catch (err) {
    console.error("❌ Failed to copy:", err);
    button.textContent = "❌ Error";
  }

  codeBlock.style.display = 'none'; // Hide it again
}



function copyCode(button) {
  const codeBlock = button.parentElement.querySelector('.hidden-raw-code');
  if (!codeBlock) {
    console.error("❌ Hidden textarea not found.");
    showToast("❌ Code not found to copy.", 3000);
    return;
  }

  codeBlock.style.display = 'block';
  codeBlock.select();
  codeBlock.setSelectionRange(0, codeBlock.value.length);

  try {
    document.execCommand('copy');
    button.textContent = "Copied!";
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
    showToast("✅ Code copied!", 2000);
  } catch (err) {
    console.error("❌ Failed to copy:", err);
    showToast("❌ Copy failed.", 2000);
  }

  codeBlock.style.display = 'none';
}




function formatAIResponse(response) {
  return response
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/```([\s\S]*?)```/g, (_, code) => {
      const rawCode = code
        .replace(/;/g, '!')
        .replace(/^acspl\s*/i, '');

      const htmlCode = rawCode
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)" data-raw="${encodeURIComponent(rawCode)}">Copy</button>
          <textarea class="hidden-raw-code" style="position: absolute; left: -9999px;">${rawCode}</textarea>
          <pre><code>${htmlCode}</code></pre>
        </div>
      `;
    })
    .replace(/\n\s*-\s/g, "<ul><li>")
    .replace(/<\/li>\n/g, "</li>")
    .replace(/<ul><br>/g, "<ul>")
}


async function sendMessage() {
  const input = document.getElementById('message');
  const userInput = input.value.trim();
  if (!userInput) return;

  appendMessage("You", userInput);
  input.value = "";

  const systemIntro = `
    You are Monty, an AI assistant specialized in ACS Motion Control and technical guidance.
    When providing ACSPL code examples, always use '!' instead of '//' for comments and add STOP at the end of the example,
    and ensure the code is properly structured and clearly formatted.
  `.trim();

  // Search inside uploaded PDF text if available
  if ((userInput.toLowerCase().includes("acspl") || userInput.toLowerCase().includes("command")) && uploadedPdfText) {
    await queryDocsByText(userInput);
  } else if ((userInput.toLowerCase().includes("acspl") || userInput.toLowerCase().includes("command")) && !uploadedPdfText) {
    appendMessage("System", "⚠️ Please upload the ACS documentation PDF first so I can help you search.");
  }

  const queryText = `${systemIntro}\n\n${userInput}`;
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

//toast
function showToast(message, duration = 2000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, duration);
}
