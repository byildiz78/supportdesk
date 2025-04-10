import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import nodemailer from 'nodemailer';
import { sendEventToClients } from '@/pages/api/events';
import path from 'path';
import fs from 'fs';
import { createEmailWithHistory, createHtmlContent } from '@/utils/email-utils';

interface QueryResult {
  rows: any[];
  rowCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      ticketId,
      content,
      htmlContent,
      subject,
      to,
      cc,
      replyToEmailId,
      threadId,
      isInternal,
      userId,
      userName,
      attachments,
      commentId
    } = req.body;

    // Gönderen robotpos ise işlemi engelle
    if (userName === 'robotpos' || userName === 'Robotpos' || 
        req.body.sender === 'robotpos' || req.body.sender === 'Robotpos' ||
        req.body.sender_email === 'robotpos@gmail.com' || 
        req.body.senderEmail === 'robotpos@gmail.com') {
      return res.status(400).json({
        success: false,
        message: 'Robotpos kullanıcısı ile yorum eklenemez veya e-posta gönderilemez',
      });
    }

    // E-posta gönderme işlemi için gerekli bilgileri kontrol et
    if (!ticketId || !content || !to || !to.length) {
      return res.status(400).json({
        success: false,
        message: 'Eksik parametreler: ticketId, content ve to gereklidir',
      });
    }

    if(!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD){
      return res.status(400).json({
        success: false,
        message: 'E-posta ayarları eksik'
      });
    }

    // Nodemailer transporter oluştur
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.mailgun.org',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true' || false, // TLS için false
        auth: {
          user: process.env.MAIL_USER || 'crm@destek.robotpos.com',
          pass: process.env.MAIL_PASSWORD,
        },
        from: {
          name: process.env.MAIL_FROM_NAME || 'Robotpos Destek Ekibi',
          address: process.env.MAIL_FROM_ADDRESS || 'destek@robotpos.com'
        },
        debug: true,
        logger: true,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Transporter'ın bağlantısını test et
      try {
        const verifyResult = await transporter.verify();
      } catch (verifyError) {
        return res.status(500).json({
          success: false,
          message: 'E-posta sunucusuna bağlantı kurulamadı: ' + (verifyError as Error).message,
        });
      }

      // Ticket numarasını kontrol et ve ekle
      let emailSubject = subject || 'Re: Destek Talebiniz Hakkında';
      
      // Ticket numarasını almak için sorgu
      const ticketQuery = `
        SELECT ticketno 
        FROM tickets 
        WHERE id = $1
      `;
      
      try {
        const ticketResult = await db.executeQuery({
          query: ticketQuery,
          params: [ticketId],
          req
        }) as QueryResult;
        
        if (ticketResult.rows.length > 0) {
          const ticketNo = ticketResult.rows[0].ticketno;
          
          // Ticket numarası varsa ve subject içinde yoksa ekle
          if (ticketNo && !emailSubject.includes(`#${ticketNo}#`)) {
            emailSubject = `${emailSubject} #${ticketNo}#`;
          }
        }
      } catch (error) {
        console.error('Ticket numarası alınırken hata:', error);
        // Hata durumunda işleme devam et, ticket numarası eklenmeden
      }

      // E-posta gönderim ayarları
      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'Robotpos Destek Ekibi',
          address: process.env.MAIL_FROM_ADDRESS || 'destek@robotpos.com'
        },
        to: to.join(', '),
        cc: cc && cc.length > 0 ? cc.filter((email: string) => {
          const normalizedEmail = email.toLowerCase();
          return !normalizedEmail.includes('destek@robotpos.com') && 
                 !normalizedEmail.includes('robotpos destek ekibi');
        }).join(', ') : undefined,
        subject: emailSubject,
        text: content, // Burada düz metin içeriği
        html: createHtmlContent(htmlContent || content),
        headers: {
          'In-Reply-To': replyToEmailId ? replyToEmailId : undefined,
          'References': threadId || undefined,
        },
        // Eklentileri ekleyelim
        attachments: attachments && attachments.length > 0 ? attachments.map((attachment: any) => {
          // Çevre değişkeninden dosya yolunu al veya varsayılan olarak process.cwd() kullan
          const uploadDir = process.env.FILE_UPLOAD_DIR || process.cwd();
          let filePath = path.join(uploadDir, `/${attachment.name}`);
          
          // Eğer dosya mevcut projenin kök dizininde değilse, 
          // üretim ortamında olabilecek diğer yolları dene
          if (!fs.existsSync(filePath)) {
            // Üretim ortamı için alternatif yol (Vercel, Docker, vb.)
            const productionPath1 = `/var/www/new-supportdesk/uploads/supportdesk/${attachment.name}`;
            const productionPath2 = `/var/www/supportdesk/uploads/supportdesk/${attachment.name}`;
            const productionPath3 = path.join(process.cwd(), '..', 'uploads', 'supportdesk', attachment.name);
            
            console.log(`İlk yol bulunamadı: ${filePath}, alternatif yollar deneniyor...`);
            
            if (fs.existsSync(productionPath1)) {
              filePath = productionPath1;
              console.log(`Dosya alternatif yolda bulundu: ${filePath}`);
            } else if (fs.existsSync(productionPath2)) {
              filePath = productionPath2;
              console.log(`Dosya alternatif yolda bulundu: ${filePath}`);
            } else if (fs.existsSync(productionPath3)) {
              filePath = productionPath3;
              console.log(`Dosya alternatif yolda bulundu: ${filePath}`);
            } else {
              console.error(`Dosya hiçbir yolda bulunamadı: ${attachment.name}`);
              console.log(`Denenen yollar:`, {
                dev: filePath,
                prod1: productionPath1,
                prod2: productionPath2,
                prod3: productionPath3
              });
            }
          }
          
          return {
            filename: attachment.originalFilename || attachment.name,
            path: filePath,
            contentType: attachment.mimeType
          };
        }) : []
      };

      // E-postayı gönder
      if (!isInternal) {
        try {
          // Zaman aşımı için Promise ile sarmalama
          const sendMailPromise = new Promise<any>((resolve, reject) => {
            // Zaman aşımı için 30 saniye
            const timeout = setTimeout(() => {
              reject(new Error('E-posta gönderme işlemi zaman aşımına uğradı (30 saniye)'));
            }, 30000);
            
            transporter.sendMail(mailOptions)
              .then(info => {
                clearTimeout(timeout);
                resolve(info);
              })
              .catch(err => {
                clearTimeout(timeout);
                reject(err);
              });
          });
          
        } catch (error) {
          console.error('E-posta gönderme hatası:', error);
          return res.status(500).json({
            success: false,
            message: 'E-posta gönderme hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
          });
        }
      }
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // E-posta gönderme hatası olsa bile devam et, yorumu kaydet
    }
    // Yanıtı veritabanına kaydet
    // ID değerini doğrudan döndürmek için RETURNING * kullanılıyor
    const insertCommentQuery = `
      INSERT INTO ticket_comments (
        ticket_id,
        content,
        is_internal,
        created_at,
        created_by,
        updated_at,
        is_deleted,
        email_id,
        thread_id,
        sender,
        sender_email,
        to_recipients,
        cc_recipients,
        html_content,
        attachments
      )
      VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, false,
        $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING id, created_at as "createdAt";
    `;

    // Kullanıcı bilgilerini al
    const userQuery = `
      SELECT name, email FROM users WHERE id = $1
    `;
    try {
      const userResult = await db.executeQueryResult<QueryResult>({
        query: userQuery,
        params: [userId],
        req
      });
      console.log('Kullanıcı bilgileri alındı:', userResult.rows && userResult.rows.length > 0 ? userResult.rows[0] : 'Kullanıcı bulunamadı');
      
      // Kullanıcı bulunamadıysa varsayılan değerleri kullan
      const user = (userResult.rows && userResult.rows.length > 0) 
        ? userResult.rows[0] 
        : { name: 'Sistem', email: process.env.MAIL_FROM_ADDRESS };

      // CC alıcılarını filtrele
      const filteredCc = cc && cc.length > 0 ? cc.filter((email: string) => {
        const normalizedEmail = email.toLowerCase();
        return !normalizedEmail.includes('destek@robotpos.com') && 
               !normalizedEmail.includes('robotpos destek ekibi');
      }) : [];

      // Yorumu veritabanına ekle
      console.log('Yorum veritabanına ekleniyor...');
      const commentResult = await db.executeQueryResult<QueryResult>({
        query: insertCommentQuery,
        params: [
          ticketId,
          subject || 'E-posta Yanıtı',
          isInternal || false,
          userId,
          isInternal ? null : (replyToEmailId || `reply-${Date.now()}@supportdesk.com`),
          threadId,
          userName || user.name,
          user.email,
          to,
          filteredCc,
          htmlContent || `<p>${content}</p>`,
          req.body.attachments ? JSON.stringify(req.body.attachments) : null
        ],
        req
      });
      
      console.log('SQL sorgusu sonucu:', {
        rowCount: commentResult.rowCount,
        rows: commentResult.rows
      });
      
      // Yorumun başarıyla eklendiğinden emin olalım
      if ((!commentResult.rows || commentResult.rows.length === 0) && commentResult.rowCount === 0) {
        throw new Error('Yorum veritabanına eklenemedi');
      }
      
      // Eklenen yorumun ID'si ve oluşturulma tarihi
      const commentId = commentResult.rows[0].id;
      const commentCreatedAt = commentResult.rows[0].createdAt;
      
      // Ticket'ın updated_at alanını güncelle
      console.log('Ticket güncelleniyor...');
      await db.executeQuery({
        query: 'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        params: [ticketId],
        req
      });
      console.log('Ticket güncellendi');

      // SSE kullanarak yeni yorum bildirimini gönder
      try {
        console.log('SSE bildirimi gönderiliyor...');
        sendEventToClients('ticket-comment', {
          action: 'create',
          ticketId,
          commentId: commentId || 'unknown',
        });
        console.log('SSE bildirimi gönderildi');
      } catch (sseError) {
        console.error('SSE yorum ekleme olayı gönderme hatası:', sseError);
      }

      // Yorum detaylarını almak için sorgu
      const getCommentQuery = `
        SELECT 
          id, 
          ticket_id as "ticketId", 
          content, 
          is_internal as "isInternal", 
          created_at as "createdAt", 
          created_by as "createdBy", 
          updated_at as "updatedAt",
          is_deleted as "isDeleted",
          email_id as "emailId",
          thread_id as "threadId",
          sender, 
          sender_email as "senderEmail", 
          to_recipients as "toRecipients", 
          cc_recipients as "ccRecipients", 
          html_content as "htmlContent", 
          attachments
        FROM ticket_comments 
        WHERE id = $1
      `;
      
      // Eklenen yorumun detaylarını al
      const commentDetailResult = await db.executeQueryResult<QueryResult>({
        query: getCommentQuery,
        params: [commentId],
        req
      });
      
      const commentDetail = commentDetailResult.rows && commentDetailResult.rows.length > 0 
        ? commentDetailResult.rows[0] 
        : null;

      // Yanıt olarak eklenen yorumun tam bilgilerini döndür
      return res.status(200).json({
        success: true,
        message: isInternal ? 'Dahili yorum eklendi' : 'E-posta yanıtı gönderildi',
        comment: commentDetail ? {
          id: commentDetail.id,
          ticketId: commentDetail.ticketId,
          content: commentDetail.content,
          isInternal: commentDetail.isInternal,
          createdAt: commentDetail.createdAt,
          createdBy: commentDetail.createdBy,
          createdByName: userName || user.name,
          updatedAt: commentDetail.updatedAt,
          isDeleted: commentDetail.isDeleted,
          emailId: commentDetail.emailId,
          threadId: commentDetail.threadId,
          sender: commentDetail.sender,
          senderEmail: commentDetail.senderEmail,
          toRecipients: commentDetail.toRecipients,
          ccRecipients: commentDetail.ccRecipients,
          htmlContent: commentDetail.htmlContent,
          attachments: commentDetail.attachments ? 
            (typeof commentDetail.attachments === 'string' ? 
              JSON.parse(commentDetail.attachments) : 
              commentDetail.attachments) : 
            null
        } : {
          id: commentId,
          ticketId,
          content: subject || 'E-posta Yanıtı',
          isInternal: isInternal || false,
          createdAt: commentCreatedAt,
          createdBy: userId,
          createdByName: userName || user.name,
          sender: userName || user.name,
          senderEmail: user.email || process.env.MAIL_FROM_ADDRESS || '',
          toRecipients: to || [],
          ccRecipients: filteredCc || null,
          htmlContent: htmlContent || `<p>${content}</p>`,
          attachments: req.body.attachments || null
        }
      });
    } catch (dbError) {
      console.error('Veritabanı işlemi hatası:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('E-posta yanıtı gönderme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'E-posta yanıtı gönderilirken bir hata oluştu',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}