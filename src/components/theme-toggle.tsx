"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center p-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
        )
    }

    return (
        <div className="flex items-center p-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all ${theme === "light"
                        ? "bg-gray-100 text-yellow-500 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title="淺色模式"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-full transition-all ${theme === "system"
                        ? "bg-gray-100 dark:bg-gray-800 text-blue-500 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title="跟隨系統"
            >
                <Monitor className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all ${theme === "dark"
                        ? "bg-gray-800 text-blue-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                title="深色模式"
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    )
}
