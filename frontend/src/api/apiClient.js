const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Ensure we always route to /api endpoints on the backend
  const apiPrefix = (cleanEndpoint.startsWith('/api') || BASE_URL.endsWith('/api')) ? '' : '/api';
  const url = `${BASE_URL.replace(/\/$/, '')}${apiPrefix}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status} (${response.statusText})`;
    try {
      const errorText = await response.text();
      if (errorText) {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors for the error body, fall back to default msg
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${err.message}`);
  }
}
