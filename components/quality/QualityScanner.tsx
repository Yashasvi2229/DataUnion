// V4 Bulletproof Quality Scanner Component
// Visualization layer with transparency card and trust formula

'use client';

import { useState } from 'react';
import { useTextValuation } from '@/lib/hooks/useTextValuation';
import { Button } from '@/components/ui/button';

export function QualityScanner() {
    const [inputText, setInputText] = useState('');
    const { isReady, isProcessing, progress, progressMessage, result, error, valuate, reset } = useTextValuation();

    const handleAnalyze = () => {
        if (inputText.trim()) {
            valuate(inputText);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setInputText(text);
        } catch (err) {
            console.error('Failed to read file:', err);
        }
    };

    // Get color based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 border-green-500';
        if (score >= 50) return 'text-yellow-400 border-yellow-500';
        return 'text-red-400 border-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500/10';
        if (score >= 50) return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                    Project Vector V4
                </h1>
                <p className="text-gray-400">
                    Bulletproof Semantic Valuation • Strict Scoring • Veto Penalties
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Upload Document to Scan</h2>
                    <div className="flex gap-2">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".txt,.pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
                                📄 Upload File
                            </div>
                        </label>
                    </div>
                </div>

                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here or upload a file..."
                    className="w-full h-48 bg-black/30 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    disabled={isProcessing}
                />

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        {inputText.split(/\s+/).filter(w => w.length > 0).length} words
                    </div>
                    <Button
                        onClick={handleAnalyze}
                        disabled={!isReady || isProcessing || !inputText.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Analyzing...' : '🔍 Analyze Quality'}
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {!isReady && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-400">Downloading Neural Engine</h3>
                            <p className="text-sm text-yellow-300/70">
                                Loading model (~23MB)... This only happens once.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Animation - "Brain Scan" */}
            {isProcessing && (
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                    <div className="space-y-6">
                        {/* Brain Scan Animation */}
                        <div className="flex justify-center">
                            <div className="relative w-32 h-32">
                                {/* Outer ring */}
                                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
                                {/* Middle ring */}
                                <div className="absolute inset-2 border-4 border-cyan-500/50 rounded-full animate-pulse" />
                                {/* Inner core */}
                                <div className="absolute inset-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse flex items-center justify-center">
                                    <span className="text-white text-2xl">🧠</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Reading Concepts...</span>
                                <span className="text-cyan-400 font-semibold">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-400">
                            {progressMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-red-400 text-2xl">⚠️</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-400">Analysis Error</h3>
                            <p className="text-sm text-red-300/70 mt-1">{error}</p>
                        </div>
                        <Button
                            onClick={reset}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Results - Transparency Card */}
            {result && (
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 space-y-6">
                    {/* Overall Score - Large, Color-Coded */}
                    <div className="text-center space-y-4">
                        <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full border-4 ${getScoreColor(result.score)} ${getScoreBg(result.score)} p-2`}>
                            <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center">
                                <div className="text-center">
                                    <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                                        {result.score}
                                    </div>
                                    <div className="text-xs text-gray-400">/ 100</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Quality Score</h3>
                            <p className="text-sm text-gray-400">
                                {result.metadata.dominantDomain.charAt(0).toUpperCase() + result.metadata.dominantDomain.slice(1)} Domain
                            </p>
                        </div>
                    </div>

                    {/* Tags */}
                    {result.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {result.metadata.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Warnings */}
                    {result.metadata.warnings.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            {result.metadata.warnings.map((warning, i) => (
                                <div key={i} className="flex items-center gap-2 text-red-400 font-semibold">
                                    {warning}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Breakdown Grid - 4 Pillars */}
                    <div className="grid grid-cols-2 gap-4">
                        <ScorePillar
                            label="Domain Match"
                            sublabel={result.metadata.dominantDomain.charAt(0).toUpperCase() + result.metadata.dominantDomain.slice(1)}
                            score={result.breakdown.domain}
                            color="cyan"
                        />
                        <ScorePillar
                            label="Logical Flow"
                            sublabel="Coherence"
                            score={result.breakdown.coherence}
                            color="blue"
                        />
                        <ScorePillar
                            label="Information Density"
                            sublabel="Entities"
                            score={result.breakdown.entityDensity}
                            color="purple"
                        />
                        <ScorePillar
                            label="Novelty"
                            sublabel="Uniqueness"
                            score={result.breakdown.novelty}
                            color="pink"
                        />
                    </div>

                    {/* Metadata */}
                    <div className="border-t border-white/10 pt-6 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Analysis Metadata
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500">Chunks Analyzed</div>
                                <div className="text-white font-semibold">{result.metadata.chunkCount}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Spam Check</div>
                                <div className="text-white font-semibold">
                                    {result.metadata.isSpam ? '❌ Failed' : '✅ Passed'}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500">Repetition Check</div>
                                <div className="text-white font-semibold">
                                    {result.metadata.isRepetitive ? '❌ Failed' : '✅ Passed'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transparency Footer - Trust Formula */}
                    <div className="border-t border-white/10 pt-6">
                        <div className="bg-black/30 rounded-lg p-4 space-y-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                🔍 Transparency: How This Score Was Calculated
                            </h4>
                            <p className="text-sm text-gray-300 font-mono">
                                Trust Formula: (Domain × 0.4) + (Flow × 0.4) + (Density × 0.2) • [Spam Veto Applied]
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>• Strict Curve: Similarity below 0.6 scores 0 points</p>
                                <p>• Spam Veto: 90% penalty if spam detected (similarity &gt; 0.65)</p>
                                <p>• Repetition Veto: 80% penalty if &gt;50% chunks are repetitive</p>
                                <p>• All processing happens in your browser. No data sent to servers.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            onClick={reset}
                            variant="outline"
                            className="flex-1 border-white/10 text-white hover:bg-white/5"
                        >
                            Analyze Another
                        </Button>
                        <Button
                            onClick={() => {
                                const data = JSON.stringify(result, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'valuation-report.json';
                                a.click();
                            }}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        >
                            📥 Export Report
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Score Pillar Component
function ScorePillar({
    label,
    sublabel,
    score,
    color,
}: {
    label: string;
    sublabel: string;
    score: number;
    color: 'cyan' | 'blue' | 'purple' | 'pink';
}) {
    const colorClasses = {
        cyan: 'from-cyan-500 to-cyan-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
    };

    return (
        <div className="bg-black/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-gray-500">{sublabel}</div>
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{score}</span>
                <span className="text-sm text-gray-500 mb-1">/ 100</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

// Displays loading states, processing animation, and transparent score breakdown

