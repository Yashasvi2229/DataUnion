'use client';

import { useState, useEffect, use } from 'react';
import { CompositionVisualizer } from '@/components/dataset/CompositionVisualizer';
import { calculateComposition, FileData, CompositionReport } from '@/lib/calculateComposition';
import { Button } from '@/components/ui/button';

interface DatasetPageProps {
    params: Promise<{ id: string }>;
}

export default function DatasetPage({ params }: DatasetPageProps) {
    const { id } = use(params);
    const [composition, setComposition] = useState<CompositionReport | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock dataset info (replace with actual API call)
    const dataset = {
        id: id,
        name: 'Medical Research Dataset 2024',
        description: 'Comprehensive medical research data including patient records, clinical trials, and administrative documents',
        price: 1500,
        seller: 'Dr. Sarah Johnson',
        uploadDate: '2024-01-15'
    };

    useEffect(() => {
        // Simulate fetching dataset files
        // In production, this would be: fetch(`/api/dataset/${id}/files`)
        const mockFiles: FileData[] = [
            // Medical files (high quality, large size)
            { id: '1', primaryTag: 'Medical', qualityScore: 95, sizeBytes: 50 * 1024 * 1024 },
            { id: '2', primaryTag: 'Medical', qualityScore: 92, sizeBytes: 45 * 1024 * 1024 },
            { id: '3', primaryTag: 'Medical', qualityScore: 88, sizeBytes: 30 * 1024 * 1024 },
            { id: '4', primaryTag: 'Medical', qualityScore: 90, sizeBytes: 35 * 1024 * 1024 },

            // Administrative files (medium quality)
            { id: '5', primaryTag: 'Administrative', qualityScore: 75, sizeBytes: 20 * 1024 * 1024 },
            { id: '6', primaryTag: 'Administrative', qualityScore: 70, sizeBytes: 15 * 1024 * 1024 },

            // Low quality spam (small size)
            { id: '7', primaryTag: 'Spam', qualityScore: 25, sizeBytes: 5 * 1024 * 1024 },
        ];

        const report = calculateComposition(mockFiles);
        setComposition(report);
        setLoading(false);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading dataset...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{dataset.name}</h1>
                            <p className="text-gray-400 max-w-2xl">{dataset.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                                <span>By {dataset.seller}</span>
                                <span>•</span>
                                <span>Uploaded {dataset.uploadDate}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-cyan-400">${dataset.price}</div>
                            <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                                Purchase Dataset
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Quality Analysis Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Quality Analysis</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Volume-weighted composition breakdown
                            </p>
                        </div>
                        <div className="text-sm text-gray-400">
                            Based on {composition?.totalFiles} files
                        </div>
                    </div>

                    {composition && <CompositionVisualizer composition={composition} />}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">What's Included</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Full access to all {composition?.totalFiles} files</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Commercial usage rights</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Regular updates and corrections</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Technical support</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Use Cases</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">→</span>
                                <span>Medical AI model training</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">→</span>
                                <span>Clinical research analysis</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">→</span>
                                <span>Healthcare data science</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-cyan-400">→</span>
                                <span>Patient outcome prediction</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Why Volume-Weighted Matters */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-3">💡 Why Volume-Weighted Quality Matters</h3>
                    <p className="text-sm text-gray-300">
                        Unlike simple averages, our volume-weighted scoring ensures that larger, more substantial files
                        have appropriate impact on the overall quality score. A 50MB high-quality medical file contributes
                        50x more to the score than a 1MB spam file, giving you an accurate picture of what you're actually buying.
                    </p>
                </div>
            </div>
        </div>
    );
}
