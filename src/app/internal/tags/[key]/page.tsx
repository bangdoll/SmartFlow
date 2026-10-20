import TagPage, { generateMetadata as tagMetadata } from '@/app/tags/[tag]/page';
import { decodePercentRouteKey } from '@/lib/tag-routing';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';
export const revalidate = 3600;
export function generateStaticParams() { return []; }

interface Props { params: Promise<{ key: string }> }

async function publicParams(params: Props['params']) {
    const { key } = await params;
    const tag = decodePercentRouteKey(key);
    if (tag === null) notFound();
    // This is already the literal tag, not a URI component. The public page
    // and its metadata share it without a second decodeURIComponent call.
    return { tag };
}

export async function generateMetadata({ params }: Props) {
    const decoded = await publicParams(params);
    return tagMetadata({ params: Promise.resolve(decoded) });
}

export default async function InternalTagPage({ params }: Props) {
    const decoded = await publicParams(params);
    return TagPage({ params: Promise.resolve(decoded) });
}
