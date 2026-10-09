// Shared, side-effect-free helpers for event forms and registration displays.
// A checkout link is never evidence that its payment has been completed.
const helloAssoCheckoutPattern = /^https:\/\/(?:www\.)?helloasso\.com(?::443)?\/[^?#][\x21-\x7e]*$/i;
const dotSegmentPattern = /(?:^|\/)(?:\.|%2e){1,2}(?=\/|[?#]|$)/i;

export function normalizeHelloAssoCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string"
    || value.length > 2048
    || !/^[\x21-\x7e]+$/.test(value)
    || value.includes("\\")
    || !helloAssoCheckoutPattern.test(value)
    || dotSegmentPattern.test(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:"
      || !["helloasso.com", "www.helloasso.com"].includes(url.hostname)
      || url.username !== ""
      || url.password !== ""
      || (url.port !== "" && url.port !== "443")
      || url.pathname === "/"
      || url.pathname === "") {
      return null;
    }
    const normalized = url.toString();
    return normalized.length <= 2048 ? normalized : null;
  } catch {
    return null;
  }
}

export function formatEventPrice(cents: number, english = false): string {
  return new Intl.NumberFormat(english ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
