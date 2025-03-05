// Mock data for when API/database is unavailable
export const mockData = {
  branches: [
    {
      BranchID: 1,
      BranchName: "Demo Şube 1",
      CustomField6: "İstanbul",
      CustomField7: "Kadıköy",
      IsActive: true
    },
    {
      BranchID: 2, 
      BranchName: "Demo Şube 2",
      CustomField6: "Ankara",
      CustomField7: "Çankaya",
      IsActive: true
    }
  ],

  users: [
    {
      UserID: 1,
      UserName: "Demo Kullanıcı",
      UserBranchs: "1,2"
    }
  ],

  tags: [
    {
      TagID: 1,
      TagTitle: "Demo Tag 1",
      IsDefault: true,
      CurrencyName: "TRY",
      BranchID: [1]
    },
    {
      TagID: 2,
      TagTitle: "Demo Tag 2", 
      IsDefault: false,
      CurrencyName: "TRY",
      BranchID: [2]
    }
  ],

  widgets: [
    {
      AutoID: 1,
      ReportName: "Toplam Denetim",
      ReportID: 1,
      ReportIndex: 1,
      ReportIcon: "ClipboardCheck",
      IsActive: true,
      ReportColor: "bg-blue-500"
    },
    {
      AutoID: 2,
      ReportName: "Aylık Denetim",
      ReportID: 2,
      ReportIndex: 2,
      ReportIcon: "CalendarCheck",
      IsActive: true,
      ReportColor: "bg-green-500"
    }
  ],

  widgetData: [
    {
      reportValue1: "100",
      reportValue2: 150,
      reportValue3: 120
    }
  ],

  auditData: [
    { month: 1, monthName: "Ocak", registrationCount: 45 },
    { month: 2, monthName: "Şubat", registrationCount: 38 },
    { month: 3, monthName: "Mart", registrationCount: 52 },
    { month: 4, monthName: "Nisan", registrationCount: 41 },
    { month: 5, monthName: "Mayıs", registrationCount: 55 },
    { month: 6, monthName: "Haziran", registrationCount: 48 }
  ],

  auditDistribution: [
    { form: "Genel Denetim", count: 35 },
    { form: "Hijyen Denetimi", count: 28 },
    { form: "Personel Denetimi", count: 22 },
    { form: "Mutfak Denetimi", count: 15 }
  ],

  recentAudits: [
    {
      date: new Date().toISOString(),
      branchName: "Demo Şube 1",
      formName: "Genel Denetim",
      regionalManager: "Demo Müdür",
      description: "Rutin denetim gerçekleştirildi",
      notes: "Tüm kriterler kontrol edildi"
    }
  ],

  notifications: [
    {
      autoId: 1,
      branchName: "Demo Şube 1",
      formName: "Genel Denetim",
      orderDateTime: new Date().toISOString(),
      type: "1"
    }
  ]
};