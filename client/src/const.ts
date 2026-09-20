export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = (options?: { scope?: "user" | "admin"; returnTo?: string }) => {
  const params = new URLSearchParams();
  if (options?.scope === "admin") params.set("scope", "admin");
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  window.location.assign(`/login${params.toString() ? `?${params.toString()}` : ""}`);
};
