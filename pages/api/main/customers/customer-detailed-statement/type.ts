// Müşteri bilgilerini tanımlayan interface
interface CustomerInfo {
  customerName: string;
  cardNo: string;
  balance: number;
  bonusstartupvalue: number;
}

// Sipariş kalemi detaylarını tanımlayan interface
interface OrderItemDetail {
  menuItemText: string;
  menuItemUnitPrice: number;
  quantity: number;
  extendedPrice: number;
  discountAmount: number;
  netAmount: number;
}

// Bir işlemi tanımlayan interface
interface Transaction {
  date: string;
  description: string;
  amount: string;
  type: 'credit' | 'debt';
  checkNo?: string;
  orderDetails: OrderItemDetail[];
}

// Ana ekstre verisini tanımlayan interface
interface StatementData {
  customer: CustomerInfo;
  transactions: Transaction[];
  periodBalance: string;
}