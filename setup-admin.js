const fetch = require('node-fetch');

async function setupAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/setup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Setup response:', data);
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

setupAdmin();