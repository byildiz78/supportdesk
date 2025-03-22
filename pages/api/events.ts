import { NextApiRequest, NextApiResponse } from 'next';

// Global namespace için interface tanımlayalım
declare global {
  var sseClients: NextApiResponse[];
}

// Global değişken olarak istemcileri saklayalım
// Bu şekilde API çağrıları arasında istemciler korunacak
global.sseClients = global.sseClients || [];

// Bağlı tüm istemcileri saklamak için
const getClients = (): NextApiResponse[] => {
  return global.sseClients;
};

// Yeni bir istemci bağlandığında
export const addClient = (res: NextApiResponse) => {
  // İstemciyi listeye ekle
  global.sseClients.push(res);
  
  // İstemci bağlantısı kesildiğinde
  res.on('close', () => {
    global.sseClients = global.sseClients.filter((client: NextApiResponse) => client !== res);
  });
};

// Tüm istemcilere mesaj gönder
export const sendEventToClients = (eventType: string, data: any) => {
  const clients = getClients();
  
  if (clients.length === 0) {
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  clients.forEach((client: NextApiResponse) => {
    try {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
      successCount++;
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      errorCount++;
    }
  });
  
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // SSE başlıklarını ayarla
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx için
  
  // İstemciyi kaydet
  addClient(res);
  
  // Bağlantı başarılı mesajı
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ success: true })}\n\n`);
  
  // Test mesajı gönder
  setTimeout(() => {
    try {
      res.write(`event: test\n`);
      res.write(`data: ${JSON.stringify({ message: "Test mesajı" })}\n\n`);
    } catch (err) {
      console.error('Test mesajı gönderme hatası:', err);
    }
  }, 3000);
  
  // İstemci bağlantısı kesildiğinde
  req.on('close', () => {
  });
}
