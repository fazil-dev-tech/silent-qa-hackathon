import axios from 'axios';

const apiKey = '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';

async function testChatbotPayload() {
  try {
    console.log("Waiting for up to 30 seconds for NVIDIA...");
    const chatRes = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
      model: 'mistralai/mistral-nemotron',
      messages: [
        { role: 'user', content: '[SYSTEM INSTRUCTIONS]\nYou are a QA Expert.\n\n[USER INPUT]\nWhat is bug severity?' }
      ],
      max_tokens: 512,
      temperature: 0.4,
      top_p: 0.9,
      stream: false
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });
    
    console.log(`✅ SUCCESS -> ${chatRes.data.choices?.[0]?.message?.content}`);
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }
}

testChatbotPayload();
