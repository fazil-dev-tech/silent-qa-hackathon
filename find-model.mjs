import axios from 'axios';

const apiKey = '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';

async function listAndTest() {
  try {
    const res = await axios.get('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const models = res.data.data;
    console.log(`Found ${models.length} models on this account.`);
    
    let workingModels = [];
    // Test the first 15 models to find one that works
    for (let i = 0; i < Math.min(15, models.length); i++) {
      const modelId = models[i].id;
      console.log(`Testing model ${i+1}: ${modelId}...`);
      try {
        const chatRes = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
          model: modelId,
          messages: [{ role: 'user', content: 'Say success' }],
          max_tokens: 10
        }, {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 4000
        });
        console.log(`✅ SUCCESS: ${modelId} -> ${chatRes.data.choices[0].message.content}`);
        workingModels.push(modelId);
        break; // Stop after finding one working model
      } catch (err) {
        // failed, continue
        console.log(`❌ FAILED: ${modelId} (${err.response?.status || err.message})`);
      }
    }
    
    if (workingModels.length === 0) {
      console.log("No working models found in the first 15.");
    }
  } catch (err) {
    console.error("Failed to fetch models:", err.response?.status || err.message);
  }
}

listAndTest();
