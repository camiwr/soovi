export type JwtClaims = Record<string, any>;

function b64urlToStr(b64url: string) {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const decoded =
    typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  // binary -> utf8
  return decodeURIComponent(
    decoded
      .split("")
      .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join("")
  );
}

export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = b64urlToStr(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}