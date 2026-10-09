/** Event sign-in return paths are deliberately limited to local event detail URLs. */
export function getEventLoginReturnPath(value: unknown, fallback: "/" | "/profil" = "/profil"): string {
  return typeof value === "string"
    && !/[\r\n]/.test(value)
    && /^\/evenement\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:#inscription)?$/i.test(value)
    ? value
    : fallback;
}
