'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CometCard } from '@/components/ui/comet-card';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/components/providers/supabase-provider';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { ProfileSetupModal } from '@/components/dashboard/profile-setup-modal';

export default function ContributorDashboard() {
    const router = useRouter();
    const { supabase, user, isLoading: authLoading } = useSupabase();
    const [contributorName, setContributorName] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [stats, setStats] = useState({
        totalContributions: 0,
        datasetsPartOf: 0,
        avgQualityScore: 0,
        totalEarnings: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If not authenticated, redirect to login
        if (!user) {
            router.push('/contributor/login');
            return;
        }

        // Fetch contributor data
        const fetchDashboardData = async () => {
            try {
                // Get or create contributor
                // Use auth_user_id to link with Supabase Auth
                let { data: contributor, error: contributorError } = await supabase
                    .from('contributors')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();

                if (contributorError) throw contributorError;

                if (!contributor) {
                    // Auto-create profile if doesn't exist
                    const { data: newContributor, error: createError } = await supabase
                        .from('contributors')
                        .insert({
                            auth_user_id: user.id,
                            name: user.user_metadata?.full_name || user.email?.split('@')[0],
                            email: user.email,
                            total_earnings: 0
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating contributor profile:', createError);
                        // Fallback to onboarding if creation fails
                        router.push('/contributor/onboarding');
                        return;
                    }
                    contributor = newContributor;
                }
                // Check if profile is complete (has name)
                const hasCompletedProfile = contributor.name && contributor.name !== user.email?.split('@')[0];

                // If not complete, show modal
                if (!hasCompletedProfile) {
                    setShowProfileModal(true);
                    // Set initial name prop if available
                    setContributorName(contributor.name || user.user_metadata?.full_name || '');
                } else {
                    setContributorName(contributor.name);
                }

                // Fetch data contributions
                // Assuming data_contributions has contributor_id foreign key
                const { data: contributions } = await supabase
                    .from('data_contributions')
                    .select('*')
                    .eq('contributor_id', contributor.contributor_id);

                // Get unique datasets this contributor is part of
                const uniqueDatasets = new Set(
                    contributions?.map((c: any) => c.dataset_id) || []
                );

                // Calculate stats
                const totalContributions = contributions?.length || 0;
                const datasetsPartOf = uniqueDatasets.size;
                const avgQualityScore =
                    contributions && contributions.length > 0
                        ? contributions.reduce((sum: number, c: any) => sum + (c.quality_score || 0), 0) / contributions.length
                        : 0;

                setStats({
                    totalContributions,
                    datasetsPartOf,
                    avgQualityScore: avgQualityScore / 100, // Normalize to 0-1
                    totalEarnings: contributor.total_earnings || 0,
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, authLoading, supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, #fff 1px, transparent 1px),
                                linear-gradient(to bottom, #fff 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px',
                        }}
                    ></div>
                </div>

                {/* Header */}
                <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="text-xl font-bold text-white tracking-tight">
                            DataUnion
                        </Link>
                    </div>
                </header>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-12">
                        <div className="h-12 w-96 bg-white/5 rounded-lg mb-3 animate-pulse"></div>
                        <div className="h-6 w-64 bg-white/5 rounded animate-pulse"></div>
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </div>

                    {/* Quick Actions Skeleton */}
                    <div className="mb-12">
                        <div className="h-8 w-32 bg-white/5 rounded mb-6 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-pulse">
                                <div className="w-14 h-14 bg-white/5 rounded-xl mb-4"></div>
                                <div className="h-6 w-48 bg-white/5 rounded mb-2"></div>
                                <div className="h-4 w-64 bg-white/5 rounded"></div>
                            </div>
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 animate-pulse">
                                <div className="w-14 h-14 bg-white/5 rounded-xl mb-4"></div>
                                <div className="h-6 w-48 bg-white/5 rounded mb-2"></div>
                                <div className="h-4 w-64 bg-white/5 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #fff 1px, transparent 1px),
              linear-gradient(to bottom, #fff 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                ></div>
            </div>

            {/* Header */}
            <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-white tracking-tight">
                        DataUnion
                    </Link>
                    <div className="flex items-center gap-4">
                        <Badge variant="default">{contributorName}</Badge>
                        <button onClick={handleSignOut} className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                        Welcome back, <span className="text-emerald-400">{contributorName}</span>
                    </h1>
                    <p className="text-white/50 text-lg">
                        Here's an overview of your data contributions and earnings
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Total Contributions */}
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <div className="text-sm text-white/50 font-medium">Total Contributions</div>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalContributions}</div>
                    </div>

                    {/* Avg Quality Score */}
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <div className="text-sm text-white/50 font-medium">Avg Quality</div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {stats.avgQualityScore > 0 ? (stats.avgQualityScore * 100).toFixed(0) : 0}%
                        </div>
                    </div>

                    {/* Total Earnings */}
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm text-white/50 font-medium">Total Earnings</div>
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">+${stats.totalEarnings.toFixed(2)}</div>
                    </div>

                    {/* Datasets I'm Part Of */}
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="text-sm text-white/50 font-medium">Datasets I'm Part Of</div>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.datasetsPartOf}</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CometCard>
                            <Link href="/contributor/contribute" className="block">
                                <BackgroundGradient
                                    containerClassName="rounded-2xl"
                                    className="rounded-2xl bg-black"
                                    colors={["#ffffff", "#71717a", "#27272a", "#52525b", "#18181b"]}
                                >
                                    <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.04] transition-all group">
                                        <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Contribute New Data</h3>
                                        <p className="text-white/50 text-sm mb-4">
                                            Share your data sample and start earning
                                        </p>
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                                            Get Started <span>→</span>
                                        </div>
                                    </div>
                                </BackgroundGradient>
                            </Link>
                        </CometCard>

                        <CometCard>
                            <Link href="/contributor/transparency" className="block">
                                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group h-full">
                                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                                        <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">View Transparency Logs</h3>
                                    <p className="text-white/50 text-sm mb-4">
                                        See how your data is being used and compensated
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                                        View Logs <span>→</span>
                                    </div>
                                </div>
                            </Link>
                        </CometCard>
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                        <ActivityChart />
                    </div>
                </div>
            </div>

            <ProfileSetupModal
                isOpen={showProfileModal}
                currentName={contributorName}
                onComplete={(name) => {
                    setContributorName(name);
                    setShowProfileModal(false);
                }}
            />
        </div >
    );
}
