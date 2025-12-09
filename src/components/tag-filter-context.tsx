'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TagFilterContextType {
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
}

const TagFilterContext = createContext<TagFilterContextType | undefined>(undefined);

export function TagFilterProvider({ children }: { children: ReactNode }) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    return (
        <TagFilterContext.Provider value={{ selectedTag, setSelectedTag }}>
            {children}
        </TagFilterContext.Provider>
    );
}

export function useTagFilter() {
    const context = useContext(TagFilterContext);
    if (!context) {
        throw new Error('useTagFilter must be used within a TagFilterProvider');
    }
    return context;
}
