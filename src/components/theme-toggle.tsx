"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useLanguage } from '@/components/language-context';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const { t } = useLanguage();
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center p-0.5 sm:p-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
        )
    }

    return (
        <div className="flex items-center p-0.5 sm:p-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <button
                onClick={() => setTheme("light")}
                className={`p-1 sm:p-1.5 rounded-full transition-all ${theme === "light"
                    ? "bg-gray-100 text-yellow-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title={t('theme.light')}
            >
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-1 sm:p-1.5 rounded-full transition-all ${theme === "system"
                    ? "bg-gray-100 dark:bg-gray-800 text-blue-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title={t('theme.system')}
            >
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1 sm:p-1.5 rounded-full transition-all ${theme === "dark"
                    ? "bg-gray-800 text-blue-400 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title={t('theme.dark')}
            >
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
        </div>
    )
}
