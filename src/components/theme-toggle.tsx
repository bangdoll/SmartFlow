"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from '@/components/language-context';

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const { t } = useLanguage();
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
        )
    }

    const isDark = resolvedTheme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <button
            onClick={toggleTheme}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark
                ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            title={isDark ? t('theme.light') : t('theme.dark')}
        >
            {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
        </button>
    )
}
