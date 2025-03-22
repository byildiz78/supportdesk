import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import nodemailer from 'nodemailer';
import { extractTenantFromBody } from '@/lib/utils';
import { sendEventToClients } from '@/pages/api/events';

interface QueryResult {
  rows: any[];
  rowCount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('sendEmailReply API çağrıldı', { 
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body 
  });

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

    console.log('Request parametreleri:', { 
      ticketId, content, subject, to, cc, replyToEmailId, 
      threadId, isInternal, userId, userName 
    });

    // E-posta gönderme işlemi için gerekli bilgileri kontrol et
    if (!ticketId || !content || !to || !to.length) {
      console.log('Eksik parametreler:', { ticketId, content, to });
      return res.status(400).json({
        success: false,
        message: 'Eksik parametreler: ticketId, content ve to gereklidir',
      });
    }

    // Çevre değişkenlerini kontrol et
    console.log('Çevre değişkenleri:', { 
      SUPPORT_MAIL: process.env.SUPPORT_MAIL,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '***' : undefined
    });

    if (!process.env.SUPPORT_MAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error('E-posta ayarları eksik:', { 
        SUPPORT_MAIL: !!process.env.SUPPORT_MAIL,
        GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD
      });
      return res.status(500).json({
        success: false,
        message: 'E-posta ayarları eksik, lütfen SUPPORT_MAIL ve GMAIL_APP_PASSWORD değişkenlerini kontrol edin',
      });
    }

    // Nodemailer transporter oluştur
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL/TLS kullan
        auth: {
          user: process.env.SUPPORT_MAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
        debug: true, // Hata ayıklama modunu etkinleştir
        logger: true // Günlük kaydını etkinleştir
      });
      console.log('Nodemailer transporter oluşturuldu');

      // Transporter'ın bağlantısını test et
      transporter.verify(function(error, success) {
        if (error) {
          console.error('SMTP bağlantı hatası:', error);
        } else {
          console.log('SMTP sunucusuna bağlantı başarılı:', success);
        }
      });

      // Ticket numarasını kontrol et ve ekle
      let emailSubject = subject || 'Re: Destek Talebiniz Hakkında';
      
      // Client tarafından gelen subject'i kullan
      // Eğer subject belirtilmişse, doğrudan onu kullan
      // Bu subject zaten client tarafında yorum içeriğinden oluşturulmuş olacak
      console.log('Client tarafından gelen subject:', emailSubject);
      
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
            console.log('Ticket numarası eklendi, yeni subject:', emailSubject);
          }
        }
      } catch (error) {
        console.error('Ticket numarası alınırken hata:', error);
        // Hata durumunda işleme devam et, ticket numarası eklenmeden
      }

      // E-posta gönderim ayarları
      const mailOptions = {
        from: process.env.SUPPORT_MAIL || '',
        to: to.join(', '),
        cc: cc && cc.length > 0 ? cc.join(', ') : undefined,
        subject: emailSubject,
        text: content,
        html: typeof htmlContent === 'string' ? htmlContent : `<p>${content}</p>`,
        headers: {
          // Nodemailer headers formatına uygun şekilde düzenleme
          'In-Reply-To': replyToEmailId ? replyToEmailId : undefined,
          'References': threadId || undefined,
        },
        // Eklentileri ekleyelim
        attachments: attachments && attachments.length > 0 ? attachments.map((attachment: any) => {
          // Dosya yolunu oluşturalım
          const filePath = attachment.storagePath && attachment.storagePath.startsWith('/') 
            ? `${process.cwd()}/public${attachment.storagePath}` 
            : `${process.cwd()}/public/uploads/${attachment.name}`;
          
          console.log('Eklenti dosya yolu:', filePath);
          
          return {
            filename: attachment.originalFilename || attachment.name,
            path: filePath,
            contentType: attachment.mimeType
          };
        }) : []
      };
      console.log('Mail options hazırlandı:', mailOptions);

      // E-postayı gönder
      if (!isInternal) {
        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('E-posta gönderildi:', info);
        } catch (error) {
          console.error('E-posta gönderme hatası:', error);
          // E-posta gönderilemese bile yorumu kaydetmeye devam et
        }
      } else {
        console.log('Dahili yorum, e-posta gönderilmiyor');
      }
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      // E-posta gönderme hatası olsa bile devam et, yorumu kaydet
    }

    console.log('Veritabanı işlemleri başlatılıyor...');

    // Yanıtı veritabanına kaydet
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
    console.log('Kullanıcı bilgileri alınıyor...');
    const userQuery = `
      SELECT name, email FROM users WHERE id = $1
    `;
    try {
      const userResult = await db.executeQuery<QueryResult>({
        query: userQuery,
        params: [userId],
        req
      });
      console.log('Kullanıcı bilgileri alındı:', userResult.rows && userResult.rows.length > 0 ? userResult.rows[0] : 'Kullanıcı bulunamadı');
      
      // Kullanıcı bulunamadıysa varsayılan değerleri kullan
      const user = (userResult.rows && userResult.rows.length > 0) 
        ? userResult.rows[0] 
        : { name: 'Sistem', email: process.env.SUPPORT_MAIL };

      // Yorumu veritabanına ekle
      console.log('Yorum veritabanına ekleniyor...');
      const commentResult = await db.executeQuery<QueryResult>({
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
          cc,
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
      // Bazı durumlarda, sorgu başarılı olsa bile rows dizisi boş olabilir
      // Bu durumda, rowCount > 0 ise yorum başarıyla eklenmiş demektir
      if ((!commentResult.rows || commentResult.rows.length === 0) && commentResult.rowCount === 0) {
        throw new Error('Yorum veritabanına eklenemedi');
      }
      
      // Yorum ID'si ve oluşturulma tarihi
      const commentId = commentResult.rows && commentResult.rows.length > 0 
        ? commentResult.rows[0]?.id 
        : `comment-${Date.now()}`;
      
      const commentCreatedAt = commentResult.rows && commentResult.rows.length > 0 
        ? commentResult.rows[0]?.createdAt 
        : new Date().toISOString();
      
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

      return res.status(200).json({
        success: true,
        message: isInternal ? 'Dahili yorum eklendi' : 'E-posta yanıtı gönderildi',
        commentId: commentId,
        createdAt: commentCreatedAt,
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
