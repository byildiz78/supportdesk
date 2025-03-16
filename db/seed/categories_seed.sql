-- Kategori, Alt Kategori ve Grup verileri için seed dosyası
-- Tarih: 15.03.2025

-- Kategoriler
INSERT INTO categories (name, description, created_by)
VALUES 
  ('Teknik Destek', 'Teknik sorunlar ve destek talepleri', 'system'),
  ('Müşteri Hizmetleri', 'Müşteri soruları ve talepleri', 'system'),
  ('Satış', 'Satış ile ilgili talepler', 'system'),
  ('Finans', 'Fatura ve ödeme ile ilgili talepler', 'system');

-- Alt Kategoriler
INSERT INTO subcategories (category_id, name, description, created_by)
VALUES 
  -- Teknik Destek alt kategorileri
  ((SELECT id FROM categories WHERE name = 'Teknik Destek' AND is_deleted = false), 'Donanım', 'Donanım ile ilgili sorunlar', 'system'),
  ((SELECT id FROM categories WHERE name = 'Teknik Destek' AND is_deleted = false), 'Yazılım', 'Yazılım ile ilgili sorunlar', 'system'),
  ((SELECT id FROM categories WHERE name = 'Teknik Destek' AND is_deleted = false), 'Ağ', 'Ağ ve bağlantı sorunları', 'system'),
  
  -- Müşteri Hizmetleri alt kategorileri
  ((SELECT id FROM categories WHERE name = 'Müşteri Hizmetleri' AND is_deleted = false), 'Ürün Bilgisi', 'Ürünler hakkında bilgi talepleri', 'system'),
  ((SELECT id FROM categories WHERE name = 'Müşteri Hizmetleri' AND is_deleted = false), 'Şikayet', 'Müşteri şikayetleri', 'system'),
  
  -- Satış alt kategorileri
  ((SELECT id FROM categories WHERE name = 'Satış' AND is_deleted = false), 'Yeni Sipariş', 'Yeni sipariş talepleri', 'system'),
  ((SELECT id FROM categories WHERE name = 'Satış' AND is_deleted = false), 'Fiyat Teklifi', 'Fiyat teklifi talepleri', 'system'),
  
  -- Finans alt kategorileri
  ((SELECT id FROM categories WHERE name = 'Finans' AND is_deleted = false), 'Fatura', 'Fatura ile ilgili talepler', 'system'),
  ((SELECT id FROM categories WHERE name = 'Finans' AND is_deleted = false), 'Ödeme', 'Ödeme ile ilgili talepler', 'system');

-- Gruplar
INSERT INTO groups (subcategory_id, name, description, created_by)
VALUES 
  -- Donanım grupları
  ((SELECT id FROM subcategories WHERE name = 'Donanım' AND is_deleted = false), 'Bilgisayar', 'Bilgisayar donanım sorunları', 'system'),
  ((SELECT id FROM subcategories WHERE name = 'Donanım' AND is_deleted = false), 'Yazıcı', 'Yazıcı sorunları', 'system'),
  
  -- Yazılım grupları
  ((SELECT id FROM subcategories WHERE name = 'Yazılım' AND is_deleted = false), 'İşletim Sistemi', 'İşletim sistemi sorunları', 'system'),
  ((SELECT id FROM subcategories WHERE name = 'Yazılım' AND is_deleted = false), 'Uygulama', 'Uygulama sorunları', 'system'),
  
  -- Ağ grupları
  ((SELECT id FROM subcategories WHERE name = 'Ağ' AND is_deleted = false), 'İnternet', 'İnternet bağlantı sorunları', 'system'),
  ((SELECT id FROM subcategories WHERE name = 'Ağ' AND is_deleted = false), 'Yerel Ağ', 'Yerel ağ sorunları', 'system'),
  
  -- Ürün Bilgisi grupları
  ((SELECT id FROM subcategories WHERE name = 'Ürün Bilgisi' AND is_deleted = false), 'Teknik Özellikler', 'Ürün teknik özellikleri', 'system'),
  ((SELECT id FROM subcategories WHERE name = 'Ürün Bilgisi' AND is_deleted = false), 'Kullanım', 'Ürün kullanımı', 'system'),
  
  -- Şikayet grupları
  ((SELECT id FROM subcategories WHERE name = 'Şikayet' AND is_deleted = false), 'Ürün Kalitesi', 'Ürün kalitesi şikayetleri', 'system'),
  ((SELECT id FROM subcategories WHERE name = 'Şikayet' AND is_deleted = false), 'Teslimat', 'Teslimat şikayetleri', 'system');
