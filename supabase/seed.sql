-- Enhanced Seed file for DataUnion platform with Composition Analytics Demo Data
-- Run this in Supabase SQL Editor after schema.sql

-- Clear existing data (optional, for clean slate)
TRUNCATE TABLE payout_records, licenses, data_contributions, datasets, contributors, companies CASCADE;

-- 1. Create demo contributors
INSERT INTO contributors (name, total_earnings, created_at) VALUES
('Alice Johnson', 0, NOW() - INTERVAL '30 days'),
('Bob Smith', 0, NOW() - INTERVAL '25 days'),
('Carol Davis', 0, NOW() - INTERVAL '20 days'),
('David Wilson', 0, NOW() - INTERVAL '15 days'),
('Emma Brown', 0, NOW() - INTERVAL '10 days'),
('Frank Miller', 0, NOW() - INTERVAL '8 days'),
('Grace Lee', 0, NOW() - INTERVAL '5 days');

-- 2. Create platform-managed datasets
INSERT INTO datasets (name, description, domain, data_type, total_contributions, contributor_count, quality_score, price_per_license, times_licensed, created_at) VALUES
(
  'Urban Mobility Dataset',
  'Real-time GPS and transportation data from city commuters',
  'Transportation',
  'sensor',
  0,
  0,
  92.5,
  5000,
  0,
  NOW() - INTERVAL '30 days'
),
(
  'Social Sentiment Dataset',
  'Anonymized social media posts and sentiment analysis',
  'Social Media',
  'text',
  0,
  0,
  88.3,
  3500,
  0,
  NOW() - INTERVAL '28 days'
),
(
  'Medical Imaging Dataset',
  'Anonymized medical scans for AI training',
  'Healthcare',
  'image',
  0,
  0,
  95.7,
  12000,
  0,
  NOW() - INTERVAL '25 days'
),
(
  'IoT Smart Home Dataset',
  'Energy usage and environmental sensor readings',
  'IoT',
  'sensor',
  0,
  0,
  90.1,
  4500,
  2,
  NOW() - INTERVAL '20 days'
);

-- 3. Add diverse data contributions with varied domains for beautiful composition analytics
DO $$
DECLARE
  contributor_ids UUID[];
  urban_mobility_id UUID;
  social_sentiment_id UUID;
  medical_imaging_id UUID;
  iot_smart_home_id UUID;
