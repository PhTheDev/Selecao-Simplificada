// components/candidate-dashboard2/DashboardSkeleton.tsx
'use client';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-1/2 bg-gray-200 rounded mt-3 animate-pulse" />
                        <div className="h-4 w-1/3 bg-gray-200 rounded mt-3 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-1/3 bg-gray-200 rounded mt-3 animate-pulse" />
                        <div className="h-3 w-2/3 bg-gray-200 rounded mt-3 animate-pulse" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white/70 p-5">
                    <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white/70 p-5">
                    <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded mt-3 animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded mt-2 animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded-xl mt-6 animate-pulse" />
                </div>
            </div>
        </div>
    );
}
