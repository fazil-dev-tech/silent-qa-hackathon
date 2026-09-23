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
    
    // Test sequentially to not hit rate limits, but fast timeout
    for (let i = 0; i < models.length; i++) {
      const modelId = models[i].id;
      
      try {
        const chatRes = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
          model: modelId,
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 5
        }, {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 2000
        });
        
        console.log(`✅ SUCCESS: ${modelId} -> ${chatRes.data.choices?.[0]?.message?.content}`);
        workingModels.push(modelId);
        
        // We found a working one! Let's stop
        if (chatRes.data.choices && chatRes.data.choices.length > 0) {
            console.log("Found a working conversational model! Writing to .env.local...");
            
            const fs = require('fs');
            const envContent = fs.readFileSync('.env.local', 'utf-8');
            const newEnv = envContent.replace(/NVIDIA_MODEL=.*/, `NVIDIA_MODEL=${modelId}`);
            fs.writeFileSync('.env.local', newEnv);
            console.log("Updated .env.local with " + modelId);
            process.exit(0);
        }
      } catch (err) {
        // failed, continue silently unless it's not a 404
        if (err.response?.status !== 404 && err.response?.status !== 410) {
            process.stdout.write(`.` );
        }
      }
    }
    
    console.log("\nNo working conversational models found out of all " + models.length);
  } catch (err) {
    console.error("Failed to fetch models:", err.response?.status || err.message);
  }
}

listAndTest();
