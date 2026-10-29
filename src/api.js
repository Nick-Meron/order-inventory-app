import { API_URL } from './config';

// One helper for every request to the backend.
// Returns the JSON data, or throws an Error with a readable message.
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw new Error('Cannot reach the server. Check Wi-Fi and the address in src/config.js.');
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // some responses have no body
  }

  if (!response.ok) {
    let message = (data && data.message) || `Request failed (${response.status}).`;
    // Laravel validation errors: show the first specific message
    if (data && data.errors) {
      const first = Object.values(data.errors)[0];
      if (first && first[0]) message = first[0];
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}