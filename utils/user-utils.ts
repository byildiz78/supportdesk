/**
 * Kullanıcı bilgilerini localStorage'dan okuyan yardımcı fonksiyonlar
 */

/**
 * localStorage'dan kullanıcı ID'sini alır
 * @returns Kullanıcı ID'si veya null
 */
export const getUserId = (): string | null => {
  try {
    // Önce userData_login'den okumayı dene
    const userData = localStorage.getItem('userData_login');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && parsedUserData.userId) {
        return parsedUserData.userId;
      }
    }
    
    // Eğer bulamazsan, doğrudan userId'yi kontrol et
    const userId = localStorage.getItem('userId');
    if (userId) {
      return userId;
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı ID alınırken hata oluştu:', error);
    return null;
  }
};

/**
 * localStorage'dan kullanıcı bilgilerini alır
 * @returns Kullanıcı bilgileri objesi veya null
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData_login');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata oluştu:', error);
    return null;
  }
};
