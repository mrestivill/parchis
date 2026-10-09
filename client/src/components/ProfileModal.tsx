
import React, { useEffect, Suspense } from 'react';
// Lazy load StatsView to reduce initial bundle size (Recharts is heavy)
const StatsView = React.lazy(() => import('./StatsView').then(module => ({ default: module.StatsView })));

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    userStats: any;
    fetchUserStats: (userId?: string) => void;
    isLoading: boolean;
    error?: string | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, userStats, fetchUserStats, isLoading, error }) => {

    useEffect(() => {
        if (isOpen && user) {
            fetchUserStats(user.id);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 flex flex-col relative animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-gray-800 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors z-10 text-sm"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="p-4 pt-12 md:p-8 md:pb-0 text-center">
                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-2">
                        Player Stats
                    </h2>
                    <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 font-medium">
                        Performance summary and rivalries for <span className="text-yellow-500 font-bold">{user?.username}</span>
                    </p>
                </div>

                {/* Stats Content */}
                <div className="p-3 md:p-8 pt-4 md:pt-6">
                    {error ? (
                        <div className="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30">
                            <p className="text-red-500 font-bold mb-2">Error loading stats</p>
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    ) : (
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center p-12 gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
                                <p className="text-slate-500 dark:text-gray-400 font-bold animate-pulse">Loading Components...</p>
                            </div>
                        }>
                            <StatsView stats={userStats} isLoading={isLoading} />
                        </Suspense>
                    )}
                </div>
            </div>
        </div>

    );
};
