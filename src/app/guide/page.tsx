import { Header } from '@/components/header';
import { GuideContent } from '@/components/guide-content';

export const metadata = {
    title: '新手指南 | 智流 Smart Flow',
    description: '如何使用智流 Smart Flow 掌握每日科技趨勢的完整教學。',
};

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <Header />
            <GuideContent />
        </div>
    );
}
