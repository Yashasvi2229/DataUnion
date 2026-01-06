'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CometCard } from '@/components/ui/comet-card';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { useSupabase } from '@/components/providers/supabase-provider';
import {
    DEMO_DATA_SAMPLES,
    DATA_TYPE_OPTIONS,
    getDatasetAssignment,
    calculateQualityScore,
    calculateContributionValue,
} from '@/lib/mockContributionData';

type Step = 'type-select' | 'demo-select' | 'custom-input' | 'review-terms' | 'confirmation';

export default function ContributeData() {
    const router = useRouter();
    const { supabase, user } = useSupabase();
    const [step, setStep] = useState<Step>('type-select');
    const [dataType, setDataType] = useState<'text' | 'sensor' | 'image' | null>(null);
    const [mode, setMode] = useState<'demo' | 'custom' | null>(null);
    const [selectedSample, setSelectedSample] = useState<any>(null);
    const [customData, setCustomData] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contributionResult, setContributionResult] = useState<any>(null);

    const handleDataTypeSelect = (type: 'text' | 'sensor' | 'image', selectedMode: 'demo' | 'custom') => {
        setDataType(type);
        setMode(selectedMode);
        setStep(selectedMode === 'demo' ? 'demo-select' : 'custom-input');
    };

    const handleDemoSelect = (sample: any) => {
        setSelectedSample(sample);
        setStep('review-terms'); // Go to terms review instead of direct submission
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !dataType) return;

        setUploadedFile(file);

        // For images, create preview and convert to base64
        if (dataType === 'image') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setFilePreview(result);
                setCustomData(`[Image: ${file.name}] ${result.substring(0, 100)}...`);
            };
            reader.readAsDataURL(file);
        }

        // For text files, read content
        if (dataType === 'text') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setCustomData(result);
                setFilePreview(result.substring(0, 200));
            };
            reader.readAsText(file);
        }

        // For sensor/JSON files
        if (dataType === 'sensor') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setCustomData(result);
                setFilePreview(result.substring(0, 200));
            };
            reader.readAsText(file);
        }
    };

    const handleCustomSubmit = () => {
        if (!customData.trim() || !dataType) {
            alert('Please enter your data');
            return;
        }

        setStep('review-terms'); // Go to terms review
    };

    const handleSubmit = async (
        sampleData: string,
        type: string,
        targetDataset: string,
        isDemo: boolean
    ) => {
        setLoading(true);

        try {
            if (!user) {
                router.push('/contributor/login');
                return;
            }

            // Get or create contributor
            let { data: contributor } = await supabase
                .from('contributors')
                .select('*')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            if (!contributor) {
                // Should have been created by dashboard, but just in case
                const { data: newContributor } = await supabase
                    .from('contributors')
                    .insert({
                        auth_user_id: user.id,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        email: user.email,
                        total_earnings: 0
                    })
                    .select()
                    .single();
                contributor = newContributor;
            }

            if (!contributor) throw new Error('Failed to get contributor');

            // Get the target dataset
            const { data: dataset } = await supabase
                .from('datasets')
                .select('*')
                .eq('name', targetDataset)
                .single();

            if (!dataset) throw new Error('Dataset not found');

            // Run quality analysis
            let quality = 0;
            let qualityBreakdown = null;

            if (type === 'text') {
                // TEMPORARY: Worker-based analysis disabled due to transformers.js compatibility issue
                // Using enhanced heuristic analysis with detailed breakdown
                console.log('Using enhanced heuristic analysis...');

                const wordCount = sampleData.split(/\s+/).filter(w => w.length > 0).length;
                const capitalizedWords = sampleData.match(/\b[A-Z][a-z]+/g) || [];
                const numbers = sampleData.match(/\b\d+/g) || [];
                const uniqueWords = new Set(sampleData.toLowerCase().split(/\s+/)).size;

                // Calculate scores based on heuristics
                const lengthScore = Math.min((wordCount / 100) * 100, 100);
                const diversityScore = Math.min((uniqueWords / wordCount) * 150, 100);
                const entityScore = Math.min(((capitalizedWords.length + numbers.length) / wordCount) * 200, 100);

                // Determine domain based on keywords
                const medicalKeywords = ['patient', 'medical', 'health', 'treatment', 'diagnosis', 'clinical'];
                const legalKeywords = ['law', 'legal', 'court', 'contract', 'attorney', 'regulation'];
                const techKeywords = ['software', 'algorithm', 'data', 'system', 'technology', 'code'];

                const lowerText = sampleData.toLowerCase();
                const medicalCount = medicalKeywords.filter(k => lowerText.includes(k)).length;
                const legalCount = legalKeywords.filter(k => lowerText.includes(k)).length;
                const techCount = techKeywords.filter(k => lowerText.includes(k)).length;

                let dominantDomain = 'general';
                let domainScore = 50;

                if (medicalCount > legalCount && medicalCount > techCount && medicalCount > 0) {
                    dominantDomain = 'medical';
                    domainScore = Math.min(60 + (medicalCount * 10), 100);
                } else if (legalCount > techCount && legalCount > 0) {
                    dominantDomain = 'legal';
                    domainScore = Math.min(60 + (legalCount * 10), 100);
                } else if (techCount > 0) {
                    dominantDomain = 'tech';
                    domainScore = Math.min(60 + (techCount * 10), 100);
                }

                // Build tags
                const tags: string[] = [];
                if (domainScore > 70) {
                    tags.push(`#${dominantDomain.charAt(0).toUpperCase() + dominantDomain.slice(1)}`);
                }
                if (diversityScore > 80) {
                    tags.push('#HighCoherence');
                }
                if (entityScore > 70) {
                    tags.push('#InformationRich');
                }

                // Calculate final quality
                quality = Math.round((domainScore * 0.4) + (diversityScore * 0.4) + (entityScore * 0.2));

                qualityBreakdown = {
                    domain: Math.round(domainScore),
                    coherence: Math.round(diversityScore),
                    entityDensity: Math.round(entityScore),
                    novelty: 100, // Assume novel for now
                    tags,
                    warnings: [],
                    dominantDomain,
                };

                console.log('Enhanced analysis complete:', { quality, qualityBreakdown });
            } else if (type === 'sensor') {
                // Enhanced Sensor Data Quality Analysis
                console.log('Analyzing sensor data quality with enhanced detection...');

                try {
                    // Try to parse as JSON
                    const jsonData = JSON.parse(sampleData);

                    // Detect if it's an array of readings or single reading
                    let isArray = Array.isArray(jsonData);
                    let readings = isArray ? jsonData : [jsonData];

                    // Check for nested sensor data (common pattern: data inside 'metrics', 'readings', 'data' array)
                    if (!isArray && readings.length === 1) {
                        const topLevel = readings[0];
                        const nestedArrayKeys = ['metrics', 'readings', 'data', 'samples', 'measurements'];

                        for (const key of nestedArrayKeys) {
                            if (topLevel[key] && Array.isArray(topLevel[key]) && topLevel[key].length > 0) {
                                console.log(`[Sensor] Found nested data in '${key}' array`);
                                readings = topLevel[key];
                                isArray = true;
                                break;
                            }
                        }
                    }

                    if (readings.length === 0) {
                        throw new Error('Empty sensor data');
                    }

                    // Analyze first reading for structure
                    const firstReading = readings[0];

                    // Recursive function to flatten nested objects
                    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
                        return Object.keys(obj).reduce((acc: any, k) => {
                            const pre = prefix.length ? prefix + '.' : '';
                            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                                Object.assign(acc, flattenObject(obj[k], pre + k));
                            } else {
                                acc[pre + k] = obj[k];
                            }
                            return acc;
                        }, {});
                    };

                    const flatReading = flattenObject(firstReading);
                    const fields = Object.keys(flatReading);
                    const values = Object.values(flatReading);

                    // Helper to find value by fuzzy key match
                    const getValue = (keywords: string[]) => {
                        const key = fields.find(f => {
                            const lower = f.toLowerCase();
                            return keywords.some(k => lower === k || lower.endsWith('.' + k) || lower.includes(k));
                        });
                        return key ? flatReading[key] : undefined;
                    };

                    // 1. DYNAMIC SENSOR TYPE DETECTION
                    let sensorType = 'unknown';
                    let detectedFields: string[] = [];

                    const checkType = (keywords: string[]) => fields.some(f => keywords.some(k => f.toLowerCase().includes(k)));

                    // Location sensors
                    if (checkType(['latitude', 'longitude', 'lat', 'lon', 'gps'])) {
                        sensorType = 'location';
                        detectedFields = fields.filter(f => ['latitude', 'longitude', 'lat', 'lon', 'altitude', 'speed', 'heading', 'accuracy'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Environmental sensors
                    else if (checkType(['temperature', 'humidity', 'pressure', 'temp', 'airquality', 'co2'])) {
                        sensorType = 'environmental';
                        detectedFields = fields.filter(f => ['temperature', 'humidity', 'pressure', 'airquality', 'co2', 'temp'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Motion/Accelerometer
                    else if (checkType(['accelerometer', 'gyroscope', 'acceleration', 'accel', 'gyro'])) {
                        sensorType = 'motion';
                        detectedFields = fields.filter(f => ['x', 'y', 'z', 'acceleration', 'gyroscope', 'magnetometer'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Health/Biometric
                    else if (checkType(['heartrate', 'steps', 'calories', 'bpm', 'spo2', 'bloodpressure'])) {
                        sensorType = 'health';
                        detectedFields = fields.filter(f => ['heartrate', 'steps', 'calories', 'bpm', 'spo2', 'bloodpressure'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Light sensors
                    else if (checkType(['light', 'lux', 'brightness', 'illuminance'])) {
                        sensorType = 'light';
                        detectedFields = fields.filter(f => ['light', 'lux', 'brightness', 'illuminance', 'uv'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Sound sensors
                    else if (checkType(['sound', 'noise', 'decibel', 'db', 'audio'])) {
                        sensorType = 'sound';
                        detectedFields = fields.filter(f => ['sound', 'noise', 'decibel', 'db', 'frequency'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Proximity/Distance
                    else if (checkType(['distance', 'proximity', 'range'])) {
                        sensorType = 'proximity';
                        detectedFields = fields.filter(f => ['distance', 'proximity', 'range'].some(k => f.toLowerCase().includes(k)));
                    }
                    // Generic IoT device
                    else {
                        sensorType = 'iot';
                        detectedFields = fields.filter(f => typeof flatReading[f] === 'number');
                    }

                    // 2. SCHEMA QUALITY CHECK (40%)
                    let schemaScore = 100;
                    const warnings: string[] = [];

                    // Check for proper data types
                    const numericFields = values.filter(v => typeof v === 'number').length;
                    const nullFields = values.filter(v => v === null || v === undefined).length;

                    if (nullFields > 0) {
                        schemaScore -= 20;
                        warnings.push('⚠️ Contains null/undefined values');
                    }

                    if (numericFields === 0 && sensorType !== 'iot') {
                        schemaScore -= 30;
                        warnings.push('⚠️ No numeric sensor readings found');
                    }

                    // Check for nested objects (good for complex sensors) - Original check was on values, but we flattened them.
                    // We can check if any key contains a dot to imply nesting.
                    const hasNesting = fields.some(f => f.includes('.'));
                    if (hasNesting && sensorType !== 'unknown') {
                        schemaScore = Math.min(schemaScore + 10, 100); // Bonus but cap at 100
                    }

                    // Ensure schema score is between 0-100
                    schemaScore = Math.max(0, Math.min(100, schemaScore));

                    // 3. ADAPTIVE VALIDATION (30%)
                    let validationScore = 100;

                    // Apply sensor-type-specific validation
                    if (sensorType === 'location') {
                        const lat = getValue(['latitude', 'lat']);
                        const lon = getValue(['longitude', 'lon']);
                        const speed = getValue(['speed']);

                        if (typeof lat === 'number' && (lat < -90 || lat > 90)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Invalid Latitude Range');
                        }
                        if (typeof lon === 'number' && (lon < -180 || lon > 180)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Invalid Longitude Range');
                        }
                        if (typeof speed === 'number' && speed < 0) {
                            validationScore -= 20;
                            warnings.push('⚠️ Negative Speed Value');
                        }
                    } else if (sensorType === 'environmental') {
                        const temp = getValue(['temperature', 'temp']);
                        const humidity = getValue(['humidity']);
                        const pressure = getValue(['pressure']);

                        if (typeof temp === 'number' && (temp < -100 || temp > 100)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Temperature out of range (-100°C to 100°C)');
                        }
                        if (typeof humidity === 'number' && (humidity < 0 || humidity > 100)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Humidity must be 0-100%');
                        }
                        if (typeof pressure === 'number' && (pressure < 800 || pressure > 1200)) {
                            validationScore -= 20;
                            warnings.push('⚠️ Pressure out of typical range (800-1200 hPa)');
                        }
                    } else if (sensorType === 'health') {
                        const hr = getValue(['heartrate', 'heart_rate', 'bpm']);
                        const spo2 = getValue(['spo2', 'oxygen']);

                        if (typeof hr === 'number' && (hr < 30 || hr > 220)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Heart rate out of range (30-220 bpm)');
                        }
                        if (typeof spo2 === 'number' && (spo2 < 0 || spo2 > 100)) {
                            validationScore -= 30;
                            warnings.push('⚠️ SpO2 must be 0-100%');
                        }
                    } else if (sensorType === 'motion') {
                        // Check if acceleration values are reasonable (-20g to +20g)
                        ['x', 'y', 'z'].forEach(axis => {
                            const val = getValue([axis, `accel_${axis}`, `acceleration_${axis}`]);
                            if (typeof val === 'number' && Math.abs(val) > 20) {
                                validationScore -= 15;
                                warnings.push(`⚠️ ${axis.toUpperCase()}-axis value seems extreme`);
                            }
                        });
                    } else if (sensorType === 'light') {
                        const lux = getValue(['light', 'lux', 'brightness', 'illuminance']);
                        if (typeof lux === 'number' && lux < 0) {
                            validationScore -= 30;
                            warnings.push('⚠️ Light level cannot be negative');
                        }
                    } else if (sensorType === 'sound') {
                        const db = getValue(['sound', 'noise', 'decibel', 'db']);
                        if (typeof db === 'number' && (db < 0 || db > 140)) {
                            validationScore -= 30;
                            warnings.push('⚠️ Sound level out of range (0-140 dB)');
                        }
                    }

                    // Ensure validation score is between 0-100
                    validationScore = Math.max(0, Math.min(100, validationScore));

                    // 4. DATA PRECISION (20%)
                    const numericValues = values.filter(v => typeof v === 'number');
                    const precisionScore = numericValues.length > 0
                        ? (numericValues.filter(v => v.toString().includes('.')).length / numericValues.length * 100)
                        : 0; // If no numeric values, precision is 0

                    // 5. TEMPORAL COVERAGE & SAMPLING RATE (10%)
                    let temporalScore = 0;

                    // Check for timestamp
                    const hasTimestamp = fields.some(f =>
                        ['timestamp', 'time', 'datetime', 'date', 'ts'].some(k => f.toLowerCase().includes(k))
                    );

                    if (hasTimestamp) {
                        temporalScore = 50;

                        // Bonus: Check sampling consistency for arrays
                        if (isArray && readings.length > 1) {
                            // Find the timestamp key
                            const timestampKey = fields.find(f =>
                                ['timestamp', 'time', 'datetime', 'date', 'ts'].some(k => f.toLowerCase().includes(k))
                            );

                            if (timestampKey) {
                                // Extract timestamps from all readings (assuming consistent structure)
                                // We need to access the nested property if it was nested
                                const getNestedValue = (obj: any, path: string) => {
                                    return path.split('.').reduce((o, i) => o ? o[i] : null, obj);
                                };

                                const timestamps = readings.map(r => getNestedValue(r, timestampKey)).filter(t => t !== null && t !== undefined);

                                if (timestamps.length > 1) {
                                    // Check if timestamps are sequential numbers (or convertable to numbers)
                                    const numericTimestamps = timestamps.map(t => new Date(t).getTime()).filter(t => !isNaN(t));

                                    if (numericTimestamps.length > 1) {
                                        const intervals = [];
                                        for (let i = 1; i < numericTimestamps.length; i++) {
                                            intervals.push(Math.abs(numericTimestamps[i] - numericTimestamps[i - 1]));
                                        }

                                        // Calculate consistency (lower std dev = more consistent)
                                        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                                        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
                                        const stdDev = Math.sqrt(variance);
                                        const consistency = Math.max(0, 100 - (stdDev / avgInterval * 100));

                                        temporalScore = 50 + (consistency / 2); // 50 base + up to 50 bonus
                                    }
                                }
                            }
                        } else {
                            temporalScore = 100; // Single reading with timestamp is perfect
                        }
                    }

                    // Build tags
                    const tags: string[] = [];
                    tags.push(`#${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}`);

                    if (schemaScore >= 90) {
                        tags.push('#WellStructured');
                    }
                    if (validationScore >= 90) {
                        tags.push('#ValidData');
                    }
                    if (precisionScore >= 70) {
                        tags.push('#HighPrecision');
                    }
                    if (isArray && readings.length > 1) {
                        tags.push('#TimeSeries');
                    }
                    if (detectedFields.length >= 3) {
                        tags.push('#MultiSensor');
                    }

                    // Calculate final quality
                    quality = Math.round(
                        (schemaScore * 0.4) +
                        (validationScore * 0.3) +
                        (precisionScore * 0.2) +
                        (temporalScore * 0.1)
                    );

                    qualityBreakdown = {
                        domain: Math.round(schemaScore),
                        coherence: Math.round(validationScore),
                        entityDensity: Math.round(precisionScore),
                        novelty: Math.round(temporalScore),
                        tags,
                        warnings,
                        dominantDomain: sensorType,
                    };

                    console.log('Enhanced sensor analysis complete:', {
                        quality,
                        qualityBreakdown,
                        detectedType: sensorType,
                        readingsCount: readings.length,
                        detectedFields
                    });
                } catch (error) {
                    console.error('Failed to parse sensor data:', error);
                    // Fallback to simple calculation
                    quality = calculateQualityScore(type, sampleData);
                }
            } else {
                // Use simple calculation for demo or image data
                quality = isDemo
                    ? selectedSample?.estimatedValue ? 90 + Math.random() * 8 : calculateQualityScore(type, sampleData)
                    : calculateQualityScore(type, sampleData);
            }

            const value = isDemo
                ? selectedSample?.estimatedValue || calculateContributionValue(quality, type)
                : calculateContributionValue(quality, type);

            console.log('Final quality:', quality, 'Breakdown:', qualityBreakdown);

            // Create data contribution
            const { data: contribution, error } = await supabase
                .from('data_contributions')
                .insert({
                    contributor_id: contributor.contributor_id,
                    dataset_id: dataset.dataset_id,
                    data_type: type,
                    sample_data: sampleData,
                    quality_score: quality,
                    contribution_value: value,
                })
                .select()
                .single();

            if (error) throw error;

            // Update dataset stats
            await supabase
                .from('datasets')
                .update({
                    total_contributions: dataset.total_contributions + 1,
                    contributor_count: dataset.contributor_count + 1,
                })
                .eq('dataset_id', dataset.dataset_id);

            setContributionResult({
                sample: sampleData,
                dataset: dataset.name,
                quality,
                value,
                datasetSize: dataset.total_contributions + 1,
                contributionId: contribution.contribution_id,
                qualityBreakdown,
                dataType: type,
            });

            setStep('confirmation');
        } catch (error) {
            console.error('Error creating contribution:', error);
            alert('Error creating contribution. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <Link href="/contributor/dashboard" className="text-xl font-bold text-white tracking-tight">
                        DataUnion
                    </Link>
                    <Link href="/contributor/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">
                        <span>Step {step === 'type-select' ? 1 : step === 'demo-select' || step === 'custom-input' ? 2 : step === 'review-terms' ? 3 : 4} of 4</span>
                        <span className="text-emerald-400">
                            {step === 'type-select' && 'Select Type'}
                            {(step === 'demo-select' || step === 'custom-input') && 'Input Data'}
                            {step === 'review-terms' && 'Review Terms'}
                            {step === 'confirmation' && 'Complete'}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                        <div
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all duration-500 ease-out relative"
                            style={{
                                width: `${step === 'type-select' ? 25 :
                                    step === 'demo-select' || step === 'custom-input' ? 50 :
                                        step === 'review-terms' ? 75 : 100
                                    }%`
                            }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent"></div>
                        </div>
                    </div>
                </div>

                {/* Step 1: Data Type Selection */}
                {step === 'type-select' && (
                    <div>
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                CONTRIBUTE YOUR DATA
                            </h1>
                            <p className="text-white/50 text-lg">
                                Choose what type of data you want to contribute
                            </p>
                        </div>

                        <div className="space-y-8">
                            {DATA_TYPE_OPTIONS.map((option) => {
                                // Define icons based on type
                                const getIcon = (type: string) => {
                                    switch (type) {
                                        case 'text':
                                            return (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            );
                                        case 'sensor':
                                            return (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                            );
                                        case 'image':
                                            return (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            );
                                        default:
                                            return null;
                                    }
                                };

                                return (
                                    <div key={option.value} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-white/80">
                                                {getIcon(option.value)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-white mb-2">
                                                    {option.label}
                                                </h3>
                                                <p className="text-white/50 text-sm">{option.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <CometCard>
                                                <button
                                                    onClick={() => handleDataTypeSelect(option.value as any, 'demo')}
                                                    className="w-full text-left p-0 rounded-xl transition-all group"
                                                >
                                                    <BackgroundGradient
                                                        containerClassName="rounded-2xl [&>div.absolute]:rounded-[inherit]"
                                                        className="rounded-xl bg-zinc-900"
                                                        colors={["#064e3b", "#059669", "#10b981", "#34d399"]}
                                                    >
                                                        <div className="p-5">
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-white mb-1">Use Demo Sample</div>
                                                                    <div className="text-sm text-white/50">Quick contribution with pre-made data</div>
                                                                </div>
                                                            </div>
                                                            <div className="inline-flex items-center gap-2 text-xs font-medium text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                                                                Select <span>→</span>
                                                            </div>
                                                        </div>
                                                    </BackgroundGradient>
                                                </button>
                                            </CometCard>

                                            <CometCard>
                                                <button
                                                    onClick={() => handleDataTypeSelect(option.value as any, 'custom')}
                                                    className="w-full text-left bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all group"
                                                >
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-white mb-1">Upload Your Own</div>
                                                            <div className="text-sm text-white/50">Contribute your actual data</div>
                                                        </div>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 text-xs font-medium text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                                                        Select <span>→</span>
                                                    </div>
                                                </button>
                                            </CometCard>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2A: Demo Sample Selection */}
                {step === 'demo-select' && dataType && (
                    <div>
                        <button
                            onClick={() => setStep('type-select')}
                            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>

                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                SELECT A DEMO SAMPLE
                            </h1>
                            <p className="text-white/50 text-lg">
                                Choose a pre-made {dataType} sample to contribute
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {DEMO_DATA_SAMPLES[dataType as keyof typeof DEMO_DATA_SAMPLES]?.map((sample: any) => (
                                <CometCard key={sample.id}>
                                    <button
                                        onClick={() => handleDemoSelect(sample)}
                                        disabled={loading}
                                        className="w-full text-left bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all disabled:opacity-50"
                                    >
                                        <div className="mb-3">
                                            <div className="text-white/40 text-xs mb-1">SAMPLE {dataType.toUpperCase()}</div>
                                            <div className="text-white font-mono text-sm bg-white/[0.02] p-3 rounded-lg">
                                                {sample.preview || sample.sample}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/50">Will be added to: {sample.targetDataset}</span>
                                            <span className="text-white font-semibold">~${sample.estimatedValue}</span>
                                        </div>
                                    </button>
                                </CometCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2B: Custom Input */}
                {step === 'custom-input' && dataType && (
                    <div>
                        <button
                            onClick={() => setStep('type-select')}
                            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>

                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                ENTER YOUR {dataType.toUpperCase()}
                            </h1>
                            <p className="text-white/50 text-lg">
                                Contribute your own data sample
                            </p>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                            {dataType === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Your Text Sample
                                    </label>

                                    {/* File Upload Option */}
                                    <div className="mb-4">
                                        <label className="block cursor-pointer">
                                            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-white/30 transition-colors">
                                                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-white/70 text-sm">
                                                    {uploadedFile ? uploadedFile.name : 'Upload Text File (.txt)'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".txt,.md,.csv"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="text-center text-white/30 text-xs mb-4">OR</div>

                                    {/* Manual Text Area */}
                                    <textarea
                                        value={customData}
                                        onChange={(e) => setCustomData(e.target.value)}
                                        placeholder="Enter your text data manually (e.g., social media post, comment, review)..."
                                        className="w-full h-32 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 resize-none"
                                    />
                                </div>
                            )}

                            {dataType === 'sensor' && (
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Sensor Data (JSON format)
                                    </label>

                                    {/* File Upload Option */}
                                    <div className="mb-4">
                                        <label className="block cursor-pointer">
                                            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-white/30 transition-colors">
                                                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-white/70 text-sm">
                                                    {uploadedFile ? uploadedFile.name : 'Upload JSON File (.json)'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".json,.txt"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="text-center text-white/30 text-xs mb-4">OR</div>

                                    {/* Manual Input */}
                                    <textarea
                                        value={customData}
                                        onChange={(e) => setCustomData(e.target.value)}
                                        placeholder='{"latitude": 12.9716, "longitude": 77.5946, "speed": 45}'
                                        className="w-full h-32 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/10 text-white placeholder:text-white/40 font-mono text-sm focus:outline-none focus:border-white/30 resize-none"
                                    />
                                    <p className="text-xs text-white/40 mt-2">Enter sensor readings in JSON format</p>
                                </div>
                            )}

                            {dataType === 'image' && (
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-4">
                                        Upload Medical Image
                                    </label>

                                    {/* File Upload */}
                                    <label className="block cursor-pointer mb-4">
                                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 rounded-lg bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-white/30 transition-colors">
                                            <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <div className="text-center">
                                                <span className="text-white/70 text-sm block mb-1">
                                                    {uploadedFile ? uploadedFile.name : 'Click to upload image'}
                                                </span>
                                                <span className="text-white/40 text-xs">
                                                    PNG, JPG, JPEG (Max 10MB)
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Image Preview */}
                                    {filePreview && (
                                        <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                                            <div className="text-xs text-white/40 mb-2">PREVIEW</div>
                                            <img
                                                src={filePreview}
                                                alt="Upload preview"
                                                className="max-w-full h-48 object-contain rounded-lg bg-black/20"
                                            />
                                        </div>
                                    )}

                                    <p className="text-xs text-white/50">
                                        For demo purposes: Upload anonymized medical images (X-rays, MRI scans, CT scans)
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleCustomSubmit}
                                disabled={!customData.trim() || loading}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? 'Processing...' : 'Review Terms'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review Usage Terms */}
                {step === 'review-terms' && (
                    <div>
                        <button
                            onClick={() => setStep(mode === 'demo' ? 'demo-select' : 'custom-input')}
                            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>

                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                REVIEW USAGE TERMS
                            </h1>
                            <p className="text-white/50 text-lg">
                                Understand how your data can be used before giving consent
                            </p>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
                            <h2 className="text-xl font-bold text-white mb-6">Data Usage Agreement</h2>

                            <div className="space-y-6">
                                {/* Allowed Uses */}
                                <div>
                                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Allowed Uses
                                    </h3>
                                    <ul className="space-y-2 ml-7">
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Training AI/ML models for legitimate purposes
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Research and analysis for public benefit
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Product development and quality improvement
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Educational and scientific purposes
                                        </li>
                                    </ul>
                                </div>

                                {/* Restrictions */}
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Restricted Uses
                                    </h3>
                                    <ul className="space-y-2 ml-7">
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            No re-identification of individuals
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            No sale to third parties without explicit consent
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            No use for surveillance or tracking
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            No discriminatory or harmful purposes
                                        </li>
                                    </ul>
                                </div>

                                {/* Data Retention */}
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Data Retention
                                    </h3>
                                    <ul className="space-y-2 ml-7">
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Data retained for maximum 5 years or until consent is revoked
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Can be deleted upon request at any time
                                        </li>
                                        <li className="flex items-start gap-2 text-white/60 text-sm">
                                            <span className="text-white/40 mt-0.5">•</span>
                                            Anonymization applied after licensing
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                            <Checkbox
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                label="I have read and accept the usage terms above"
                            />
                        </div>

                        <Button
                            onClick={() => {
                                if (!termsAccepted) {
                                    alert('Please accept the usage terms to continue');
                                    return;
                                }
                                // Prepare for submission
                                if (mode === 'demo' && selectedSample) {
                                    handleSubmit(selectedSample.sample, selectedSample.dataType, selectedSample.targetDataset, true);
                                } else if (mode === 'custom' && dataType) {
                                    const assignment = getDatasetAssignment(dataType, customData);
                                    handleSubmit(customData, dataType, assignment.dataset, false);
                                }
                            }}
                            disabled={!termsAccepted || loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? 'Processing...' : 'Proceed to Submit'}
                        </Button>
                    </div>
                )
                }

                {/* Processing State - Analyzing Quality */}
                {loading && step === 'review-terms' && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md">
                            <div className="space-y-6">
                                {/* Brain Scan Animation */}
                                <div className="flex justify-center">
                                    <div className="relative w-24 h-24">
                                        {/* Outer ring */}
                                        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
                                        {/* Middle ring */}
                                        <div className="absolute inset-2 border-4 border-cyan-500/50 rounded-full animate-pulse" />
                                        {/* Inner core */}
                                        <div className="absolute inset-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse flex items-center justify-center">
                                            <span className="text-white text-xl">🧠</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-white mb-2">Analyzing Quality...</h3>
                                    <p className="text-sm text-gray-400">
                                        Running semantic valuation on your contribution
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 'confirmation' && contributionResult && (
                    <div className="py-12">
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h1 className="text-4xl font-bold text-white mb-4">Contribution Added!</h1>
                            <p className="text-white/60 mb-2 max-w-md mx-auto">
                                Your data sample has been successfully added to a platform dataset
                            </p>
                        </div>

                        {/* Quality Analysis Card */}
                        {contributionResult.qualityBreakdown && (contributionResult.dataType === 'text' || contributionResult.dataType === 'sensor') ? (
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 max-w-4xl mx-auto">
                                {/* Overall Score */}
                                <div className="text-center mb-8">
                                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${contributionResult.quality >= 80 ? 'border-green-500 bg-green-500/10' :
                                        contributionResult.quality >= 50 ? 'border-yellow-500 bg-yellow-500/10' :
                                            'border-red-500 bg-red-500/10'
                                        } p-2`}>
                                        <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className={`text-4xl font-bold ${contributionResult.quality >= 80 ? 'text-green-400' :
                                                    contributionResult.quality >= 50 ? 'text-yellow-400' :
                                                        'text-red-400'
                                                    }`}>
                                                    {contributionResult.quality.toFixed(0)}
                                                </div>
                                                <div className="text-xs text-gray-400">/ 100</div>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mt-4">Quality Score</h3>
                                    <p className="text-sm text-gray-400">
                                        {contributionResult.qualityBreakdown.dominantDomain.charAt(0).toUpperCase() + contributionResult.qualityBreakdown.dominantDomain.slice(1)} Domain
                                    </p>
                                </div>

                                {/* Tags */}
                                {contributionResult.qualityBreakdown.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                                        {contributionResult.qualityBreakdown.tags.map((tag: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-300"
                                            >
                                                {tag.replace('#', '')}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Warnings */}
                                {contributionResult.qualityBreakdown.warnings?.length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                                        {contributionResult.qualityBreakdown.warnings.map((warning: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2 text-red-400 font-semibold">
                                                {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 4-Pillar Breakdown */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-sm font-semibold text-white mb-1">
                                            {contributionResult.dataType === 'sensor' ? 'Schema Quality' : 'Domain Match'}
                                        </div>
                                        <div className="text-sm text-gray-400 mb-2">
                                            {contributionResult.dataType === 'sensor' ? 'Structure & Types' : contributionResult.qualityBreakdown.dominantDomain}
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-white">{contributionResult.qualityBreakdown.domain}</span>
                                            <span className="text-sm text-gray-500 mb-1">/ 100</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${contributionResult.qualityBreakdown.domain >= 50
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                style={{ width: `${contributionResult.qualityBreakdown.domain}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-sm font-semibold text-white mb-1">
                                            {contributionResult.dataType === 'sensor' ? 'Data Validation' : 'Logical Flow'}
                                        </div>
                                        <div className="text-sm text-gray-400 mb-2">
                                            {contributionResult.dataType === 'sensor' ? 'Range Checks' : 'Coherence'}
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-white">{contributionResult.qualityBreakdown.coherence}</span>
                                            <span className="text-sm text-gray-500 mb-1">/ 100</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${contributionResult.qualityBreakdown.coherence >= 50
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                style={{ width: `${contributionResult.qualityBreakdown.coherence}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-sm font-semibold text-white mb-1">
                                            {contributionResult.dataType === 'sensor' ? 'Data Precision' : 'Information Density'}
                                        </div>
                                        <div className="text-sm text-gray-400 mb-2">
                                            {contributionResult.dataType === 'sensor' ? 'Decimal Values' : 'Entities'}
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-white">{contributionResult.qualityBreakdown.entityDensity}</span>
                                            <span className="text-sm text-gray-500 mb-1">/ 100</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${contributionResult.qualityBreakdown.entityDensity >= 50
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                style={{ width: `${contributionResult.qualityBreakdown.entityDensity}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-4">
                                        <div className="text-sm font-semibold text-white mb-1">
                                            {contributionResult.dataType === 'sensor' ? 'Temporal/Sampling' : 'Novelty'}
                                        </div>
                                        <div className="text-sm text-gray-400 mb-2">
                                            {contributionResult.dataType === 'sensor' ? 'Time Consistency' : 'Uniqueness'}
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-white">{contributionResult.qualityBreakdown.novelty}</span>
                                            <span className="text-sm text-gray-500 mb-1">/ 100</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${contributionResult.qualityBreakdown.novelty >= 50
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                style={{ width: `${contributionResult.qualityBreakdown.novelty}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Transparency Footer */}
                                <div className="border-t border-white/10 pt-6">
                                    <div className="bg-black/30 rounded-lg p-4">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            🔍 How This Score Was Calculated
                                        </h4>
                                        <p className="text-sm text-gray-300 font-mono mb-2">
                                            {contributionResult.dataType === 'sensor'
                                                ? '(Schema × 0.4) + (Validation × 0.3) + (Precision × 0.2) + (Temporal × 0.1)'
                                                : '(Domain × 0.4) + (Flow × 0.4) + (Density × 0.2) • [Veto Applied]'
                                            }
                                        </p>

                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Simple Quality Display for Non-Text */
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 max-w-2xl mx-auto text-left">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-white/40 mb-1">YOUR SAMPLE</div>
                                        <div className="bg-white/[0.02] p-3 rounded-lg font-mono text-sm text-white/80">
                                            {contributionResult.sample.substring(0, 100)}
                                            {contributionResult.sample.length > 100 && '...'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <div className="text-xs text-white/40 mb-1">ADDED TO DATASET</div>
                                            <div className="font-semibold text-white">{contributionResult.dataset}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/40 mb-1">QUALITY SCORE</div>
                                            <div className="font-semibold text-white">{contributionResult.quality.toFixed(0)}%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/40 mb-1">ESTIMATED VALUE</div>
                                            <div className="font-semibold text-white">${contributionResult.value.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/40 mb-1">DATASET SIZE</div>
                                            <div className="font-semibold text-white">{contributionResult.datasetSize.toLocaleString()} samples</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button onClick={() => router.push('/contributor/dashboard')} variant="primary">
                                View Dashboard
                            </Button>
                            <Button onClick={() => window.location.reload()} variant="secondary">
                                Contribute Another
                            </Button>
                            <Button onClick={() => router.push('/contributor/transparency')} variant="ghost">
                                View Transparency Log
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
