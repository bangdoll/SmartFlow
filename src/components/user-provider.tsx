'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface UserContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (refresh?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const refreshSession = async () => {
        setIsLoading(true);
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error);
                return;
            }
            // If getUser succeeds, we technically have a session, but getUser returns User. 
            // We can get the session via getSession if needed, but for now let's just set the user.
            // Actually, keep it simple: getSession is faster but getUser is more accurate. 
            // Let's try to get session AFTER checking getUser?
            // Or better: just use getUser and if successful, calling getSession should return the cached session.

            // Revert strict getUser: getSession is standard.
            // But if getSession returns null due to cookie issues, getUser works.

            // Let's stick to getSession but maybe the route.ts dynamic fix is key.
            // Actually, let's use getUser() as the primary check.
            setUser(user);
            // Updating session might be tricky if getUser doesn't return it.
            // Let's fetch session separately if user exists.
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        } catch (error) {
            console.error('Unexpected error checking session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        refreshSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
            } else {
                setSession(null);
                setUser(null);
            }

            if (event === 'SIGNED_IN') {
                router.refresh(); // Refresh server components
            }
            if (event === 'SIGNED_OUT') {
                router.refresh();
                router.push('/');
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    const signIn = async (refresh = true) => {
        // Just triggers a refresh check, actual sign-in handled by AuthModal direct calls usually
        if (refresh) await refreshSession();
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // State update handled by onAuthStateChange
    };

    return (
        <UserContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
