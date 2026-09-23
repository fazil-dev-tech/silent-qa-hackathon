import axios from 'axios';

const apiKey = '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'; // Using the alt key provided by user
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const modelsToTest = [
  "google/gemma-2b",
  "google/gemma-3-12b-it",
  "ibm/granite-3.0-8b-instruct",
  "mistralai/mistral-7b-instruct-v0.3",
  "mistralai/mistral-nemo-12b-instruct",
  "meta/llama-guard-4-12b",
  "nv-mistralai/mistral-nemo-12b-instruct"
];

async function testModel(modelName) {
  try {
    const res = await axios.post(NVIDIA_URL, {
      model: modelName,
      messages: [{ role: 'user', content: 'Reply with the word "Success" and nothing else.' }],
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
