async function getItinerary(prompt) {
  const url = `${FASTAPI_URL}/itinerary`;
  try {
    const response = await fetch(url, {
      method: POST,
        headers: {
          'Content-Type': 'application/json'
      }
      body: JSON.stringify({ "prompt": prompt })
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  }
  catch (error) {
    console.error(error.message)
  }
}
