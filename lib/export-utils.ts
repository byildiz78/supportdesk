import * as XLSX from 'xlsx';

/**
 * Generic function to export data to Excel
 * @param data Array of data to export
 * @param fileName Name of the file to save
 * @param formatFunction Optional function to format data before export
 * @param sheetName Optional name for the worksheet (defaults to 'Sayfa1')
 */
export const exportToExcel = (
  data: any[], 
  fileName: string, 
  formatFunction?: (data: any[]) => any[],
  sheetName: string = 'Sayfa1'
) => {
  try {
    // Apply format function if provided
    const dataToExport = formatFunction ? formatFunction(data) : data;

    // Format data to handle special characters and currency
    const formattedData = dataToExport.map(row => {
      const newRow = { ...row };
      Object.keys(newRow).forEach(key => {
        // Convert numbers to strings and handle currency formatting
        if (typeof newRow[key] === 'number') {
          newRow[key] = newRow[key].toLocaleString('tr-TR');
        }
      });
      return newRow;
    });

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData, {
      dateNF: 'dd.mm.yyyy',
      cellDates: true,
    });

    // Set column widths based on data
    const colWidths = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Save file with date
    XLSX.writeFile(wb, `${fileName}_${new Date().toLocaleDateString('tr-TR')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excel dosyası oluşturulurken bir hata oluştu');
  }
};

// Data formatters for specific report types
export const formatTransactionData = (data: any[]) => {
  return data.map(item => ({
    'Tarih': item.date,
    'Cari': item.customer,
    'Alacak': item.credit,
    'Borç': item.debt,
    'Bakiye': item.balance,
    'Çek No': item.documentNo
  }));
};

export const formatBalanceData = (data: any[]) => {
  return data.map(item => ({
    'Müşteri': item.CustomerName || '',
    'Telefon': item.PhoneNumber || '',
    'Başlangıç': item.StartingBalance || 0,
    'Harcama': item.Debt || 0,
    'Tahsilat': item.Credit || 0,
    'Bakiye': item.Balance || 0,
    'Son İşlem Tarihi': item.LastTransactionTime || '',
    'Kart Tipi': item.CardType || ''
  }));
};

export const formatCustomerData = (data: any[]) => {
  return data.map(item => ({
    'Kart No': item.CardNumber || '',
    'Kart Tipi': item.CardType || '',
    'Müşteri Adı': item.CustomerName || '',
    'Şube': item.BranchID ? `${item.BranchID} Nolu Şube` : '',
    'Başlangıç Bakiye': item.BonusStartupValue || 0,
    'Bakiye': item.TotalBonusRemaing || 0,
    'Tahsilat': item.TotalBonusEarned || 0,
    'Harcama': item.TotalBonusUsed || 0
  }));
};

/**
 * Format customer segments data for Excel export
 */
export const formatCustomerSegmentsData = (data: any[]) => {
  return data.map(item => ({
    'Segment Adı': item.name || '',
    'Açıklama': item.description || '',
    'Minimum Harcama': item.minSpendAmount || 0,
    'Maksimum Harcama': item.maxSpendAmount || 0,
    'Minimum Ziyaret': item.minVisitCount || 0,
    'Maksimum Ziyaret': item.maxVisitCount || 0,
    'Durum': item.isActive ? 'Aktif' : 'Pasif',
    'Oluşturulma Tarihi': item.createdAt || ''
  }));
};

/**
 * Format sales transactions data for Excel export
 */
export const formatSalesTransactionsData = (data: any[]) => {
  return data.map(item => ({
    'Tarih': item.Date ? new Date(item.Date).toLocaleDateString('tr-TR') : '',
    'Müşteri': item.CustomerName || '',
    'Belge No': item.CheckNo || '',
    'Tutar': item.Debit || 0
  }));
};

/**
 * Format transaction report data for Excel export
 */
export const formatTransactionReportData = (data: any[]) => {
  return data.map(item => ({
    'Tarih': item.Date ? new Date(item.Date).toLocaleDateString('tr-TR') : '',
    'Müşteri': item.CustomerName || '',
    'Tahsilat': item.Credit || 0,
    'Harcama': item.Debit || 0,
    'Bakiye': item.Balance || 0,
    'Açıklama/Çek No': item.CheckNo || ''
  }));
};

/**
 * Format collection transactions data for Excel export
 */
export const formatCollectionTransactionsData = (data: any[]) => {
  return data.map(item => ({
    'Tarih': item.Date ? new Date(item.Date).toLocaleDateString('tr-TR') : '',
    'Müşteri': item.CustomerName || '',
    'Tahsilat Tutarı': item.Credit || 0,
    'Satış Tipi': item.SaleType || '',
    'Ödeme Tipi': item.PaymentType || 'Merkezi Tahsilat'
  }));
};

/**
 * Format parent companies data for Excel export
 */
export const formatParentCompaniesData = (data: any[]) => {
  return data.map(item => ({
    'Şirket Adı': item.name || '',
    'Vergi No': item.taxId || '',
    'E-posta': item.email || '',
    'Telefon': item.phone || '',
    'Adres': item.address || '',
    'Şehir': item.city || '',
    'Ülke': item.country || '',
    'Durum': item.isActive ? 'Aktif' : 'Pasif',
    'Oluşturulma Tarihi': item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
  }));
};

/**
 * Format contacts data for Excel export
 */
export const formatContactsData = (data: any[]) => {
  return data.map(item => ({
    'Ad': item.firstName || '',
    'Soyad': item.lastName || '',
    'E-posta': item.email || '',
    'Telefon': item.phone || '',
    'Cep Telefonu': item.mobile || '',
    'Pozisyon': item.position || '',
    'Şirket': item.companyName || '-',
    'Şehir': item.city || '',
    'Adres': item.address || '',
    'Durum': item.isActive ? 'Aktif' : 'Pasif',
    'Oluşturulma Tarihi': item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
  }));
};

/**
 * Format companies data for Excel export
 */
export const formatCompaniesData = (data: any[]) => {
  return data.map(item => ({
    'Şirket Adı': item.name || '',
    'Vergi No': item.taxId || '',
    'E-posta': item.email || '',
    'Telefon': item.phone || '',
    'Adres': item.address || '',
    'Şehir': item.city || '',
    'Ülke': item.country || '',
    'Durum': item.isActive ? 'Aktif' : 'Pasif',
    'Oluşturulma Tarihi': item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
  }));
};

/**
 * Helper function to create a generic Excel export handler
 * @param getData Function to get the data to export
 * @param reportName Name of the report
 * @param formatFunction Optional function to format data
 * @returns Function that can be used as an onClick handler
 */
export const createExcelExportHandler = (
  getData: () => any[],
  reportName: string,
  formatFunction?: (data: any[]) => any[]
) => {
  return () => {
    try {
      const data = getData();
      if (!data || data.length === 0) {
        alert('Dışa aktarılacak veri bulunamadı!');
        return;
      }
      
      exportToExcel(data, reportName, formatFunction);
    } catch (error) {
      console.error('Excel export handler error:', error);
      alert('Excel dışa aktarma işlemi sırasında bir hata oluştu!');
    }
  };
};