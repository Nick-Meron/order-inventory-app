import { API_URL } from './config';

function errorFromResponse(status, data) {
  let message = (data && data.message) || `Request failed (${status}).`;
  // Laravel validation errors: show the first specific message
  if (data && data.errors) {
    const first = Object.values(data.errors)[0];
    if (first && first[0]) message = first[0];
  }
  const error = new Error(message);
  error.status = status;
  return error;
}

// One helper for every normal (JSON) request to the backend.
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
    throw errorFromResponse(response.status, data);
  }

  return data;
}

// Used for photo uploads. XMLHttpRequest is more reliable than fetch
// for sending files from a phone. The Content-Type header is left out
// on purpose: the phone adds it by itself, together with the file boundary.
export function apiUpload(path, formData, token) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 90000;

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        // the answer was not JSON
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(errorFromResponse(xhr.status, data));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed: the phone could not send the file to the server.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out after 90 seconds.'));
    };

    xhr.send(formData);
  });
}