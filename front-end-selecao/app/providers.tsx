'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LanguageProvider from '@/components/i18n/LanguageProvider';
import ThemeProvider from '@/components/theme/ThemeProvider';
import PageTransition from '@/components/motion/PageTransition';
import { MotionConfig } from 'framer-motion';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minuto
            },
        },
    }));

    return (
        <ThemeProvider>
        <LanguageProvider>
        <QueryClientProvider client={queryClient}>
            <MotionConfig reducedMotion="user">
                {children}
                <PageTransition />
            </MotionConfig>
        </QueryClientProvider>
        </LanguageProvider>
        </ThemeProvider>
    );
}
