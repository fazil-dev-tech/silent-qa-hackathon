import axios from 'axios';

const apiKey = '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';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const modelsToTest = [
  "meta/llama-3.1-8b-instruct",
  "google/gemma-2-9b-it",
  "microsoft/phi-3-mini-128k-instruct"
];

async function testModel(modelName) {
  try {
    const res = await axios.post(NVIDIA_URL, {
      model: modelName,
      messages: [{ role: 'user', content: 'Say success' }],
      max_tokens: 10
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Model ${modelName} Works! Output: ${res.data.choices[0].message.content}`);
  } catch (err) {
    if (err.response) {
      console.log(`❌ Model ${modelName} Failed: ${err.response.status}`);
    } else {
      console.log(`❌ Model ${modelName} Error: ${err.message}`);
    }
  }
}

async function run() {
  for (const m of modelsToTest) {
    await testModel(m);
  }
}

run();
