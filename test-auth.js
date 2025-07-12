const axios = require('axios');

// Test authentication flow
async function testAuth() {
  try {
    console.log('Testing authentication flow...\n');

    // Create axios instance with session support
    const client = axios.create({
      baseURL: 'http://localhost:3001',
      withCredentials: true,
      timeout: 10000
    });

    // 1. Test login
    console.log('1. Testing login...');
    const loginResponse = await client.post('/auth/login', {
      username: 'ter',
      password: 'password' // You'll need to replace with actual password
    });

    console.log('Login response:', {
      success: loginResponse.data.success,
      user: loginResponse.data.user ? {
        username: loginResponse.data.user.username,
        is_admin: loginResponse.data.user.is_admin,
        is_company: loginResponse.data.user.is_company,
        is_premium: loginResponse.data.user.is_premium
      } : null
    });

    // 2. Test checkAuth
    console.log('\n2. Testing checkAuth...');
    const authCheckResponse = await client.get('/auth/check');

    console.log('Auth check response:', {
      success: authCheckResponse.data.success,
      isAuthenticated: authCheckResponse.data.isAuthenticated,
      user: authCheckResponse.data.user ? {
        username: authCheckResponse.data.user.username,
        is_admin: authCheckResponse.data.user.is_admin,
        is_company: authCheckResponse.data.user.is_company,
        is_premium: authCheckResponse.data.user.is_premium
      } : null
    });

    // 3. Test blog image upload (this should work if user is admin)
    console.log('\n3. Testing blog image upload access...');
    try {
      // Create a simple test file
      const FormData = require('form-data');
      const fs = require('fs');

      // Create a small test image file
      const testContent = 'test image content';
      fs.writeFileSync('test-image.txt', testContent);

      const formData = new FormData();
      formData.append('image', fs.createReadStream('test-image.txt'));

      const uploadResponse = await client.post('/api/blog/upload-image', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      console.log('Upload test result:', {
        success: uploadResponse.data.success,
        message: 'Upload access granted'
      });

      // Clean up
      fs.unlinkSync('test-image.txt');

    } catch (uploadError) {
      console.log('Upload test result:', {
        success: false,
        error: uploadError.response?.data?.error || uploadError.message,
        status: uploadError.response?.status
      });
    }

  } catch (error) {
    console.error('Test failed:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testAuth();
