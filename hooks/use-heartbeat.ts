import { useEffect, useRef } from 'react';
 import axios, { isAxiosError } from '@/lib/axios';
 import { getUserId } from '@/utils/user-utils';
 
 export function useHeartbeat(interval = 60000) { // varsayılan 60 saniye
     const heartbeatRef = useRef<NodeJS.Timeout>();
     const userId = getUserId();
 
     useEffect(() => {
         if (!userId) {
             return;
         }
 
         const sendHeartbeat = async () => {
             try {
                 const response = await axios.post('/api/main/users/heartbeat', {
                     user_id: userId,
                     status: 'online'
                 });
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
         sendHeartbeat();
 
         // Önceki interval'ı temizle
         if (heartbeatRef.current) {
             clearInterval(heartbeatRef.current);
         }
 
         // Yeni interval'ı başlat ve ref'e kaydet
         heartbeatRef.current = setInterval(sendHeartbeat, interval);
 
         // Cleanup
         return () => {
             if (heartbeatRef.current) {
                 clearInterval(heartbeatRef.current);
                 heartbeatRef.current = undefined;
             }
         };
     }, [userId, interval]);
 
     // Hook mount/unmount log
     useEffect(() => {
         return () => console.log('Heartbeat hook unmount edildi');
     }, []);
 }