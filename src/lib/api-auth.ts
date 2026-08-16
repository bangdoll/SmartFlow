/**
 * Protects internal maintenance endpoints with a shared server-side secret.
 * ADMIN_SECRET can be used for maintenance routes; CRON_SECRET remains a
 * backwards-compatible fallback for existing scheduled jobs.
 */
export function hasMaintenanceAuth(request: Request): boolean {
    return hasBearerSecret(request, process.env.ADMIN_SECRET) ||
        hasBearerSecret(request, process.env.CRON_SECRET);
}

/**
 * Admin-only endpoints must not accept CRON_SECRET. Cron credentials are
 * intentionally allowed to invoke scheduled maintenance jobs, but they
 * should never unlock destructive or diagnostic operations.
 */
export function hasAdminAuth(request: Request): boolean {
    return hasBearerSecret(request, process.env.ADMIN_SECRET);
}

function hasBearerSecret(request: Request, secret: string | undefined): boolean {
    return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}
