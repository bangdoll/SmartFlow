import ComparePage, { generateMetadata as comparisonMetadata } from '@/app/compare/[slug]/page';
import { decodePercentRouteKey } from '@/lib/tag-routing';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';
export const revalidate = 3600;
export function generateStaticParams() { return []; }

interface Props { params: Promise<{ key: string }> }

async function publicParams(params: Props['params']) {
    const { key } = await params;
    const slug = decodePercentRouteKey(key);
    if (slug === null) notFound();
    return { slug };
}

export async function generateMetadata({ params }: Props) {
    const decoded = await publicParams(params);
    const metadata = await comparisonMetadata({ params: Promise.resolve(decoded) });
    return { ...metadata, alternates: { ...metadata.alternates, canonical: `/compare/${encodeURIComponent(decoded.slug)}` } };
}

export default async function InternalComparePage({ params }: Props) {
    const decoded = await publicParams(params);
    return ComparePage({ params: Promise.resolve(decoded) });
}
