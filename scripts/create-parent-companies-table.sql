-- parent_companies tablosunu oluştur
CREATE TABLE IF NOT EXISTS parent_companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50),
  tax_office VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  industry VARCHAR(100),
  company_type VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Benzersiz isim kısıtlaması ekle
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_companies_name ON parent_companies (name) WHERE is_deleted = FALSE;

-- Örnek veri ekle
INSERT INTO parent_companies (
  id, name, tax_id, tax_office, address, city, country, phone, email, 
  is_active, created_by, updated_by
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000', 
  'Örnek Ana Şirket', 
  '1234567890', 
  'Ankara', 
  'Örnek Adres 123', 
  'Ankara', 
  'Türkiye', 
  '+90 312 123 4567', 
  'info@orneksirket.com', 
  TRUE, 
  'system', 
  'system'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO parent_companies (
  id, name, tax_id, tax_office, address, city, country, phone, email, 
  is_active, created_by, updated_by
) VALUES (
  '223e4567-e89b-12d3-a456-426614174001', 
  'Test Holding', 
  '9876543210', 
  'İstanbul', 
  'Test Adres 456', 
  'İstanbul', 
  'Türkiye', 
  '+90 212 987 6543', 
  'info@testholding.com', 
  TRUE, 
  'system', 
  'system'
) ON CONFLICT (name) DO NOTHING;
