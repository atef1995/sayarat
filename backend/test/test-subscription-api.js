require('dotenv').config({ path: '.env.development' });
const axios = require('axios');

async function testSubscriptionStatus() {
  try {
    console.log('=== Testing Subscription Status API ===\n');

    // You'll need to replace this with an actual session token or API key
    // For testing, let's check what the API returns
    const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

    console.log('Testing subscription status endpoint...');
    console.log('Base URL:', BASE_URL);

    // Note: This will fail with 401 since we don't have auth, but we can see the response structure
    try {
      const response = await axios.get(`${BASE_URL}/api/subscription/status`);
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('Status Code:', error.response.status);
        console.log('Response Data:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSubscriptionStatus();
