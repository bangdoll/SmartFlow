/** Safe diagnostics for public reads: never log upstream text, URLs or row data. */
export function newsReadError(context: string, result: { error: { code?: string } | null; status?: number }): Error {
    const receivedStatus = result.status;
    const status = typeof receivedStatus === 'number' && Number.isInteger(receivedStatus) && receivedStatus >= 0 && receivedStatus <= 599
        ? receivedStatus : 0;
    const code = typeof result.error?.code === 'string' && /^[A-Za-z0-9_]{1,64}$/.test(result.error.code)
        ? result.error.code : 'unknown';
    const kind = status === 0 ? 'transport' : 'database';
    return new Error(`${context} [${kind}; status=${status}; code=${code}]`);
}

export const PUBLIC_NEWS_READ_TIMEOUT_MS = 8_000;
