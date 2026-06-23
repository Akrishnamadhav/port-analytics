const apiKey = 'AIzaSyA-SIurL6SHb5e22B-REHZeW8LhYfPVNFI';
const models = [
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview'
];

async function testModel(model) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello' }]
        }]
      })
    });
    const status = response.status;
    const text = await response.text();
    console.log(`Model: ${model} -> Status: ${status}`);
    if (response.ok) {
      console.log(`Success details for ${model}:`, text.substring(0, 200));
      return true;
    } else {
      console.log(`Error details for ${model}:`, text.substring(0, 300));
    }
  } catch (err) {
    console.error(`Error for ${model}:`, err.message);
  }
  return false;
}

async function run() {
  for (const m of models) {
    console.log(`Testing model: ${m}...`);
    const success = await testModel(m);
    if (success) {
      console.log(`>>> Found working model: ${m} <<<`);
      break;
    }
    // Wait 1 second between checks
    await new Promise(r => setTimeout(r, 1000));
  }
}

run();
