import axios from 'axios';

const apiKey = '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';

async function testStream() {
  const modelId = 'meta/llama-3.2-11b-vision-instruct'; 
  try {
    console.log("Testing stream: true...");
    const chatRes = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
      model: modelId,
      messages: [
        { role: 'user', content: '[SYSTEM INSTRUCTIONS]\nYou are a QA Expert.\n\n[USER INPUT]\nWhat is bug severity?' }
      ],
      max_tokens: 512,
      temperature: 0.4,
      stream: true // testing stream
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      responseType: 'stream',
      timeout: 10000
    });
    
    chatRes.data.on('data', (chunk) => {
        process.stdout.write(chunk.toString());
    });
    
    chatRes.data.on('end', () => {
        console.log("\n✅ STREAM FINISHED");
    });
    
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
  }
}

testStream();
