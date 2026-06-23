async function run() {
  const apiKey = 'AIzaSyA-SIurL6SHb5e22B-REHZeW8LhYfPVNFI';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      console.error('Failed to list models:', response.status, await response.text());
      return;
    }
    const data = await response.json();
    console.log('Available models:', data.models.map(m => m.name));
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
