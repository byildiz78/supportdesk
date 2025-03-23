-- ticket_status_history tablosundaki ticket_id alanını UUID tipine dönüştür
ALTER TABLE ticket_status_history 
ALTER COLUMN ticket_id TYPE uuid USING ticket_id::uuid;

-- Aynı zamanda changed_by alanını da UUID tipine dönüştürelim (users tablosu ile uyumlu olması için)
ALTER TABLE ticket_status_history 
ALTER COLUMN changed_by TYPE uuid USING changed_by::uuid;
