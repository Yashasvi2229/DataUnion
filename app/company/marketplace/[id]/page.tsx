'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { calculatePayoutPreview } from '@/lib/payoutUtils';
import { CompositionVisualizer } from '@/components/dataset/CompositionVisualizer';
import { calculateComposition, FileData, CompositionReport } from '@/lib/calculateComposition';

export default function DatasetDetail() {
    const router = useRouter();
    const params = useParams();
    const datasetId = params.id as string;

    const [dataset, setDataset] = useState<any>(null);
    const [payoutPreview, setPayoutPreview] = useState<any>(null);
    const [composition, setComposition] = useState<CompositionReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const name = localStorage.getItem('company_name');
        if (!name) {
            router.push('/company/login');
            return;
        }

        fetchDatasetDetails();
    }, [datasetId, router]);

    const fetchDatasetDetails = async () => {
        try {
            const supabase = createClient();

            // Fetch dataset
            const { data: datasetData } = await supabase
                .from('datasets')
                .select('*')
                .eq('dataset_id', datasetId)
                .single();

            if (datasetData) {
                setDataset(datasetData);

                // Calculate payout preview
                const preview = await calculatePayoutPreview(
                    datasetId,
                    datasetData.price_per_license || 0
                );
                setPayoutPreview(preview);

                // Fetch contributions for composition analysis
                const { data: contributions, error: contributionsError } = await supabase
                    .from('data_contributions')
                    .select('contribution_id, quality_score, data_type, sample_data')
                    .eq('dataset_id', datasetId);

                console.log('🔍 Composition Debug:', {
                    datasetId,
                    contributionsCount: contributions?.length || 0,
                    contributionsError,
                    sampleContribution: contributions?.[0]
                });

                if (contributions && contributions.length > 0) {
                    // Helper function to intelligently categorize contributions
                    const categorizeContribution = (c: any): string => {
                        const data = c.sample_data || '';
                        const type = c.data_type || '';

                        // For sensor data, parse JSON to determine sensor type
                        if (type === 'sensor') {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.sensor_type) {
                                    if (parsed.sensor_type === 'temperature') return 'Temperature';
                                    if (parsed.sensor_type === 'energy') return 'Energy';
                                    if (parsed.sensor_type === 'motion') return 'Motion';
                                    if (parsed.sensor_type === 'unknown') return 'Faulty';
                                }
                                if (parsed.mode) {
                                    if (parsed.mode === 'bus' || parsed.mode === 'metro') return 'Public Transit';
                                    if (parsed.mode === 'car') return 'Private Vehicle';
                                    if (parsed.mode === 'bicycle' || parsed.mode === 'walk') return 'Active Transport';
                                    if (parsed.mode === 'unknown') return 'GPS Error';
                                }
                                return 'IoT';
                            } catch (e) {
                                return 'IoT';
                            }
                        }

                        // For text data, categorize by content
                        if (type === 'text') {
                            if (data.includes('Product Review:')) return 'Product Reviews';
                            if (data.includes('News Commentary:')) return 'News';
                            if (data.includes('Customer Support:')) return 'Support';
                            if (data.includes('Spam:')) return 'Spam';
                            return 'Text';
                        }

                        // For image data, categorize by type
                        if (type === 'image') {
                            if (data.includes('xray')) return 'X-Ray';
                            if (data.includes('mri')) return 'MRI';
                            if (data.includes('ct')) return 'CT Scan';
                            return 'Medical';
                        }

                        return 'Uncategorized';
                    };

                    // Transform contributions to FileData format
                    const files: FileData[] = contributions.map(c => {
                        // Estimate size based on sample_data length
                        const sizeBytes = c.sample_data?.length || 1000;

                        // Intelligently determine category
                        const category = categorizeContribution(c);

                        return {
                            id: c.contribution_id,
                            primaryTag: category,
                            qualityScore: c.quality_score || 0,
                            sizeBytes: sizeBytes
                        };
                    });

                    console.log('📊 Files for composition:', files);

                    // Calculate composition
                    const report = calculateComposition(files);
                    console.log('✅ Composition report:', report);
                    setComposition(report);
                } else {
                    console.log('⚠️ No contributions found for composition analysis');
                }
            }
        } catch (error) {
            console.error('Error fetching dataset:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeStyles = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'mobility':
            case 'sensor':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'finance':
            case 'financial':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'healthcare':
            case 'medical':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'image':
            case 'vision':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'text':
            case 'language':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-white/[0.05] text-white/70 border-white/10';
        }
    };

    const getQualityColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 70) return 'text-yellow-400';
        return 'text-rose-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white/50">Loading...</div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white/50">Dataset not found</div>
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
                            href="/company/marketplace"
                            className="text-sm text-white/50 hover:text-sky-400 transition-colors"
                        >
                            ← Back to Marketplace
                        </Link>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Dataset Header */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <Badge className={getBadgeStyles(dataset.data_type)}>{dataset.data_type}</Badge>
                                <span className="text-white/40">•</span>
                                <span className="text-white/60 text-sm">{dataset.domain}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                {dataset.name}
                            </h1>
                            <p className="text-white/60 text-lg">{dataset.description}</p>
                        </div>

                        <div className="text-right ml-8">
                            <div className="text-sm text-white/40 mb-1">Quality Score</div>
                            <div className={`text-5xl font-bold ${getQualityColor(dataset.quality_score || 0)}`}>
                                {dataset.quality_score?.toFixed(0) || 'N/A'}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <div className="text-white/40 text-sm mb-1">Total Samples</div>
                        <div className="text-3xl font-bold text-white">
                            {dataset.total_contributions?.toLocaleString() || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div className="text-white/40 text-sm mb-1">Contributors</div>
                        <div className="text-3xl font-bold text-white">
                            {dataset.contributor_count || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div className="text-white/40 text-sm mb-1">Times Licensed</div>
                        <div className="text-3xl font-bold text-white">
                            {dataset.times_licensed || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-white/40 text-sm mb-1">Avg Quality</div>
                        <div className="text-3xl font-bold text-white">
                            {dataset.quality_score?.toFixed(0) || 0}%
                        </div>
                    </div>
                </div>

                {/* Dataset Composition Analysis */}
                {composition && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Dataset Composition</h2>
                                <p className="text-white/50 text-sm mt-1">
                                    Volume-weighted quality breakdown by category
                                </p>
                            </div>
                        </div>
                        <CompositionVisualizer composition={composition} />
                    </div>
                )}

                {/* Usage Terms */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Consent & Usage Terms</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Allowed Uses */}
                        <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Allowed Uses
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    AI/ML model training
                                </li>
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    Research and analysis
                                </li>
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    Product development
                                </li>
                            </ul>
                        </div>

                        {/* Restricted Uses */}
                        <div>
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Prohibited Uses
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    Re-identification attempts
                                </li>
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    Surveillance applications
                                </li>
                                <li className="flex items-start gap-2 text-white/60 text-sm">
                                    <span className="text-white/40 mt-0.5">•</span>
                                    Discriminatory purposes
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Pricing & Payout Breakdown */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Pricing & Payout Distribution</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-white/70">License Fee</span>
                            <span className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                                ${dataset.price_per_license?.toLocaleString() || 0}
                            </span>
                        </div>

                        {payoutPreview && (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/50">Platform Fee (10%)</span>
                                    <span className="text-white/50">
                                        -${payoutPreview.platformFee.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div>
                                        <div className="text-white font-semibold">Contributor Pool (90%)</div>
                                        <div className="text-white/50 text-xs mt-1">
                                            Distributed to {payoutPreview.totalContributors} contributors
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-white">
                                        ${payoutPreview.contributorPool.toLocaleString()}
                                    </span>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mt-4">
                                    <div className="text-xs text-white/40 mb-1">Avg Payout Per Contributor</div>
                                    <div className="text-lg font-semibold text-white">
                                        ~${payoutPreview.avgPayout.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-white/30 mt-1">
                                        *Actual amounts vary based on contribution quality
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* License Button */}
                <div className="flex gap-4">
                    <Button
                        onClick={() => router.push(`/company/license/${datasetId}`)}
                        className="flex-1 bg-white text-black hover:bg-white/90"
                        size="lg"
                    >
                        License This Dataset
                    </Button>
                    <Button
                        onClick={() => router.push('/company/marketplace')}
                        variant="secondary"
                        size="lg"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
