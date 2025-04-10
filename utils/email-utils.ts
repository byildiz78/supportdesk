import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/smtp-transport';
import { decodeHtml, normalizeNewlines } from './text-utils';

/**
 * Basit HTML entity decode işlemi
 * @param html HTML string
 * @returns Decoded HTML string
 */
const simpleDecodeHtml = (html: string): string => {
  if (!html) return '';

  // Basit HTML entity dönüşümü
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&#47;/g, '/');
};

/**
 * Satır sonlarını normalize eder
 * @param content İçerik
 * @returns Normalize edilmiş içerik
 */
const simpleNormalizeNewlines = (content: string): string => {
  if (!content) return '';

  // Satır sonlarını normalize et
  let normalized = content.replace(/\\r\\n/g, '\n');
  normalized = normalized.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  normalized = normalized.replace(/\n/g, '<br>');
  normalized = normalized.replace(/\r/g, '');
  normalized = normalized.replace(/\\r/g, '');
  normalized = normalized.replace(/\\n/g, '<br>');

  return normalized;
};

/**
 * Basit HTML içerik işleme
 * @param content HTML içerik
 * @returns İşlenmiş HTML string
 */
const simpleProcessHtmlContentOriginal = (content: string): string => {
  if (!content) return '';

  try {
    // HTML entity'leri decode et
    const decodedContent = simpleDecodeHtml(content);

    // Satır sonlarını normalize et
    const normalizedContent = simpleNormalizeNewlines(decodedContent);

    // Basit XSS koruması - script taglerini kaldır
    const sanitizedContent = normalizedContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, 'removed:');

    return sanitizedContent;
  } catch (error) {
    console.error('HTML içerik işleme hatası:', error);
    return content; // Hata durumunda orijinal içeriği döndür
  }
};

/**
 * Simple HTML content processing for email
 * This is a simplified version of processHtmlContent that works better for emails
 * @param htmlContent HTML content to process
 * @returns Processed HTML content
 */
const simpleProcessHtmlContent = (htmlContent: string): string => {
  if (!htmlContent) return '';

  try {
    // HTML entities decode
    let processed = decodeHtml(htmlContent);

    // Normalize newlines
    processed = normalizeNewlines(processed);

    // Basit XSS koruması
    processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return processed;
  } catch (error) {
    console.error('Error processing HTML content for email:', error);
    return htmlContent; // Hata durumunda orijinal içeriği döndür
  }
};

/**
 * Generates HTML content for ticket creation notification
 * @param ticketNo Ticket number to include in the notification
 * @param customerName Customer name to include in the notification
 * @param originalEmailContent Original email content to include at the bottom
 * @returns HTML content for the notification email
 */
