export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Google OAuth flow through the server. The server creates and
// validates the state/nonce, so no client secret or provider URL is exposed.
export const startLogin = () => {
  window.location.assign("/api/oauth/google/start");
};
