import { Buffer } from 'node:buffer';

// Next 16.0.7 decodes an ISR pathname again in PrerenderManifestMatcher
// (E528 for a literal %). Proxy and the internal pages use the Node runtime;
// an opaque UTF-8 hex segment keeps that framework decode safe and lossless.
function getPercentRewritePath(rawSegment: string, route: 'tags' | 'compare'): string | undefined {
    const literal = decodeURIComponent(rawSegment);
    return literal.includes('%')
        ? `/internal/${route}/${Buffer.from(literal, 'utf8').toString('hex')}`
        : undefined;
}

export function getTagRewritePath(rawSegment: string) {
    return getPercentRewritePath(rawSegment, 'tags');
}

export function getComparisonRewritePath(rawSegment: string) {
    return getPercentRewritePath(rawSegment, 'compare');
}

export function decodePercentRouteKey(key: string): string | null {
    if (!/^(?:[0-9a-f]{2})+$/.test(key)) return null;
    const literal = Buffer.from(key, 'hex').toString('utf8');
    if (!literal.includes('%') || Buffer.from(literal, 'utf8').toString('hex') !== key) return null;
    return literal;
}
