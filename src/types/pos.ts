export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILL_PRINTED' | 'RESERVED';

export type TableSection = 'Main Floor' | 'Patio Garden' | 'Bar Counter' | 'VIP Lounge';

export interface RestaurantTable {
  id: string;
  number: string;
  name: string;
  section: TableSection;
  capacity: number;
  status: TableStatus;
  activeOrderId?: string;
  seatedAt?: string;
  guestCount?: number;
  serverName?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  sku: string;
  barcode: string;
  image: string;
  inStock: boolean;
  stockCount: number;
  description?: string;
}

export type KitchenStatus = 'DRAFT' | 'SENT_TO_KITCHEN' | 'PREPARING' | 'SERVED';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  round: number; // 1 = First Round / Starters, 2 = Mains, etc.
  kitchenStatus: KitchenStatus;
  sentAt?: string;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export type OrderStatus = 'OPEN' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  guestCount?: number;
  serverName: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  discountPercent: number; // e.g., 0, 10, 15
  tipAmount: number;
  taxRate: number; // e.g., 0.08 for 8%
  createdAt: string;
  closedAt?: string;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'SPLIT';

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  changeDue?: number;
  timestamp: string;
}

export interface ShiftSession {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  qrSales: number;
  totalRevenue: number;
  totalOrdersCount: number;
  status: 'OPEN' | 'CLOSED';
}
