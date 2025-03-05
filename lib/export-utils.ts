import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  try {
    // Format data to handle special characters and currency
    const formattedData = data.map(row => {
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

    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');

    // Save file
    XLSX.writeFile(wb, `${fileName}_${new Date().toLocaleDateString('tr-TR')}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excel dosyası oluşturulurken bir hata oluştu');
  }
};

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
    'Müşteri': item.customer,
    'Telefon': item.phone,
    'Başlangıç': item.startDate,
    'Borç': item.debt,
    'Alacak': item.credit,
    'Bakiye': item.balance,
    'Son İşlem Tarihi': item.lastTransactionDate,
    'Kart Tipi': item.cardType
  }));
};

export const formatCustomerData = (data: any[]) => {
  return data.map(item => ({
    'Kart No': item.cardNo,
    'Kart Tipi': item.cardType,
    'Müşteri Adı': item.name,
    'Şube': item.branch,
    'Bakiye': item.balance,
    'Limit': item.credit,
    'Borç': item.debt
  }));
};