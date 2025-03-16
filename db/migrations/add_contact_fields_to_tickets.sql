-- Tickets tablosuna contact alanlarını eklemek için SQL komutları
-- Tarih: 15.03.2025

-- contact_name alanını ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_name') THEN
        ALTER TABLE tickets ADD COLUMN contact_name character varying(255) NULL;
    END IF;
END $$;

-- contact_first_name alanını ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_first_name') THEN
        ALTER TABLE tickets ADD COLUMN contact_first_name character varying(255) NULL;
    END IF;
END $$;

-- contact_last_name alanını ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_last_name') THEN
        ALTER TABLE tickets ADD COLUMN contact_last_name character varying(255) NULL;
    END IF;
END $$;

-- contact_email alanını ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_email') THEN
        ALTER TABLE tickets ADD COLUMN contact_email character varying(255) NULL;
    END IF;
END $$;

-- contact_phone alanını ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'contact_phone') THEN
        ALTER TABLE tickets ADD COLUMN contact_phone character varying(255) NULL;
    END IF;
END $$;

-- Bu migration'ı kaydet
INSERT INTO migrations (name) VALUES ('add_contact_fields_to_tickets');