BEGIN
  -- Get contributor IDs
  SELECT ARRAY_AGG(contributor_id) INTO contributor_ids FROM contributors;
  
  -- Get dataset IDs
  SELECT dataset_id INTO urban_mobility_id FROM datasets WHERE name = 'Urban Mobility Dataset';
  SELECT dataset_id INTO social_sentiment_id FROM datasets WHERE name = 'Social Sentiment Dataset';
  SELECT dataset_id INTO medical_imaging_id FROM datasets WHERE name = 'Medical Imaging Dataset';
  SELECT dataset_id INTO iot_smart_home_id FROM datasets WHERE name = 'IoT Smart Home Dataset';

  -- ============================================================
  -- SOCIAL SENTIMENT DATASET - Diverse categories for beautiful composition
  -- ============================================================
  
  -- Category 1: Product Reviews (40% volume, high quality 90-95%)
  FOR i IN 1..12 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (social_sentiment_id, contributor_ids[(i % 5) + 1], 'text', 
     'Product Review: ' || REPEAT('This product exceeded my expectations with excellent build quality and features. ', 20) || ' Sample ' || i, 
     90 + (i % 6), 2.80, NOW() - INTERVAL '22 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 2: News Commentary (30% volume, medium quality 75-85%)
  FOR i IN 1..10 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (social_sentiment_id, contributor_ids[(i % 5) + 1], 'text',
     'News Commentary: ' || REPEAT('Breaking news about economic developments and policy changes affecting markets. ', 15) || ' Sample ' || i,
     75 + (i % 11), 2.40, NOW() - INTERVAL '20 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 3: Customer Support (20% volume, good quality 80-88%)
  FOR i IN 1..8 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (social_sentiment_id, contributor_ids[(i % 5) + 1], 'text',
     'Customer Support: ' || REPEAT('Thank you for contacting us. We have resolved your issue promptly. ', 12) || ' Sample ' || i,
     80 + (i % 9), 2.50, NOW() - INTERVAL '18 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 4: Spam/Low Quality (10% volume, low quality 20-40%)
  FOR i IN 1..4 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (social_sentiment_id, contributor_ids[(i % 3) + 1], 'text',
     'Spam: ' || REPEAT('Click here now!!! ', 5) || ' Sample ' || i,
     20 + (i * 5), 0.50, NOW() - INTERVAL '15 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- ============================================================
  -- IOT SMART HOME DATASET - Multiple sensor categories
  -- ============================================================
  
  -- Category 1: Temperature Sensors (50% volume, excellent quality 92-98%)
  FOR i IN 1..15 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (iot_smart_home_id, contributor_ids[(i % 5) + 1], 'sensor',
     '{"sensor_type":"temperature","location":"living_room","value":' || (22 + i) || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T10:00:00Z","accuracy":0.1,"battery":' || (85 + i) || '}',
     92 + (i % 7), 2.00, NOW() - INTERVAL '19 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 2: Energy Monitors (30% volume, high quality 88-94%)
  FOR i IN 1..10 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (iot_smart_home_id, contributor_ids[(i % 5) + 1], 'sensor',
     '{"sensor_type":"energy","device":"hvac","consumption":' || (2.0 + i * 0.3) || ',"cost":' || (0.15 * i) || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T10:00:00Z"}',
     88 + (i % 7), 1.90, NOW() - INTERVAL '17 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 3: Motion Sensors (15% volume, good quality 80-87%)
  FOR i IN 1..5 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (iot_smart_home_id, contributor_ids[(i % 4) + 1], 'sensor',
     '{"sensor_type":"motion","location":"hallway","detected":' || (i % 2 = 0)::text || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T10:00:00Z"}',
     80 + (i % 8), 1.70, NOW() - INTERVAL '15 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 4: Faulty Sensors (5% volume, poor quality 30-45%)
  FOR i IN 1..2 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (iot_smart_home_id, contributor_ids[1], 'sensor',
     '{"sensor_type":"unknown","error":"timeout","value":null}',
     30 + (i * 7), 0.30, NOW() - INTERVAL '13 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- ============================================================
  -- MEDICAL IMAGING DATASET - Different scan types
  -- ============================================================
  
  -- Category 1: X-Ray Scans (45% volume, excellent quality 94-98%)
  FOR i IN 1..12 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (medical_imaging_id, contributor_ids[(i % 4) + 1], 'image',
     'data:image/xray;base64,' || REPEAT('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 50) || i::text,
     94 + (i % 5), 9.50, NOW() - INTERVAL '24 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 2: MRI Scans (35% volume, excellent quality 95-99%)
  FOR i IN 1..10 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (medical_imaging_id, contributor_ids[(i % 3) + 2], 'image',
     'data:image/mri;base64,' || REPEAT('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 60) || i::text,
     95 + (i % 5), 10.00, NOW() - INTERVAL '22 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 3: CT Scans (20% volume, high quality 92-96%)
  FOR i IN 1..6 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (medical_imaging_id, contributor_ids[(i % 3) + 3], 'image',
     'data:image/ct;base64,' || REPEAT('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=', 45) || i::text,
     92 + (i % 5), 9.20, NOW() - INTERVAL '20 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- ============================================================
  -- URBAN MOBILITY DATASET - Different transportation modes
  -- ============================================================
  
  -- Category 1: Public Transit (50% volume, high quality 88-94%)
  FOR i IN 1..18 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (urban_mobility_id, contributor_ids[(i % 5) + 1], 'sensor',
     '{"mode":"bus","route":"' || (100 + i) || '","latitude":12.' || (9700 + i * 10) || ',"longitude":77.' || (5900 + i * 5) || ',"speed":' || (25 + i * 2) || ',"passengers":' || (15 + i) || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T08:30:00Z"}',
     88 + (i % 7), 3.40, NOW() - INTERVAL '25 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 2: Private Vehicles (30% volume, good quality 85-91%)
  FOR i IN 1..12 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (urban_mobility_id, contributor_ids[(i % 4) + 1], 'sensor',
     '{"mode":"car","latitude":12.' || (9600 + i * 15) || ',"longitude":77.' || (5800 + i * 8) || ',"speed":' || (40 + i * 3) || ',"fuel_efficiency":' || (12 + i * 0.5) || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T09:00:00Z"}',
     85 + (i % 7), 3.20, NOW() - INTERVAL '23 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 3: Bicycles/Pedestrians (15% volume, medium quality 75-83%)
  FOR i IN 1..6 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (urban_mobility_id, contributor_ids[(i % 3) + 1], 'sensor',
     '{"mode":"bicycle","latitude":12.' || (9650 + i * 12) || ',"longitude":77.' || (5850 + i * 6) || ',"speed":' || (12 + i) || ',"timestamp":"2024-01-' || LPAD(i::text, 2, '0') || 'T07:00:00Z"}',
     75 + (i % 9), 2.80, NOW() - INTERVAL '20 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Category 4: GPS Errors (5% volume, poor quality 25-40%)
  FOR i IN 1..2 LOOP
    INSERT INTO data_contributions (dataset_id, contributor_id, data_type, sample_data, quality_score, contribution_value, created_at) VALUES
    (urban_mobility_id, contributor_ids[1], 'sensor',
     '{"mode":"unknown","latitude":0.0,"longitude":0.0,"speed":-1,"error":"gps_signal_lost"}',
     25 + (i * 7), 0.50, NOW() - INTERVAL '18 days' + (i || ' days')::INTERVAL);
  END LOOP;

  -- Update dataset stats
  UPDATE datasets SET 
    total_contributions = (SELECT COUNT(*) FROM data_contributions WHERE dataset_id = datasets.dataset_id),
    contributor_count = (SELECT COUNT(DISTINCT contributor_id) FROM data_contributions WHERE dataset_id = datasets.dataset_id);
    
END $$;

-- 4. Add demo companies
INSERT INTO companies (name, industry, total_spend, created_at) VALUES
('TechCorp AI', 'Artificial Intelligence', 0, NOW() - INTERVAL '15 days'),
('DataScience Inc', 'Data Analytics', 0, NOW() - INTERVAL '12 days'),
('SmartCity Solutions', 'Urban Planning', 0, NOW() - INTERVAL '8 days');
