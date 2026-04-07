async function getItinerary(prompt) {
  const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
  const url = `${FASTAPI_URL}/itinerary`;
  try {
    const response = await fetch(url, {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        "prompt": prompt,
        "dry_run": false
      })
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return response.json()
  }
  catch (error) {
    console.error(error.message)
  }
}

export { getItinerary }
