/**
 * The backend sets a csrf_token cookie that is deliberately NOT httpOnly -
 * only so this function can read it and echo it back as a header on
 * mutating requests (see lib/api.js). See the backend's middleware/csrf.js
 * for the full double-submit-cookie explanation.
 */
export function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
