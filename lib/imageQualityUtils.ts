export interface ImageQualityResult {
    quality: number;
    breakdown: {
        resolution: number;
        sharpness: number;
        exposure: number;
        colorDepth: number;
        tags: string[];
        warnings: string[];
    };
}

export async function analyzeImageQuality(input: File | string): Promise<ImageQualityResult> {
    return new Promise((resolve, reject) => {
        // Handle demo placeholder specifically
        if (typeof input === 'string' && input === 'data:image/placeholder') {
            resolve({
                quality: 94,
                breakdown: {
                    resolution: 98,
                    sharpness: 92,
                    exposure: 95,
                    colorDepth: 88,
                    tags: ['#HighRes', '#SharpFocus', '#GoodExposure', '#MedicalImaging'],
                    warnings: []
                }
            });
            return;
        }

        const img = new Image();
        let url: string;
        let isObjectUrl = false;

        if (input instanceof File) {
            url = URL.createObjectURL(input);
            isObjectUrl = true;
        } else {
            url = input;
        }

        img.crossOrigin = "Anonymous"; // Try to handle CORS if it's a URL

        img.onload = () => {
            try {
                // Create canvas for analysis
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Limit analysis size for performance (max 2048px dimension)
                const MAX_DIMENSION = 2048;
                let width = img.width;
                let height = img.height;

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                // 1. Resolution Score (0-100)
                // Base on megapixels. 8MP (4K-ish) = 100, 2MP (1080p) = 80, 0.9MP (720p) = 60
                const megapixels = (img.width * img.height) / 1000000;
                let resolutionScore = 0;

                if (megapixels >= 8) resolutionScore = 100;
                else if (megapixels >= 2) resolutionScore = 80 + ((megapixels - 2) / 6) * 20; // Map 2-8MP to 80-100
                else if (megapixels >= 0.9) resolutionScore = 60 + ((megapixels - 0.9) / 1.1) * 20; // Map 0.9-2MP to 60-80
                else resolutionScore = Math.min(60, megapixels * 66); // Linear below 0.9MP

                // 2. Exposure Score (0-100)
                // Analyze luminance histogram. Ideal is a bell curve centered around 128.
                // Penalize clipped highlights (255) and crushed blacks (0).
                let totalLuminance = 0;
                const histogram = new Array(256).fill(0);
                let clippedBlacks = 0;
                let clippedWhites = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Perceived luminance
                    const l = 0.299 * r + 0.587 * g + 0.114 * b;

                    totalLuminance += l;
                    histogram[Math.floor(l)]++;

                    if (l < 5) clippedBlacks++;
                    if (l > 250) clippedWhites++;
                }

                const pixelCount = width * height;
                const avgLuminance = totalLuminance / pixelCount;

                // Ideal average luminance is around 128 (mid-grey)
                // Score drops as it moves away from 128
                const luminanceDist = Math.abs(128 - avgLuminance);
                let exposureScore = Math.max(0, 100 - (luminanceDist * 0.8));

                // Penalize clipping if > 5% of pixels are clipped
                const blackClipRatio = clippedBlacks / pixelCount;
                const whiteClipRatio = clippedWhites / pixelCount;

                if (blackClipRatio > 0.05) exposureScore -= (blackClipRatio - 0.05) * 200;
                if (whiteClipRatio > 0.05) exposureScore -= (whiteClipRatio - 0.05) * 200;

                exposureScore = Math.max(0, Math.min(100, exposureScore));

                // 3. Contrast/Color Depth (0-100)
                // Measure standard deviation of luminance (RMS contrast)
                let sumSquaredDiff = 0;
                for (let i = 0; i < 256; i++) {
                    const count = histogram[i];
                    if (count > 0) {
                        const value = i;
                        const diff = value - avgLuminance;
                        sumSquaredDiff += (diff * diff) * count;
                    }
                }
                const stdDev = Math.sqrt(sumSquaredDiff / pixelCount);
                // Typical good contrast stdDev is around 50-70. Low contrast < 30.
                let contrastScore = Math.min(100, (stdDev / 60) * 100);

                // 4. Sharpness (0-100)
                // Simple Laplacian edge detection on a subsample (center of image)
                // We'll sample a 500x500 patch from the center to save time
                const sampleSize = 500;
                const startX = Math.max(0, Math.floor((width - sampleSize) / 2));
                const startY = Math.max(0, Math.floor((height - sampleSize) / 2));
                const sampleW = Math.min(width, sampleSize);
                const sampleH = Math.min(height, sampleSize);

                let edgeSum = 0;
                const stride = width * 4; // Full width stride

                // Laplacian kernel:
                //  0  1  0
                //  1 -4  1
                //  0  1  0

                for (let y = startY + 1; y < startY + sampleH - 1; y++) {
                    for (let x = startX + 1; x < startX + sampleW - 1; x++) {
                        const i = (y * width + x) * 4;

                        // Get luminance of current and neighbors
                        const l_c = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const l_u = 0.299 * data[i - stride] + 0.587 * data[i - stride + 1] + 0.114 * data[i - stride + 2];
                        const l_d = 0.299 * data[i + stride] + 0.587 * data[i + stride + 1] + 0.114 * data[i + stride + 2];
                        const l_l = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
                        const l_r = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];

                        const laplacian = Math.abs(l_u + l_d + l_l + l_r - (4 * l_c));
                        edgeSum += laplacian;
                    }
                }

                const avgEdge = edgeSum / (sampleW * sampleH);
                // avgEdge typically ranges 0-20. >10 is very sharp. <3 is blurry.
                let sharpnessScore = Math.min(100, (avgEdge / 8) * 100);
                sharpnessScore = Math.max(0, sharpnessScore);


                // Compile Results
                const warnings: string[] = [];
                const tags: string[] = [];

                if (resolutionScore > 90) tags.push('#HighRes');
                else if (resolutionScore < 50) warnings.push('Low Resolution');

                if (sharpnessScore > 80) tags.push('#SharpFocus');
                else if (sharpnessScore < 40) warnings.push('Blurry Image');

                if (exposureScore > 80) tags.push('#GoodExposure');
                else if (exposureScore < 40) warnings.push('Poor Exposure');

                if (contrastScore > 80) tags.push('#HighContrast');

                const finalQuality = Math.round(
                    (resolutionScore * 0.3) +
                    (sharpnessScore * 0.3) +
                    (exposureScore * 0.2) +
                    (contrastScore * 0.2)
                );

                resolve({
                    quality: finalQuality,
                    breakdown: {
                        resolution: Math.round(resolutionScore),
                        sharpness: Math.round(sharpnessScore),
                        exposure: Math.round(exposureScore),
                        colorDepth: Math.round(contrastScore),
                        tags,
                        warnings
                    }
                });

                if (isObjectUrl) URL.revokeObjectURL(url);
            } catch (error) {
                if (isObjectUrl) URL.revokeObjectURL(url);
                reject(error);
            }
        };

        img.onerror = () => {
            if (isObjectUrl) URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
