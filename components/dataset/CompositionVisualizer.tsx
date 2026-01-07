'use client';

import { CategoryComposition, CompositionReport, formatBytes, getCategoryColor } from '@/lib/calculateComposition';

interface CompositionVisualizerProps {
    composition: CompositionReport;
}

export function CompositionVisualizer({ composition }: CompositionVisualizerProps) {
    return (
        <div className="space-y-8">
            {/* Global Trust Score */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Total Trust Score</div>
                    <div className={`text-6xl font-bold mb-2 ${composition.totalTrustScore >= 80 ? 'text-green-400' :
                            composition.totalTrustScore >= 60 ? 'text-yellow-400' :
                                composition.totalTrustScore >= 40 ? 'text-orange-400' :
                                    'text-red-400'
                        }`}>
                        {composition.totalTrustScore}%
                    </div>
                    <div className="text-sm text-gray-400">
                        Based on {composition.totalFiles} files • {formatBytes(composition.totalBytes)}
                    </div>
                </div>
            </div>

            {/* Composition Bar */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Dataset Composition</h3>
                    <span className="text-sm text-gray-400">Volume-weighted distribution</span>
                </div>

                {/* Stacked Bar */}
                <div className="relative h-12 w-full flex rounded-lg overflow-hidden border border-white/10">
                    {composition.categories.map((category, index) => (
                        <div
                            key={index}
                            style={{ width: `${category.volumePercentage}%` }}
                            className={`${getCategoryColor(category.categoryName)} hover:brightness-110 transition-all cursor-pointer relative group`}
                            title={`${category.categoryName}: ${category.volumePercentage}%`}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                <div className="font-semibold">{category.categoryName}</div>
                                <div className="text-gray-300">{category.volumePercentage}% of dataset</div>
                                <div className="text-gray-300">{category.weightedQualityScore}% quality</div>
                                <div className="text-gray-400">{category.fileCount} files</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                    {composition.categories.map((category, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-sm ${getCategoryColor(category.categoryName)}`} />
                            <span className="text-gray-400">
                                {category.categoryName} ({category.volumePercentage}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Breakdown Grid */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {composition.categories.map((category, index) => (
                        <CategoryCard key={index} category={category} />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface CategoryCardProps {
    category: CategoryComposition;
}

function CategoryCard({ category }: CategoryCardProps) {
    const isLowQuality = category.weightedQualityScore < 50;

    return (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${getCategoryColor(category.categoryName)}`} />
                    <h4 className="font-semibold text-white">{category.categoryName}</h4>
                </div>
                {isLowQuality && (
                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
                        Low Quality
                    </span>
                )}
            </div>

            {/* Quality Score */}
            <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-3xl font-bold ${isLowQuality ? 'text-red-400' : 'text-green-400'
                        }`}>
                        {category.weightedQualityScore}%
                    </span>
                    <span className="text-sm text-gray-500">quality</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isLowQuality
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                        style={{ width: `${category.weightedQualityScore}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-white font-semibold">{category.volumePercentage}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Files</span>
                    <span className="text-white">{category.fileCount}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Size</span>
                    <span className="text-white">{formatBytes(category.totalBytes)}</span>
                </div>
            </div>
        </div>
    );
}
