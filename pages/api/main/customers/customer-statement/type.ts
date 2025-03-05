// Müşteri bilgisi için tip
export type Customer = {
    customerName: string;
    cardNo: string;
    balance: number;
  }
  
  // İşlem hareketleri için tip
  export type Transaction = {
    date: string;
    description: string;
    amount: string;  // String olarak döndürüldüğü için
    type: 'credit' | 'debt';
    checkNo: string;
  }
  
  // Dönem bakiyesi ve genel veri yapısı için tip
  export type CustomerStatement = {
    customer: Customer;
    transactions: Transaction[];
    periodBalance: string;  // String olarak döndürüldüğü için
  }