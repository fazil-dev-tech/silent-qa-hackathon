import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
});

const apiKey = envVars['NVIDIA_API_KEY'];
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function testGuard() {
  try {
    const res = await axios.post(NVIDIA_URL, {
      model: 'meta/llama-guard-4-12b',
      messages: [
        { role: 'user', content: 'Hello' }
      ]
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    console.log('✅ Works with user role:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('❌ User role failed:', err.response?.data);
  }

  try {
    const res2 = await axios.post(NVIDIA_URL, {
      model: 'meta/llama-guard-4-12b',
      messages: [
        { role: 'system', content: 'You are an AI' },
        { role: 'user', content: 'Hello' }
      ]
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    console.log('✅ Works with system role:', res2.data.choices[0].message.content);
  } catch (err) {
    console.error('❌ System role failed:', err.response?.data);
  }
}
testGuard();
