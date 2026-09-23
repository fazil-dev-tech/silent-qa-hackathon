import axios from 'axios';

const apiKey = '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';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const modelsToTest = [
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "meta/llama3-70b-instruct",
  "meta/llama-3.1-8b-instruct",
  "google/gemma-2-9b-it",
  "microsoft/phi-3-mini-128k-instruct",
  "ibm/granite-3.0-8b-instruct",
  "meta/llama-guard-4-12b"
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
      },
      timeout: 5000
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
  console.log("Testing API Key:", apiKey.substring(0, 15) + "...");
  for (const m of modelsToTest) {
    await testModel(m);
  }
}

run();
