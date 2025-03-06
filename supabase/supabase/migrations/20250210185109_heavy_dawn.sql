/*
  # Add Sample Data with Updated Schema

  1. Schema Updates
    - Add image_url column to posts table
    - Add date column to posts table
  
  2. Data Changes
    - Add sample posts with images and dates
    - Update content to include HTML formatting
    
  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS date date;

-- Temporarily disable RLS for bulk insert
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Clear existing sample data
TRUNCATE TABLE posts;

-- Insert new sample data
INSERT INTO posts (title, content, category, date, image_url, created_at) VALUES
-- 리포트 (Report)
(
  '신약 개발 트렌드 2024',
  '<p>2024년 신약 개발의 주요 트렌드와 전망을 분석합니다. 인공지능 활용, 유전자 치료제 개발 동향 등을 포함합니다.</p>
   <img src="https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_07b03aba-42a0-4a8e-b93e-8c50b24642da.png?" alt="신약 개발 트렌드" style="width: 300px; display: block; margin: 1em auto;">
   <p>AI 기반 신약 개발 플랫폼의 발전과 함께, 맞춤형 치료제 개발이 가속화될 것으로 예상됩니다.</p>',
  'report',
  '2024-11-15',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_07b03aba-42a0-4a8e-b93e-8c50b24642da.png?',
  '2024-11-15'
),
(
  '국내 의료기기 시장 분석 보고서',
  '<p>국내 의료기기 시장의 규모, 성장률, 주요 기업 및 제품 동향을 분석한 보고서입니다.</p>',
  'report',
  '2024-11-16',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_0b6c986e-309a-4469-aa94-7814f4ed2ed5.png?',
  '2024-11-16'
),

-- 경제 동향 (Economic Trends)
(
  '금리 인상과 헬스케어 산업 영향',
  '<h1>금리 인상과 헬스케어 산업 영향</h1><p>최근 금리 인상이 헬스케어 산업 전반에 미치는 영향을 심층 분석합니다.</p>',
  'economic-trends',
  '2024-11-17',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_0ed0ef2d-5677-4851-9dbc-2765b62d41ec.png?',
  '2024-11-17'
),

-- 산업 동향 (Industry Trends)
(
  'AI 기반 진단 기술의 발전',
  '<h2>AI 기반 진단 기술의 발전</h2><p>인공지능(AI) 기반 진단 기술의 최신 발전 동향과 의료 현장 적용 사례를 소개합니다.</p>',
  'medical',
  '2024-11-19',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_0fd193c9-5ffb-4c72-b222-dbed30be9c11.png?',
  '2024-11-19'
),
(
  '원격 의료 서비스 확대 논의',
  '<p>국내 원격 의료 서비스 확대에 대한 정책 논의 현황과 관련 산업에 미치는 영향을 분석합니다.</p>',
  'medical',
  '2024-11-20',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_124f945e-343c-4e0d-b6d5-064ea5e97503.png?',
  '2024-11-20'
),

-- 제약 산업
(
  '혁신 신약 파이프라인 현황',
  '<p>국내 제약사의 혁신 신약 파이프라인 현황 및 개발 전략 분석.</p>',
  'pharmaceutical',
  '2024-11-21',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_4949e763-aaf6-47f4-b4ed-6381fcda914b.png?',
  '2024-11-21'
),
(
  '바이오시밀러 시장 경쟁 심화',
  '<p>바이오시밀러 시장의 경쟁 심화 및 가격 인하 추세 분석.</p>',
  'pharmaceutical',
  '2024-11-22',
  'https://wiziqvkwkwjpvretcisz.supabase.co/storage/v1/object/public/images/_5148189f-32c0-4085-bc05-162a941ffc49.png?',
  '2024-11-22'
);

-- Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;