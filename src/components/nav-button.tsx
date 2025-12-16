'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

interface NavButtonProps {
    href: string;
    icon?: ReactNode;
    label?: string;
    isActive?: boolean;
    className?: string;
    mobileOnly?: boolean;
    desktopOnly?: boolean;
    title?: string;
}

export function NavButton({ href, icon, label, mobileOnly, desktopOnly, title }: NavButtonProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        // Allow default behavior for modifier keys (New Tab, etc.)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        e.preventDefault();
        router.push(href);
    };

    const commonClasses = "flex items-center justify-center transition-all relative z-10 cursor-pointer text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800";

    if (mobileOnly) {
        return (
            <Link
                href={href}
                onClick={handleClick}
                className={`w-10 h-10 rounded-full md:hidden ${commonClasses}`}
                title={title}
            >
                {icon}
            </Link>
        );
    }

    if (desktopOnly) {
        return (
            <Link
                href={href}
                onClick={handleClick}
                className={`hidden md:flex h-9 px-4 rounded-lg text-sm font-medium min-w-[4rem] ${commonClasses}`}
                title={title}
            >
                {label}
            </Link>
        );
    }

    // Default fallback
    return (
        <Link
            href={href}
            onClick={handleClick}
            className={`p-2 ${commonClasses}`}
        >
            {icon && <span className="md:hidden">{icon}</span>}
            {label && <span className="hidden md:block">{label}</span>}
        </Link>
    );
}
