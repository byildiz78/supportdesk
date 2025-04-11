import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import nodemailer from 'nodemailer';
import { sendEventToClients } from '@/pages/api/events';
import path from 'path';
import fs from 'fs';
import { createHtmlContent } from '@/utils/email-utils';

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
      let emailSubject = subject || 'Destek Talebiniz Hakkında';
      
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
        html: createHtmlContent(content), // HTML içeriğini oluşturan fonksiyon
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
          
          const info = await sendMailPromise;
          console.log('E-posta başarıyla gönderildi:', info);
        } catch (emailError) {
          console.error('E-posta gönderme hatası:', emailError);
          return res.status(500).json({
            success: false,
            message: 'E-posta gönderilirken hata oluştu: ' + (emailError as Error).message,
          });
        }
      }

      // Yeni bir yorum oluştur
      const commentQuery = `
        INSERT INTO ticket_comments (
          ticket_id, content, is_internal, created_by, 
          email_id, thread_id, sender, sender_email, to_recipients, cc_recipients, html_content
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, created_at
      `;

      // Yeni bir e-posta ID'si ve thread ID'si oluştur
      const emailId = `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const threadId = `thread_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const commentParams = [
        ticketId,
        subject,
        isInternal,
        userId,
        emailId, // Yeni bir e-posta ID'si
        threadId, // Yeni bir thread ID'si
        userName,
        process.env.MAIL_FROM_ADDRESS || 'destek@robotpos.com',
        to,
        cc,
        htmlContent || createHtmlContent(content)
      ];

      const commentResult = await db.executeQueryResult<QueryResult>({
        query: commentQuery,
        params: commentParams,
        req
      }) as QueryResult;

      const newCommentId = commentResult.rows[0].id;
      const createdAt = commentResult.rows[0].created_at;

      // Ticket'ın son güncelleme zamanını güncelle
      const updateTicketQuery = `
        UPDATE tickets 
        SET updated_at = NOW() 
        WHERE id = $1
      `;

      await db.executeQuery({
        query: updateTicketQuery,
        params: [ticketId],
        req
      });

      // Yeni yorumu ve ekleri döndür
      const commentResponse = {
        id: newCommentId,
        ticketId: ticketId,
        content: subject,
        isInternal: isInternal,
        createdAt: createdAt,
        createdBy: userId,
        createdByName: userName,
        emailId: emailId,
        threadId: threadId,
        sender: userName || 'destek@robotpos.com',
        toRecipients: to,
        ccRecipients: cc,
        htmlContent: htmlContent || createHtmlContent(content),
        attachments: attachments
      };

      return res.status(200).json({
        success: true,
        message: 'E-posta başarıyla gönderildi ve yorum eklendi',
        comment: commentResponse,
        attachments: attachments
      });

    } catch (transporterError) {
      console.error('Transporter oluşturma hatası:', transporterError);
      return res.status(500).json({
        success: false,
        message: 'E-posta sunucusu yapılandırılırken hata oluştu: ' + (transporterError as Error).message,
      });
    }

  } catch (error) {
    console.error('API hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'İşlem sırasında bir hata oluştu: ' + (error as Error).message,
    });
  }
}
