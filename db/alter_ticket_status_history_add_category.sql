-- ticket_status_history tablosuna kategori değişikliği alanlarını ekle
ALTER TABLE ticket_status_history 
ADD COLUMN is_category_change BOOLEAN DEFAULT FALSE,
ADD COLUMN previous_category_id UUID,
ADD COLUMN new_category_id UUID,
ADD COLUMN previous_subcategory_id UUID,
ADD COLUMN new_subcategory_id UUID,
ADD COLUMN previous_group_id UUID,
ADD COLUMN new_group_id UUID;

-- Açıklama ekle
COMMENT ON COLUMN ticket_status_history.is_category_change IS 'Kategori, alt kategori veya grup değişikliği kaydı mı';
COMMENT ON COLUMN ticket_status_history.previous_category_id IS 'Önceki kategori ID';
COMMENT ON COLUMN ticket_status_history.new_category_id IS 'Yeni kategori ID';
COMMENT ON COLUMN ticket_status_history.previous_subcategory_id IS 'Önceki alt kategori ID';
COMMENT ON COLUMN ticket_status_history.new_subcategory_id IS 'Yeni alt kategori ID';
COMMENT ON COLUMN ticket_status_history.previous_group_id IS 'Önceki grup ID';
COMMENT ON COLUMN ticket_status_history.new_group_id IS 'Yeni grup ID';
