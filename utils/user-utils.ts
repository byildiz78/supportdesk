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
    const userData = localStorage.getItem('userData_panel');
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
    const userData = localStorage.getItem('userData_panel');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata oluştu:', error);
    return null;
  }
};

/**
 * localStorage'dan kullanıcı rolünü alır
 * @returns Kullanıcı rolü veya null
 */
export const getUserRole = (): string | null => {
  try {
    const userData = localStorage.getItem('userData_panel');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && parsedUserData.userrole) {
        return parsedUserData.userrole;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı rolü alınırken hata oluştu:', error);
    return null;
  }
};

/**
 * localStorage'dan kullanıcı adını alır
 * @returns Kullanıcı adı veya null
 */
export const getUserName = (): string | null => {
  try {
    // userData_login'den kullanıcı adını al
    const userData = localStorage.getItem('userData_panel');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && parsedUserData.name) {
        return parsedUserData.name;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı adı alınırken hata oluştu:', error);
    return null;
  }
};

/**
 * localStorage'dan kullanıcı mailini alır
 * @returns Kullanıcı adı veya null
 */
export const getUserMail = (): string | null => {
  try {
    // userData_login'den kullanıcı adını al
    const userData = localStorage.getItem('userData_panel');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData && parsedUserData.email) {
        return parsedUserData.email;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı maili alınırken hata oluştu:', error);
    return null;
  }
};
