'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NavButtonProps {
    href: string;
    icon?: ReactNode;
    label?: string;
    isActive?: boolean;
    className?: string; // Allow overrides but default to rigid structure
    mobileOnly?: boolean;
    desktopOnly?: boolean;
    title?: string;
}

export function NavButton({ href, icon, label, mobileOnly, desktopOnly, title }: NavButtonProps) {
    if (mobileOnly) {
        return (
            <Link
                href={href}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all md:hidden active:scale-95 relative z-10 cursor-pointer"
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
                className="hidden md:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all min-w-[4rem] relative z-10 cursor-pointer"
                title={title}
            >
                {label}
            </Link>
        );
    }

    // Default: Responsive (Icon on mobile, Text on desktop) - BUT we prefer explicit split now.
    // Making this fallback generic just in case.
    return (
        <Link
            href={href}
            className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 transition-all relative z-10 cursor-pointer"
        >
            {icon && <span className="md:hidden">{icon}</span>}
            {label && <span className="hidden md:block">{label}</span>}
        </Link>
    );
}
