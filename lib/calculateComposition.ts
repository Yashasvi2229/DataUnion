/**
 * Dataset Composition Calculator
 * Implements volume-weighted quality scoring for dataset analysis
 * 
 * Key Principle: File size matters! A 50MB file should weigh 50x more than a 1MB file
 */

export interface FileData {
    id: string;
    primaryTag: string; // e.g., "Medical", "Legal", "Financial"
    qualityScore: number; // 0-100
    sizeBytes: number;
}

export interface CategoryComposition {
    categoryName: string;
    weightedQualityScore: number; // Volume-weighted average quality
    volumePercentage: number; // % of total dataset size
    fileCount: number;
    totalBytes: number;
}

export interface CompositionReport {
    categories: CategoryComposition[];
    totalTrustScore: number; // Overall volume-weighted quality
    totalFiles: number;
    totalBytes: number;
}

/**
 * Calculate volume-weighted composition from file list
 * 
 * Algorithm:
 * 1. Group files by primaryTag (semantic grouping)
 * 2. For each category, calculate weighted quality: Σ(quality × size) / Σ(size)
 * 3. Calculate volume percentage: categorySize / totalSize × 100
 * 4. Calculate global trust score: Σ(categoryWeightedQuality × volumePercentage) / 100
 */
export function calculateComposition(files: FileData[]): CompositionReport {
    if (files.length === 0) {
        throw new Error('Cannot calculate composition for empty dataset');
    }

    // Step 1: Group files by primaryTag
    const categoryMap = new Map<string, FileData[]>();

    files.forEach(file => {
        const category = file.primaryTag || 'Uncategorized';
        if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(file);
    });

    // Step 2: Calculate total dataset size
    const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

    // Step 3: Calculate composition for each category
    const categories: CategoryComposition[] = [];

    categoryMap.forEach((categoryFiles, categoryName) => {
        // Calculate total size for this category
        const categoryTotalBytes = categoryFiles.reduce((sum, file) => sum + file.sizeBytes, 0);

        // Calculate VOLUME-WEIGHTED quality score
        // Formula: Σ(quality × size) / Σ(size)
        const weightedQualitySum = categoryFiles.reduce(
            (sum, file) => sum + (file.qualityScore * file.sizeBytes),
            0
        );
        const weightedQualityScore = weightedQualitySum / categoryTotalBytes;

        // Calculate volume percentage
        const volumePercentage = (categoryTotalBytes / totalBytes) * 100;

        categories.push({
            categoryName,
            weightedQualityScore: Math.round(weightedQualityScore * 10) / 10, // 1 decimal
            volumePercentage: Math.round(volumePercentage * 10) / 10, // 1 decimal
            fileCount: categoryFiles.length,
            totalBytes: categoryTotalBytes
        });
    });

    // Step 4: Sort by volume (largest first)
    categories.sort((a, b) => b.volumePercentage - a.volumePercentage);

    // Step 5: Calculate global trust score (volume-weighted average of all categories)
    const totalTrustScore = categories.reduce(
        (sum, cat) => sum + (cat.weightedQualityScore * cat.volumePercentage / 100),
        0
    );

    return {
        categories,
        totalTrustScore: Math.round(totalTrustScore * 10) / 10,
        totalFiles: files.length,
        totalBytes
    };
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get category color for visualization
 */
export function getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
        // Text categories
        'Product Reviews': 'bg-blue-500',
        'News': 'bg-purple-500',
        'Support': 'bg-cyan-500',
        'Spam': 'bg-red-500',
        'Text': 'bg-gray-500',

        // Sensor/IoT categories
        'Temperature': 'bg-orange-500',
        'Energy': 'bg-yellow-500',
        'Motion': 'bg-indigo-500',
        'Faulty': 'bg-red-600',
        'IoT': 'bg-teal-500',

        // Transportation categories
        'Public Transit': 'bg-green-500',
        'Private Vehicle': 'bg-blue-600',
        'Active Transport': 'bg-lime-500',
        'GPS Error': 'bg-red-500',

        // Medical categories
        'X-Ray': 'bg-sky-500',
        'MRI': 'bg-violet-500',
        'CT Scan': 'bg-fuchsia-500',
        'Medical': 'bg-pink-500',

        // Legacy/fallback
        'Legal': 'bg-purple-500',
        'Financial': 'bg-green-500',
        'Technical': 'bg-cyan-500',
        'Administrative': 'bg-yellow-500',
        'Research': 'bg-pink-500',
        'Uncategorized': 'bg-gray-500'
    };

    return colorMap[categoryName] || 'bg-gray-500';
}

/**
 * Example: Demonstrate weighted vs simple average
 * 
 * Dataset: 
 * - File A: 50MB, 90% quality, Medical
 * - File B: 1MB, 10% quality, Medical
 * 
 * Simple Average: (90 + 10) / 2 = 50%  ❌ WRONG
 * Weighted Average: (90×50 + 10×1) / (50+1) = 4510/51 = 88.4%  ✅ CORRECT
 */
