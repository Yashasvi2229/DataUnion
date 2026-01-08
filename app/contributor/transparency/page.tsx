'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useSupabase } from '@/components/providers/supabase-provider';
import { ListItemSkeleton, PayoutItemSkeleton } from '@/components/ui/skeleton';

type FilterType = 'all' | 'contributions' | 'datasets' | 'payouts' | 'audit';

export default function TransparencyLog() {
    const router = useRouter();
    const { supabase, user, isLoading: authLoading } = useSupabase();
    const [contributorName, setContributorName] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [contributions, setContributions] = useState<any[]>([]);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If not authenticated, redirect to login
        if (!user) {
            router.push('/contributor/login');
            return;
        }

        fetchTransparencyData();
    }, [user, authLoading, router]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTransparencyData = async () => {
        try {
            // Get contributor by auth_user_id
            const { data: contributor } = await supabase
                .from('contributors')
                .select('*')
                .eq('auth_user_id', user!.id)
                .maybeSingle();

            if (contributor) {
                setContributorName(contributor.name || user!.user_metadata?.full_name || 'Contributor');

                // Fetch individual contributions with deep nesting for audit trail
                const { data: contributionsData } = await supabase
                    .from('data_contributions')
                    .select(`
            *,
            dataset:datasets (
                name,
                domain,
                licenses:licenses (
                    *,
                    company:companies (*)
                )
            )
          `)
                    .eq('contributor_id', contributor.contributor_id)
                    .order('created_at', { ascending: false });

                setContributions(contributionsData || []);

                // Get unique datasets this contributor is part of
                if (contributionsData && contributionsData.length > 0) {
                    const datasetIds = [...new Set(contributionsData.map((c: any) => c.dataset_id))];

                    const { data: datasetsData } = await supabase
                        .from('datasets')
                        .select('*')
                        .in('dataset_id', datasetIds);

                    setDatasets(datasetsData || []);

                    // Fetch payout records
                    const { data: payoutsData } = await supabase
                        .from('payout_records')
                        .select(`
              *,
              contribution:data_contributions (sample_data),
              dataset:datasets (name)
            `)
                        .eq('contributor_id', contributor.contributor_id)
                        .order('payout_date', { ascending: false });

                    setPayouts(payoutsData || []);
                }
            }
        } catch (error) {
            console.error('Error fetching transparency data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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

                    {/* Filter Bar Skeleton */}
                    <div className="flex gap-3 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-9 w-32 bg-white/5 rounded-lg animate-pulse"></div>
                        ))}
                    </div>

                    {/* List Skeletons */}
                    <div className="space-y-8">
                        <div>
                            <div className="h-8 w-48 bg-white/5 rounded mb-6 animate-pulse"></div>
                            <div className="space-y-4">
                                <ListItemSkeleton />
                                <ListItemSkeleton />
                                <ListItemSkeleton />
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
                        <Link
                            href="/contributor/dashboard"
                            className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                        YOUR DATA TRANSPARENCY
                    </h1>
                    <p className="text-white/50 text-lg">
                        Complete visibility into your contributions and earnings
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'all' as FilterType, label: 'All Activity' },
                        { id: 'contributions' as FilterType, label: 'My Contributions' },
                        { id: 'datasets' as FilterType, label: 'Datasets I\'m Part Of' },
                        { id: 'payouts' as FilterType, label: 'Payouts' },
                        { id: 'audit' as FilterType, label: 'Audit Trail' },
                    ].map((filterOption) => (
                        <button
                            key={filterOption.id}
                            onClick={() => setFilter(filterOption.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === filterOption.id
                                ? 'bg-white text-black'
                                : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.05] border border-white/10'
                                }`}
                        >
                            {filterOption.label}
                        </button>
                    ))}
                </div>

                {/* My Contributions Section */}
                {(filter === 'all' || filter === 'contributions') && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">My Data Contributions</h2>
                        {contributions.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                }
                                title="No contributions yet"
                                description="Start by contributing your first data sample to see it here"
                                action={{
                                    label: 'Contribute Data',
                                    onClick: () => router.push('/contributor/contribute'),
                                }}
                            />
                        ) : (
                            <div className="grid gap-4">
                                {contributions.map((contribution: any) => (
                                    <div
                                        key={contribution.contribution_id}
                                        className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Badge variant="default">{contribution.data_type}</Badge>
                                                    <span className="text-white/40 text-xs">→</span>
                                                    <span className="text-white/70 text-sm">{contribution.dataset?.name}</span>
                                                </div>
                                                <div className="bg-white/[0.02] p-3 rounded-lg font-mono text-sm text-white/80 mb-3">
                                                    {contribution.sample_data.substring(0, 150)}
                                                    {contribution.sample_data.length > 150 && '...'}
                                                </div>
                                                <div className="text-xs text-white/40">
                                                    Contributed on {formatDate(contribution.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-right ml-6">
                                                <div className="text-white/50 text-xs mb-1">Quality</div>
                                                <div className="text-xl font-bold text-white mb-3">
                                                    {contribution.quality_score.toFixed(0)}%
                                                </div>
                                                <div className="text-white/50 text-xs mb-1">Value</div>
                                                <div className="text-lg font-semibold text-white">
                                                    ${contribution.contribution_value.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Datasets I'm Part Of Section */}
                {(filter === 'all' || filter === 'datasets') && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Datasets I'm Part Of</h2>
                        {datasets.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                }
                                title="No datasets yet"
                                description="Contribute data samples to become part of platform datasets"
                            />
                        ) : (
                            <div className="grid gap-4">
                                {datasets.map((dataset: any) => {
                                    const myContributions = contributions.filter(
                                        (c) => c.dataset_id === dataset.dataset_id
                                    );
                                    return (
                                        <div
                                            key={dataset.dataset_id}
                                            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                        >
                                            <h3 className="text-xl font-bold text-white mb-2">{dataset.name}</h3>
                                            <p className="text-white/50 text-sm mb-4">{dataset.description}</p>
                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                                <div>
                                                    <div className="text-xs text-white/40 mb-1">Your Contributions</div>
                                                    <div className="text-white font-semibold">{myContributions.length} samples</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-white/40 mb-1">Total Dataset Size</div>
                                                    <div className="text-white/70 text-sm">
                                                        {dataset.total_contributions.toLocaleString()} samples
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-white/40 mb-1">Times Licensed</div>
                                                    <div className="text-white/70 text-sm">{dataset.times_licensed}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Payout Records Section */}
                {(filter === 'all' || filter === 'payouts') && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Payout Records</h2>
                        {payouts.length === 0 ? (
                            <EmptyState
                                icon={
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                                title="No payouts yet"
                                description="Your earnings will appear here when datasets containing your contributions are licensed"
                            />
                        ) : (
                            <div>
                                <div className="space-y-3 mb-6">
                                    {payouts.map((payout: any) => (
                                        <div
                                            key={payout.payout_id}
                                            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-5 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="text-white font-semibold mb-1">
                                                    {payout.dataset?.name || 'Unknown Dataset'}
                                                </div>
                                                <div className="text-white/50 text-sm">
                                                    {formatDate(payout.payout_date)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-emerald-400">+${payout.amount.toFixed(2)}</div>
                                                <div className="text-xs text-white/40">Per contribution share</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Earnings */}
                                <div className="bg-white/[0.03] backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-white/50 text-sm mb-1">Total Earnings</div>
                                            <div className="text-4xl font-bold text-emerald-400">
                                                ${payouts.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Audit Trail Section */}
                {(filter === 'all' || filter === 'audit') && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Immutable Audit Trail</h2>
                        <div className="space-y-8">
                            {contributions.map((contribution: any) => {
                                const licenses = contribution.dataset?.licenses || [];
                                const hasLicenses = licenses.length > 0;

                                return (
                                    <div key={contribution.contribution_id} className="relative pl-8 border-l border-white/10 last:border-0 pb-12 last:pb-0">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />

                                        {/* Contribution Card */}
                                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">Data Contribution Recorded</div>
                                                    <div className="text-white/40 text-sm">{formatDate(contribution.created_at)}</div>
                                                </div>
                                            </div>
                                            <div className="bg-black/30 rounded-lg p-3 text-sm text-white/60 font-mono mb-2">
                                                ID: {contribution.contribution_id}
                                            </div>
                                        </div>

                                        {/* Dataset Aggregation */}
                                        <div className="relative pl-8 border-l border-white/10 pb-8">
                                            <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-semibold">Aggregated into Dataset</div>
                                                        <div className="text-blue-400 text-sm">{contribution.dataset?.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Licensing Status */}
                                        {hasLicenses ? (
                                            licenses.map((license: any) => (
                                                <div key={license.license_id} className="relative pl-8 border-l border-white/10 pb-0">
                                                    <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                                    <div className="bg-purple-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mt-4">
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-semibold">Licensed by {license.company?.name}</div>
                                                                <div className="text-purple-400 text-sm">{license.company?.industry} Industry</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <div className="text-white/40 mb-1">Intended Use</div>
                                                                <div className="text-white/80">{license.intended_use}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-white/40 mb-1">License Date</div>
                                                                <div className="text-white/80">{formatDate(license.licensed_at)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="relative pl-8 border-l border-white/10 border-dashed pb-0 opacity-50">
                                                <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full bg-white/20" />
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mt-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="text-white/60 font-semibold">Awaiting Licensing</div>
                                                            <div className="text-white/30 text-sm">Data is available in marketplace</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
