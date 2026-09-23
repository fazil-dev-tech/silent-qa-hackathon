import axios from 'axios';

async function testLocalApi() {
  try {
    const res = await axios.post('http://localhost:3000/api/chat', {
      message: 'Hello, this is a test',
      history: [],
      sessionId: null
    });
    console.log('✅ Chat API response:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('❌ Chat API failed with status:', err.response.status);
      console.log('Response data:', err.response.data);
    } else {
      console.log('❌ Chat API error:', err.message);
    }
  }
}

testLocalApi();
