/**
 * Protects internal maintenance endpoints with a shared server-side secret.
 * ADMIN_SECRET can be used for maintenance routes; CRON_SECRET remains a
 * backwards-compatible fallback for existing scheduled jobs.
 */
export function hasMaintenanceAuth(request: Request): boolean {
    const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    if (!secret) return false;

    return request.headers.get('authorization') === `Bearer ${secret}`;
}
