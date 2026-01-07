'use client';

import { useState } from 'react';
import { CompositionVisualizer } from '@/components/dataset/CompositionVisualizer';
import { calculateComposition, FileData, CompositionReport } from '@/lib/calculateComposition';

export default function CompositionDemoPage() {
    // Mock Dataset: 3 categories with varying sizes and quality
    const mockDataset: FileData[] = [
        // Medical Category (60% volume, high quality)
        { id: '1', primaryTag: 'Medical', qualityScore: 95, sizeBytes: 50 * 1024 * 1024 }, // 50MB
        { id: '2', primaryTag: 'Medical', qualityScore: 92, sizeBytes: 45 * 1024 * 1024 }, // 45MB
        { id: '3', primaryTag: 'Medical', qualityScore: 88, sizeBytes: 30 * 1024 * 1024 }, // 30MB

        // Legal Category (30% volume, medium quality)
        { id: '4', primaryTag: 'Legal', qualityScore: 75, sizeBytes: 40 * 1024 * 1024 }, // 40MB
        { id: '5', primaryTag: 'Legal', qualityScore: 70, sizeBytes: 25 * 1024 * 1024 }, // 25MB

        // Spam Category (10% volume, low quality)
        { id: '6', primaryTag: 'Spam', qualityScore: 25, sizeBytes: 15 * 1024 * 1024 }, // 15MB
        { id: '7', primaryTag: 'Spam', qualityScore: 30, sizeBytes: 10 * 1024 * 1024 }, // 10MB
    ];

    const [composition] = useState<CompositionReport>(() => calculateComposition(mockDataset));

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">📊 Dataset Composition Analysis</h1>
                    <p className="text-gray-400">
                        Volume-weighted quality scoring demonstration
                    </p>
                </div>

                {/* Explanation Card */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">🧮 How Volume-Weighted Scoring Works</h2>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div>
                            <strong className="text-white">The Problem:</strong> Simple averaging treats all files equally.
                            A 1MB spam file would impact the score as much as a 50MB medical file.
                        </div>
                        <div>
                            <strong className="text-white">The Solution:</strong> Weight each file's quality by its size.
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 font-mono text-xs">
                            <div className="text-cyan-400 mb-2">Formula:</div>
                            <div>Weighted Quality = Σ(quality × size) / Σ(size)</div>
                            <div className="mt-3 text-gray-400">Example:</div>
                            <div>File A: 50MB @ 90% = 4500 points</div>
                            <div>File B: 1MB @ 10% = 10 points</div>
                            <div className="mt-2 text-green-400">Result: (4500 + 10) / 51 = 88.4% ✓</div>
                            <div className="text-red-400">Not: (90 + 10) / 2 = 50% ✗</div>
                        </div>
                    </div>
                </div>

                {/* Mock Data Display */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">📁 Mock Dataset</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/10">
                                <tr className="text-left text-gray-400">
                                    <th className="pb-2">File</th>
                                    <th className="pb-2">Category</th>
                                    <th className="pb-2">Quality</th>
                                    <th className="pb-2">Size</th>
                                    <th className="pb-2">Weight Points</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                {mockDataset.map((file, i) => {
                                    const sizeMB = file.sizeBytes / (1024 * 1024);
                                    const weightPoints = file.qualityScore * sizeMB;
                                    return (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-2">File {i + 1}</td>
                                            <td className="py-2">{file.primaryTag}</td>
                                            <td className="py-2">{file.qualityScore}%</td>
                                            <td className="py-2">{sizeMB.toFixed(0)}MB</td>
                                            <td className="py-2 text-cyan-400">{weightPoints.toFixed(0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Composition Visualizer */}
                <CompositionVisualizer composition={composition} />

                {/* Math Verification */}
                <div className="mt-8 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">✅ Math Verification</h2>
                    <div className="space-y-4 text-sm">
                        {composition.categories.map((cat, i) => {
                            const categoryFiles = mockDataset.filter(f => f.primaryTag === cat.categoryName);
                            const totalSize = categoryFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
                            const weightedSum = categoryFiles.reduce((sum, f) => sum + (f.qualityScore * f.sizeBytes), 0);
                            const calculated = weightedSum / totalSize;

                            return (
                                <div key={i} className="bg-black/30 rounded-lg p-4">
                                    <div className="font-semibold text-white mb-2">{cat.categoryName}</div>
                                    <div className="font-mono text-xs text-gray-400 space-y-1">
                                        <div>Files: {categoryFiles.map(f => `${f.qualityScore}%`).join(' + ')}</div>
                                        <div>Sizes: {categoryFiles.map(f => `${(f.sizeBytes / (1024 * 1024)).toFixed(0)}MB`).join(' + ')}</div>
                                        <div className="text-cyan-400">
                                            Weighted: ({categoryFiles.map(f => `${f.qualityScore}×${(f.sizeBytes / (1024 * 1024)).toFixed(0)}`).join(' + ')}) / {(totalSize / (1024 * 1024)).toFixed(0)}
                                        </div>
                                        <div className="text-green-400">
                                            = {calculated.toFixed(1)}% (displayed: {cat.weightedQualityScore}%)
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
