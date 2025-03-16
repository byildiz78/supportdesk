-- Tickets tablosunu güncellemek için SQL komutları
-- Tarih: 15.03.2025

-- Önce mevcut tabloyu kontrol edelim ve eksik alanları ekleyelim

-- parent_company_id alanını ekle (API'de kullanılıyor ancak veritabanında yok)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'parent_company_id') THEN
        ALTER TABLE tickets ADD COLUMN parent_company_id uuid NULL;
    END IF;
END $$;

-- contact_id alanını ekle (API'de kullanılıyor ancak veritabanında yok)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_id') THEN
        ALTER TABLE tickets ADD COLUMN contact_id uuid NULL;
    END IF;
END $$;

-- sla_breach alanını ekle (API'de kullanılıyor ancak veritabanında yok)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'sla_breach') THEN
        ALTER TABLE tickets ADD COLUMN sla_breach boolean NULL DEFAULT false;
    END IF;
END $$;

-- company_id alanının tipini değiştir (veritabanında character varying(255), API'de uuid olarak kullanılıyor)
-- Dikkat: Bu işlem veri kaybına neden olabilir, önce yedekleme yapılmalıdır
-- DO $$ 
-- BEGIN
--     ALTER TABLE tickets ALTER COLUMN company_id TYPE uuid USING company_id::uuid;
-- END $$;

-- Alternatif olarak, API'yi veritabanı şemasına uygun hale getirmek için aşağıdaki değişiklikler yapılabilir:
-- 1. createUpdateTicket.ts dosyasında company_id parametresini character varying olarak kabul et
-- 2. Diğer ID alanlarını da uygun şekilde güncelle

-- Yeni bir migration tablosu oluştur ve bu değişiklikleri kaydet
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bu migration'ı kaydet
INSERT INTO migrations (name) VALUES ('update_tickets_table_15032025');
