// Mock bildirimler
export const mockNotifications = [
  {
    autoId: 1,
    branchName: "Merkez Şube",
    formName: "Satış İşlemi",
    orderDateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 dakika önce
    type: "1",
    amount: 524.50,
    customer: "PERS-AYDIN TANERGİN"
  },
  {
    autoId: 2,
    branchName: "Maltepe Şube",
    formName: "Tahsilat",
    orderDateTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 saat önce
    type: "1",
    amount: 1250.00,
    customer: "PERS-SELİM YÜCEL"
  },
  {
    autoId: 3,
    branchName: "Kadıköy Şube",
    formName: "Satış İşlemi",
    orderDateTime: new Date(Date.now() - 240 * 60 * 1000).toISOString(), // 4 saat önce
    type: "1",
    amount: 845.75,
    customer: "PERS-AYDIN TANERGİN"
  },
  {
    autoId: 4,
    branchName: "Merkez Şube",
    formName: "Tahsilat",
    orderDateTime: new Date(Date.now() - 360 * 60 * 1000).toISOString(), // 6 saat önce
    type: "1",
    amount: 2500.00,
    customer: "PERS-SÜLEYMAN YENER"
  },
  {
    autoId: 5,
    branchName: "Beyoğlu Şube",
    formName: "Satış İşlemi",
    orderDateTime: new Date(Date.now() - 480 * 60 * 1000).toISOString(), // 8 saat önce
    type: "1",
    amount: 327.25,
    customer: "PERS-ZİHNİ ERKİCİ"
  }
];
