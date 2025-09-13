// Simple test script to verify API connectivity
const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function testAPIConnection() {
  console.log('Testing API connection to:', API_BASE_URL);
  
  try {
    // Test with a sample serial number
    const testSerialNumber = 'TEST123';
    const url = `${API_BASE_URL}/web/search/registered/${testSerialNumber}`;
    
    console.log('Attempting to fetch:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('API returned error status:', response.status);
      const text = await response.text();
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('Connection error:', error.message);
    console.log('\nMake sure your API server is running at', API_BASE_URL);
  }
}

testAPIConnection();
