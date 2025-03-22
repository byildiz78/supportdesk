import { useEffect, useState, useRef } from 'react';

type EventCallback = (data: any) => void;

export const useEventSource = () => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Event dinleyicileri için useRef kullanarak bileşen yeniden render edildiğinde kaybolmamasını sağlayalım
  const eventListenersRef = useRef<Record<string, EventCallback[]>>({});
  
  // basePath'i al (eğer varsa)
  const basePath = process.env.NEXT_PUBLIC_BASEPATH || '';
  
  useEffect(() => {
    // EventSource bağlantısını kur
    const es = new EventSource(`${basePath}/api/events`);
    
    // Bağlantı olayları
    es.onopen = () => {
      setIsConnected(true);
    };
    
    es.onerror = (err) => {
      console.error('SSE bağlantı hatası:', err);
      setIsConnected(false);
    };
    
    // Genel mesaj dinleyicisi
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
      } catch (err) {
        console.error('SSE mesaj işleme hatası:', err);
      }
    };
    
    // Bağlantı başarılı olayı
    es.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsConnected(true);
      } catch (err) {
        console.error('SSE bağlantı olayı işleme hatası:', err);
      }
    });
    
    // Ticket güncelleme olayını dinle
    es.addEventListener('ticket-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Kayıtlı tüm dinleyicileri çağır
        if (eventListenersRef.current['ticket-update']) {
          eventListenersRef.current['ticket-update'].forEach(callback => {
            try {
              callback(data);
            } catch (callbackErr) {
              console.error('Callback çalıştırma hatası:', callbackErr);
            }
          });
        }
      } catch (err) {
        console.error('SSE ticket-update olayı işleme hatası:', err);
      }
    });
    
    setEventSource(es);
    
    // Temizleme
    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [basePath]);
  
  // Event dinleyici ekle
  const addEventListener = (event: string, callback: EventCallback) => {
    
    // Dinleyiciyi kaydet
    if (!eventListenersRef.current[event]) {
      eventListenersRef.current[event] = [];
    }
    
    // Aynı callback zaten eklenmiş mi kontrol et
    if (!eventListenersRef.current[event].includes(callback)) {
      eventListenersRef.current[event].push(callback);
    }
  };
  
  // Event dinleyici kaldır
  const removeEventListener = (event: string, callback: EventCallback) => {
    
    if (!eventListenersRef.current[event]) return;
    
    const initialLength = eventListenersRef.current[event].length;
    // Dinleyiciyi kaldır
    eventListenersRef.current[event] = eventListenersRef.current[event].filter(cb => cb !== callback);
  };
  
  return { 
    isConnected, 
    addEventListener,
    removeEventListener
  };
};
