/**
 * The backend sets a csrf_token cookie that is deliberately NOT httpOnly -
 * only so this function can read it and echo it back as a header on
 * mutating requests (see lib/api.js). See the backend's middleware/csrf.js
 * for the full double-submit-cookie explanation.
 */
let currentToken = null;

export function setCsrfToken(token) {
  currentToken = token;
}

export function getCsrfToken() {
  return currentToken;
}
