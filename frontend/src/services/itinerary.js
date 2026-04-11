async function getItinerary(prompt) {
  
  const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
  const url = `${FASTAPI_URL}/itinerary`;
  try {
    const response = await fetch(url, {
      method: "POST",
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
    return await response.json()
  }
  catch (error) {
    console.error(error.message)
  }
}

export { getItinerary }
