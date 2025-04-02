import { useEffect, useRef } from 'react';
import axios, { isAxiosError } from '@/lib/axios';
import { getUserId } from '@/utils/user-utils';

export function useHeartbeat(interval = 30000) { // varsayılan 30 saniye
    const heartbeatRef = useRef<NodeJS.Timeout>();
    const userId = getUserId();

    useEffect(() => {
        console.log('Heartbeat hook çalıştı, userId:', userId);
        
        if (!userId) {
            console.log('Kullanıcı ID bulunamadı');
            return;
        }

        const sendHeartbeat = async () => {
            try {
                console.log('Heartbeat gönderiliyor...', {
                    user_id: userId,
                    status: 'online'
                });

                const response = await axios.post('/api/users/heartbeat', {
                    user_id: userId,
                    status: 'online'
                });

                console.log('Heartbeat yanıtı:', response.data);
            } catch (error: unknown) {
                console.error('Heartbeat error:', error);
                if (isAxiosError(error)) {
                    console.error('Axios error details:', {
                        status: error.response?.status,
                        data: error.response?.data,
                        headers: error.response?.headers
                    });
                }
            }
        };

        // İlk heartbeat'i hemen gönder
        console.log('İlk heartbeat gönderiliyor...');
        sendHeartbeat();

        // Önceki interval'ı temizle
        if (heartbeatRef.current) {
            console.log('Önceki interval temizleniyor...');
            clearInterval(heartbeatRef.current);
        }

        // Yeni interval'ı başlat ve ref'e kaydet
        console.log(`Yeni interval başlatılıyor (${interval}ms)...`);
        heartbeatRef.current = setInterval(sendHeartbeat, interval);

        // Cleanup
        return () => {
            if (heartbeatRef.current) {
                console.log('Component unmount - interval temizleniyor...');
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = undefined;
            }
        };
    }, [userId, interval]);

    // Hook mount/unmount log
    useEffect(() => {
        console.log('Heartbeat hook mount edildi');
        return () => console.log('Heartbeat hook unmount edildi');
    }, []);
}
