export const SITE_URL = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PRODUCTION_URL ||
    'https://smart-flow.rd.coach'
).replace(/\/$/, '');