export const generateTicketCreationNotification = (
  ticketNo: string,
  customerName: string,
  originalEmailContent?: string
): string => {
  // Müşteri adını güvenli bir şekilde ekle
  const safeName = customerName || 'Müşterimiz';

  // Orijinal e-posta içeriği varsa, basit bir şekilde işle
  let originalContentSection = '';
  if (originalEmailContent) {
    // Basit bir şekilde işle, çok fazla manipülasyon yapmadan
    const safeOriginalContent = simpleProcessHtmlContent(originalEmailContent);

    originalContentSection = `
    <tr><td height="40"></td></tr>
    <tr>
      <td style="padding: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #333333; border-bottom: 1px solid #e5e7eb;">
        Orijinal Mesaj
      </td>
    </tr>
    <tr><td height="15"></td></tr>
    <tr>
      <td style="font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #555555; background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
        ${safeOriginalContent}
      </td>
    </tr>
    <tr><td height="20"></td></tr>`;
  }

  // Profesyonel ve tüm e-posta istemcileriyle uyumlu bir HTML şablonu
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Destek Talebiniz Alındı</title>
  <style type="text/css">
    /* Bu CSS sadece modern istemcilerde çalışacak, eski istemcilerde inline stiller kullanılacak */
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    /* Outlook.com için */
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif;">
  <!-- Tüm içerik -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f7f7;">
    <tr>
      <td style="padding: 20px 0;">
        <!-- Ana içerik konteyner -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center" style="margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- HEADER -->
          <tr>
            <td bgcolor="#3b82f6" style="padding: 30px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
               
                  <td style="padding-left: 15px; text-align: left; vertical-align: middle;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; font-family: Arial, sans-serif;">Destek Talebiniz Alındı</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CONTENT -->
          <tr>
            <td style="padding: 30px 30px 0;">
              <!-- Greeting -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 0 0 20px 0; font-family: Arial, sans-serif;">
                    <h2 style="margin: 0; font-size: 18px; line-height: 24px; font-weight: bold; color: #333333;">
                      Sayın ${safeName},
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333;">
                    <p style="margin: 0;">Destek talebiniz başarıyla oluşturuldu.<br> <br>Kısa süre içerisinde, konuyla ilgili uzman ekip arkadaşımız sizinle iletişime geçecektir.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Ticket Number -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; font-family: Arial, sans-serif;">
                    <p style="margin: 0; font-size: 15px; color: #64748b;">Talep Numaranız:</p>
                    <p style="margin: 5px 0 0; font-size: 24px; color: #3b82f6; font-weight: bold;">${ticketNo}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Contact Information -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #333333; border-bottom: 1px solid #e5e7eb;">
                    Saygılarımızla 
                    <br>robotpos destek ekibi
                  </td>
                </tr>
                <tr><td height="15"></td></tr>
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; line-height: 24px; color: #555555;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="top" style="padding-right: 10px;">
                          <span style="color: #3b82f6; font-weight: bold; font-size: 18px;">✉</span>
                        </td>
                        <td>
                          <a href="mailto:destek@robotpos.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">destek@robotpos.com</a>
                        </td>
                      </tr>
                      <tr><td height="10"></td><td></td></tr>
                      <tr>
                        <td width="24" valign="top" style="padding-right: 10px;">
                          <span style="color: #3b82f6; font-weight: bold; font-size: 18px;">☎</span>
                        </td>
                        <td>
                          <span style="font-weight: 500;">+90 (850) 811 0 <span style="font-weight: bold;">456</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Original Email Content -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                ${originalContentSection}
              </table>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="padding: 30px; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #666666; text-align: center; border-radius: 0 0 8px 8px; background-color: #f8fafc;">
              <p style="margin: 0;">© 2024 RobotPOS Çözüm Merkezi. Tüm hakları saklıdır.</p>
              <p style="margin: 8px 0 0;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Sends a notification email to the ticket creator and CC recipients
 * @param subject Email subject with ticket number
 * @param to Recipients email addresses
 * @param cc CC recipients email addresses
 * @param htmlContent HTML content of the email
 * @returns Promise with the result of the email sending operation
 */
export const sendTicketNotificationEmail = async (
  subject: string,
  to: string[],
  cc: string[] | null,
  htmlContent: string
): Promise<{ success: boolean; message: string; info?: any }> => {
  console.log('sendTicketNotificationEmail called with:', {
    subject,
    to,
    cc,
    htmlContentLength: htmlContent?.length || 0
  });

  if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD || !process.env.MAIL_HOST) {
    console.error('Email settings missing:', {
      MAIL_USER: !!process.env.MAIL_USER,
      MAIL_PASSWORD: !!process.env.MAIL_PASSWORD,
      MAIL_HOST: !!process.env.MAIL_HOST
    });
    return {
      success: false,
      message: 'Email settings missing, please check MAIL_USER, MAIL_PASSWORD, and MAIL_HOST variables'
    };
  }

  try {
    console.log('Creating nodemailer transporter...');
    // Create nodemailer transporter
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

    // Verify connection
    console.log('Verifying SMTP connection...');
    try {
      const verifyResult = await transporter.verify();
      console.log('SMTP connection verified successfully:', verifyResult);
    } catch (verifyError) {
      console.error('SMTP verification error:', verifyError);
      return {
        success: false,
        message: `SMTP verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`
      };
    }

    // Process HTML content to handle any encoding issues
    const processedHtmlContent = simpleProcessHtmlContent(htmlContent);

    const mailOptions: MailOptions = {
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
      subject: subject,
      html: processedHtmlContent, // String olarak işlenmiş içerik
    };
    
    const sendMailPromise = new Promise<any>((resolve, reject) => {
      // 30 seconds timeout
      const timeout = setTimeout(() => {
        console.error('Email sending timed out after 30 seconds');
        reject(new Error('Email sending operation timed out (30 seconds)'));
      }, 30000);

      transporter.sendMail(mailOptions)
        .then(info => {
          clearTimeout(timeout);
          console.log('Email sent successfully, clearing timeout');
          resolve(info);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Error in transporter.sendMail:', err);
          reject(err);
        });
    });
    const info = await sendMailPromise;

    return {
      success: true,
      message: 'Email sent successfully',
      info
    };
  } catch (error) {
    console.error('Error sending ticket notification email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return {
      success: false,
      message: `Failed to send notification email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};


// HTML içeriğini oluşturan fonksiyon
export function createHtmlContent(content: string): string {
  // Eğer içerik zaten HTML formatındaysa
  if (content.includes('<html>') || content.includes('<!DOCTYPE html>') || 
      (content.includes('<body>') && content.includes('</body>'))) {
    return content; // HTML içeriğini olduğu gibi döndür
  }
  
  // İçerik HTML değilse, normal işleme devam et
  const lines = content.split('\n');
  let htmlParts = [];
  let currentParagraph = '';
  let inSqlBlock = false;
  let sqlBlock = '';

  for (const line of lines) {
    // SQL komutunu tespit et (update, select, insert, delete ile başlıyorsa)
    if (line.trim().toLowerCase().startsWith('update ') || 
        line.trim().toLowerCase().startsWith('select ') || 
        line.trim().toLowerCase().startsWith('insert ') || 
        line.trim().toLowerCase().startsWith('delete ')) {
      // Eğer daha önce normal metin varsa, paragraf olarak ekle
      if (currentParagraph && !inSqlBlock) {
        htmlParts.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
      
      inSqlBlock = true;
      sqlBlock += line + '\n';
    } 
    // SQL bloğu dışındayız
    else if (!line.trim().startsWith('update ') && line.trim() !== '') {
      // Eğer SQL bloğunu bitirmişsek
      if (inSqlBlock) {
        htmlParts.push(`<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${sqlBlock}</pre>`);
        sqlBlock = '';
        inSqlBlock = false;
      }
      
      // Normal metne devam
      if (currentParagraph) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph = line;
      }
    }
    // Boş satır - paragraf sonlandır
    else if (line.trim() === '') {
      if (inSqlBlock) {
        // SQL bloğu içindeyse boş satırı koru
        sqlBlock += '\n';
      } else if (currentParagraph) {
        // Normal paragrafı sonlandır
        htmlParts.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
    }
  }
  
  // Son blokları da ekle
  if (inSqlBlock && sqlBlock) {
    htmlParts.push(`<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${sqlBlock}</pre>`);
  } else if (currentParagraph) {
    htmlParts.push(`<p>${currentParagraph}</p>`);
  }
  
  // Tam HTML dökümanı oluştur
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    pre { 
      background-color: #f5f5f5; 
      padding: 10px; 
      border-radius: 5px; 
      white-space: pre-wrap; 
      font-family: Consolas, monospace; 
      margin: 15px 0;
      border: 1px solid #ddd;
    }
    p { margin-bottom: 10px; }
  </style>
</head>
<body>
  ${htmlParts.join('\n')}
</body>
</html>`;
}