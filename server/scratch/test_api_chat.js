async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@portauthority.gov.in',
        password: 'admin123'
      })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', loginRes.status, await loginRes.text());
      return;
    }

    const cookie = loginRes.headers.get('set-cookie');
    console.log('Login successful! Cookie received.');

    console.log('Sending off-topic message to /api/chat...');
    const chatRes = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        message: 'how can i reverse a string in python',
        history: []
      })
    });

    if (!chatRes.ok) {
      console.error('Chat request failed:', chatRes.status, await chatRes.text());
    } else {
      console.log('Off-topic query response:', await chatRes.json());
    }

    console.log('Sending a valid port stats message to /api/chat...');
    const validChatRes = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        message: 'What was the total revenue in 2023?',
        history: []
      })
    });

    if (!validChatRes.ok) {
      console.error('Valid chat request failed:', validChatRes.status, await validChatRes.text());
    } else {
      console.log('Valid query response:', await validChatRes.json());
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
