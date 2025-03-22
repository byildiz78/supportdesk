
-- Migration: Add SLA fields to groups table
-- Date: 19.03.2025

-- Add SLA fields to groups table
ALTER TABLE groups
ADD COLUMN mesai_saatleri_sla INTEGER DEFAULT 60,
ADD COLUMN mesai_disi_sla INTEGER DEFAULT 120,
ADD COLUMN hafta_sonu_mesai_sla INTEGER DEFAULT 180,
ADD COLUMN hafta_sonu_mesai_disi_sla INTEGER DEFAULT 240;

-- Update existing groups with default SLA values
UPDATE groups
SET 
    mesai_saatleri_sla = 60,
    mesai_disi_sla = 120,
    hafta_sonu_mesai_sla = 180,
    hafta_sonu_mesai_disi_sla = 240
WHERE 
    mesai_saatleri_sla IS NULL OR
    mesai_disi_sla IS NULL OR
    hafta_sonu_mesai_sla IS NULL OR
    hafta_sonu_mesai_disi_sla IS NULL;

-- Add comment to the columns
COMMENT ON COLUMN groups.mesai_saatleri_sla IS 'Mesai saatleri içinde çözülmesi gereken süre (dakika)';
COMMENT ON COLUMN groups.mesai_disi_sla IS 'Mesai saatleri dışında çözülmesi gereken süre (dakika)';
COMMENT ON COLUMN groups.hafta_sonu_mesai_sla IS 'Hafta sonu mesai saatleri içinde çözülmesi gereken süre (dakika)';
COMMENT ON COLUMN groups.hafta_sonu_mesai_disi_sla IS 'Hafta sonu mesai saatleri dışında çözülmesi gereken süre (dakika)';