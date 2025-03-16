-- Companies ve Contacts tablolarını oluşturma ve örnek veriler ekleme
-- Tarih: 15.03.2025

-- Companies tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_company_id uuid NULL,
    address TEXT NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    website VARCHAR(255) NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_company_id) REFERENCES companies(id)
);

-- Contacts tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    position VARCHAR(100) NULL,
    company_id uuid NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Önce ana firmaları ekle
INSERT INTO companies (id, name, parent_company_id, address, phone, email, website, is_deleted)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'ABC Holding', NULL, 'İstanbul, Türkiye', '0212-111-1111', 'info@abcholding.com', 'www.abcholding.com', false),
    ('22222222-2222-2222-2222-222222222222', 'XYZ Şirketi', NULL, 'Ankara, Türkiye', '0312-222-2222', 'info@xyz.com', 'www.xyz.com', false),
    ('33333333-3333-3333-3333-333333333333', 'Teknoloji A.Ş.', NULL, 'İzmir, Türkiye', '0232-333-3333', 'info@teknoloji.com', 'www.teknoloji.com', false),
    ('44444444-4444-4444-4444-444444444444', 'Yazılım Ltd. Şti.', NULL, 'Bursa, Türkiye', '0224-444-4444', 'info@yazilim.com', 'www.yazilim.com', false)
ON CONFLICT (id) DO NOTHING;

-- Alt firmaları ekle
INSERT INTO companies (id, name, parent_company_id, address, phone, email, website, is_deleted)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'ABC Teknoloji', '11111111-1111-1111-1111-111111111111', 'İstanbul, Türkiye', '0212-555-5555', 'info@abcteknoloji.com', 'www.abcteknoloji.com', false),
    ('66666666-6666-6666-6666-666666666666', 'ABC Yazılım', '11111111-1111-1111-1111-111111111111', 'İstanbul, Türkiye', '0212-666-6666', 'info@abcyazilim.com', 'www.abcyazilim.com', false),
    ('77777777-7777-7777-7777-777777777777', 'XYZ Teknoloji', '22222222-2222-2222-2222-222222222222', 'Ankara, Türkiye', '0312-777-7777', 'info@xyzteknoloji.com', 'www.xyzteknoloji.com', false),
    ('88888888-8888-8888-8888-888888888888', 'XYZ Yazılım', '22222222-2222-2222-2222-222222222222', 'Ankara, Türkiye', '0312-888-8888', 'info@xyzyazilim.com', 'www.xyzyazilim.com', false)
ON CONFLICT (id) DO NOTHING;

-- İletişim kişilerini ekle
INSERT INTO contacts (id, first_name, last_name, email, phone, position, company_id, is_deleted)
VALUES
    -- ABC Holding iletişim kişileri
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ahmet', 'Yılmaz', 'ahmet@abcholding.com', '0555-111-1111', 'CEO', '11111111-1111-1111-1111-111111111111', false),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ayşe', 'Demir', 'ayse@abcholding.com', '0555-111-2222', 'CFO', '11111111-1111-1111-1111-111111111111', false),
    
    -- XYZ Şirketi iletişim kişileri
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mehmet', 'Kaya', 'mehmet@xyz.com', '0555-222-1111', 'Genel Müdür', '22222222-2222-2222-2222-222222222222', false),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Zeynep', 'Şahin', 'zeynep@xyz.com', '0555-222-2222', 'Finans Müdürü', '22222222-2222-2222-2222-222222222222', false),
    
    -- Teknoloji A.Ş. iletişim kişileri
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Ali', 'Öztürk', 'ali@teknoloji.com', '0555-333-1111', 'CTO', '33333333-3333-3333-3333-333333333333', false),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Fatma', 'Aydın', 'fatma@teknoloji.com', '0555-333-2222', 'Proje Yöneticisi', '33333333-3333-3333-3333-333333333333', false),
    
    -- Yazılım Ltd. Şti. iletişim kişileri
    ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Mustafa', 'Yıldız', 'mustafa@yazilim.com', '0555-444-1111', 'Yazılım Geliştirici', '44444444-4444-4444-4444-444444444444', false),
    ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Selin', 'Korkmaz', 'selin@yazilim.com', '0555-444-2222', 'Tasarımcı', '44444444-4444-4444-4444-444444444444', false),
    
    -- ABC Teknoloji iletişim kişileri
    ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Emre', 'Çelik', 'emre@abcteknoloji.com', '0555-555-1111', 'Satış Müdürü', '55555555-5555-5555-5555-555555555555', false),
    ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Deniz', 'Arslan', 'deniz@abcteknoloji.com', '0555-555-2222', 'Müşteri Temsilcisi', '55555555-5555-5555-5555-555555555555', false),
    
    -- ABC Yazılım iletişim kişileri
    ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Burak', 'Yılmaz', 'burak@abcyazilim.com', '0555-666-1111', 'Yazılım Mühendisi', '66666666-6666-6666-6666-666666666666', false),
    ('llllllll-llll-llll-llll-llllllllllll', 'Ceren', 'Kara', 'ceren@abcyazilim.com', '0555-666-2222', 'Test Mühendisi', '66666666-6666-6666-6666-666666666666', false)
ON CONFLICT (id) DO NOTHING;
