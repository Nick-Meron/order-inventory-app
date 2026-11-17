import { API_URL } from './config';

async function send(path, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
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

// One helper for every normal (JSON) request to the backend.
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  return send(
    path,
    { method, headers, body: body ? JSON.stringify(body) : undefined },
    15000
  );
}

// Used for photo uploads. The Content-Type header is left out on purpose:
// the phone adds it by itself, together with the file boundary.
export async function apiUpload(path, formData, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  return send(path, { method: 'POST', headers, body: formData }, 60000);
}