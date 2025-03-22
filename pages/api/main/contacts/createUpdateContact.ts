import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { extractTenantFromBody } from '@/lib/utils';

interface DbResult {
  id: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, ...contactData } = req.body;

    // Önce e-posta veya mobil numaranın var olup olmadığını kontrol et
    if (contactData.email || contactData.mobile) {
      // Sorgu parametrelerini hazırla
      const params = [];
      let paramIndex = 1;
      
      // Dinamik sorgu oluştur
      let emailCondition = "FALSE";
      let mobileCondition = "FALSE";
      
      if (contactData.email) {
        params.push(contactData.email);
        emailCondition = `email = $${paramIndex}`;
        paramIndex++;
      }
      
      if (contactData.mobile) {
        params.push(contactData.mobile);
        mobileCondition = `mobile = $${paramIndex}`;
        paramIndex++;
      }
      
      // ID parametresini ekle
      params.push(id || null);
      
      const checkQuery = `
        SELECT id, first_name, last_name, email, mobile 
        FROM contacts 
        WHERE (
          ${emailCondition} 
          OR 
          ${mobileCondition}
        )
        AND (id != $${paramIndex} OR $${paramIndex} IS NULL)
        AND (is_deleted = false OR is_deleted IS NULL)
      `;

      const existingContacts = await db.executeQuery<DbResult[]>({
        query: checkQuery,
        params,
        req
      });

      if (existingContacts && existingContacts.length > 0) {
        // Var olan kişi bilgilerini hazırla
        const existingContact = existingContacts[0];
        const fullName = `${existingContact.first_name || ''} ${existingContact.last_name || ''}`.trim();
        
        // Hangi alanın çakıştığını belirle
        let conflictField = '';
        if (contactData.email && existingContact.email === contactData.email) {
          conflictField = 'e-posta adresi';
        }
        if (contactData.mobile && existingContact.mobile === contactData.mobile) {
          conflictField = conflictField ? 'e-posta adresi ve telefon numarası' : 'telefon numarası';
        }

        return res.status(409).json({ 
          success: false, 
          message: `Bu ${conflictField} ile kayıtlı bir kişi zaten mevcut: ${fullName}`,
          existingContact: {
            id: existingContact.id,
            name: fullName,
            email: existingContact.email,
            mobile: existingContact.mobile
          }
        });
      }
    }

    // If id exists, update, otherwise create new
    if (id) {
      // Update operation
      const updateQuery = `
        UPDATE contacts
        SET 
          company_id = $1,
          first_name = $2,
          last_name = $3,
          position = $4,
          email = $5,
          phone = $6,
          mobile = $7,
          address = $8,
          city = $9,
          state = $10,
          postal_code = $11,
          country = $12,
          notes = $13,
          is_primary = $14,
          is_active = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: updateQuery,
        params: [
          contactData.companyId || null,
          contactData.firstName,
          contactData.lastName,
          contactData.position || null,
          contactData.email || null,
          contactData.phone || null,
          contactData.mobile || null,
          contactData.address || null,
          contactData.city || null,
          contactData.state || null,
          contactData.postalCode || null,
          contactData.country || null,
          contactData.notes || null,
          contactData.isPrimary !== undefined ? contactData.isPrimary : false,
          contactData.isActive !== undefined ? contactData.isActive : true,
          id
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }

      return res.status(200).json({ success: true, message: 'Contact updated successfully', id });
    } else {
      // Create operation
      const insertQuery = `
        INSERT INTO contacts (
          company_id,
          first_name,
          last_name,
          position,
          email,
          phone,
          mobile,
          address,
          city,
          state,
          postal_code,
          country,
          notes,
          is_primary,
          is_active,
          created_at,
          updated_at,
          is_deleted
        ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false
        )
        RETURNING id;
      `;

      const result = await db.executeQuery<DbResult[]>({
        query: insertQuery,
        params: [
          contactData.companyId || null,
          contactData.firstName,
          contactData.lastName,
          contactData.position || null,
          contactData.email || null,
          contactData.phone || null,
          contactData.mobile || null,
          contactData.address || null,
          contactData.city || null,
          contactData.state || null,
          contactData.postalCode || null,
          contactData.country || null,
          contactData.notes || null,
          contactData.isPrimary !== undefined ? contactData.isPrimary : false,
          contactData.isActive !== undefined ? contactData.isActive : true
        ],
        req
      });

      if (!result || result.length === 0) {
        return res.status(500).json({ success: false, message: 'Error creating contact' });
      }

      const newId = result[0].id;
      return res.status(201).json({ success: true, message: 'Contact created successfully', id: newId });
    }
  } catch (error: any) {
    console.error('Create/Update contact API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: error.message 
    });
  }
}
