-- finance_info 테이블 생성
CREATE TABLE finance_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('index', 'exchange_rate', 'interest_rate')),
    name TEXT NOT NULL,
    value REAL NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- finance_info 테이블에 트리거 적용
CREATE TRIGGER update_finance_info_updated_at
BEFORE UPDATE ON finance_info
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 기본 데이터 삽입 (오늘 날짜 기준)
INSERT INTO finance_info (type, name, value, date) VALUES
('index', 'KOSPI', 2567.45, CURRENT_DATE),
('index', 'KOSDAQ', 892.31, CURRENT_DATE),
('index', 'NASDAQ', 14972, CURRENT_DATE),
('index', 'S&P500', 4783, CURRENT_DATE),
('index', 'Dow Jones', 37562, CURRENT_DATE),
('exchange_rate', 'USD', 1319.89, CURRENT_DATE),
('exchange_rate', 'EUR', 1441.26, CURRENT_DATE),
('exchange_rate', 'JPY', 931.94, CURRENT_DATE),
('exchange_rate', 'CNY', 185.65, CURRENT_DATE),
('exchange_rate', 'GBP', 1678.78, CURRENT_DATE),
('interest_rate', 'USA', 5.59, CURRENT_DATE),
('interest_rate', 'Euro', 4.03, CURRENT_DATE),
('interest_rate', 'Japan', -0.03, CURRENT_DATE),
('interest_rate', 'China', 3.47, CURRENT_DATE),
('interest_rate', 'Korea', 2.98, CURRENT_DATE);
