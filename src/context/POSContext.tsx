import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  RestaurantTable,
  Product,
  Category,
  Order,
  OrderItem,
  OrderType,
  KitchenStatus,
  ShiftSession,
  TableSection,
  PaymentMethod,
  PaymentRecord,
  OrderStatus
} from '../types/pos';
import {
  INITIAL_TABLES,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_SHIFT
} from '../data/mockData';

export type AppMode = 'REGISTER' | 'TABLES' | 'ORDERS' | 'ANALYTICS' | 'KITCHEN';

interface POSContextType {
  tables: RestaurantTable[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  activeOrder: Order | null;
  currentMode: AppMode;
  selectedSection: TableSection | 'All';
  searchQuery: string;
  selectedCategory: string;
  shift: ShiftSession;
  paymentHistory: PaymentRecord[];
  
  // UI Controls
  setCurrentMode: (mode: AppMode) => void;
  setSelectedSection: (sec: TableSection | 'All') => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (catId: string) => void;
  setActiveOrder: (order: Order | null) => void;
  
  // Business logic
  openTable: (tableId: string, guestCount: number, customerName?: string, serverName?: string) => Order;
  selectOrderForTable: (tableId: string) => void;
  startQuickSale: () => Order;
  startTakeawayOrder: (
    customerName?: string,
    phone?: string,
    pickupToken?: string,
    payOnPickup?: boolean
  ) => Order;
  markTakeawayReady: (orderId: string) => void;
  markTakeawayCollected: (orderId: string) => void;
  updateTakeawayDetails: (orderId: string, details: Partial<Order>) => void;
  addItemToActiveOrder: (product: Product, notes?: string) => void;
  updateItemQuantity: (itemId: string, delta: number) => void;
  removeItemFromOrder: (itemId: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  sendDraftsToKitchen: () => OrderItem[];
  printGuestCheck: (orderId: string) => Order | null;
  settleOrder: (
    orderId: string,
    method: PaymentMethod,
    amount: number,
    tip: number,
    tendered?: number,
    changeDue?: number
  ) => { order: Order; payment: PaymentRecord };
  transferTable: (fromTableId: string, toTableId: string) => boolean;
  setOrderDiscount: (discountPercent: number) => void;
  setOrderTip: (tip: number) => void;
  setOrderType: (type: OrderType, tableId?: string, tableName?: string) => void;
  setOrderCustomer: (customerName?: string, token?: string) => void;
  clearActiveCart: () => void;
  parkActiveOrder: () => OrderItem[];
  updateOrderItemStatus: (orderId: string, itemId: string, status: KitchenStatus) => void;
  markOrderCooking: (orderId: string) => void;
  bumpOrderKitchen: (orderId: string) => void;
  closeActiveOrderDrawer: () => void;
  closeShiftSession: (countedCash: number) => void;
  resetAllData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'aura_pos_v3_clean_';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state with localStorage fallbacks
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tables`);
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [shift, setShift] = useState<ShiftSession>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}shift`);
    return saved ? JSON.parse(saved) : INITIAL_SHIFT;
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}payments`);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'kitchen' || window.location.hash.includes('kitchen')) {
      return 'KITCHEN';
    }
    return 'REGISTER';
  });
  const [selectedSection, setSelectedSection] = useState<TableSection | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tables`, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}shift`, JSON.stringify(shift));
  }, [shift]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}payments`, JSON.stringify(paymentHistory));
  }, [paymentHistory]);

  // Cross-window synchronization between POS Register and Kitchen Screen
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === `${STORAGE_KEY_PREFIX}orders` && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
      if (e.key === `${STORAGE_KEY_PREFIX}tables` && e.newValue) {
        try {
          setTables(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
      if (e.key === `${STORAGE_KEY_PREFIX}shift` && e.newValue) {
        try {
          setShift(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Keep activeOrder synced with orders array
  useEffect(() => {
    if (activeOrder) {
      const freshOrder = orders.find((o) => o.id === activeOrder.id);
      if (freshOrder && JSON.stringify(freshOrder) !== JSON.stringify(activeOrder)) {
        setActiveOrder(freshOrder);
      }
    }
  }, [orders]);

  // Actions
  const openTable = (
    tableId: string,
    guestCount: number,
    customerName?: string,
    serverName: string = 'Alex Morgan'
  ): Order => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) throw new Error('Table not found');

    const newOrderNumber = `#ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      type: 'DINE_IN',
      tableId: targetTable.id,
      tableName: `${targetTable.name} (${targetTable.number})`,
      customerName: customerName || `Party of ${guestCount}`,
      guestCount,
      serverName,
      items: [],
      status: 'OPEN',
      paymentStatus: 'UNPAID',
      discountPercent: 0,
      tipAmount: 0,
      taxRate: 0.08,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);

    setTables((prev) =>
      prev.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status: 'OCCUPIED',
              activeOrderId: newOrderId,
              seatedAt: new Date().toISOString(),
              guestCount,
              serverName
            }
          : tbl
      )
    );

    setActiveOrder(newOrder);
    return newOrder;
  };

  const selectOrderForTable = (tableId: string) => {
    const tbl = tables.find((t) => t.id === tableId);
    if (!tbl || !tbl.activeOrderId) return;
    const ord = orders.find((o) => o.id === tbl.activeOrderId);
    if (ord) {
      setActiveOrder(ord);
    }
  };

  const startQuickSale = (): Order => {
    const newOrderNumber = `#QCK-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = `ord-qck-${Date.now()}`;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      type: 'TAKEAWAY',
      customerName: 'Counter Customer',
      serverName: shift.cashierName,
      items: [],
      status: 'OPEN',
      paymentStatus: 'UNPAID',
      discountPercent: 0,
      tipAmount: 0,
      taxRate: 0.08,
      createdAt: new Date().toISOString()
    };

    // Do NOT add to orders list yet! Draft carts only become active tabs when parked or settled.
    setActiveOrder(newOrder);
    setCurrentMode('REGISTER');
    return newOrder;
  };

  const startTakeawayOrder = (
    customerName: string = 'Takeaway Guest',
    phone?: string,
    pickupToken?: string,
    payOnPickup: boolean = true
  ): Order => {
    const newOrderNumber = `#TAK-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = `ord-tak-${Date.now()}`;
    const token = pickupToken || `Pickup #${Math.floor(1 + Math.random() * 20)}`;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      type: 'TAKEAWAY',
      customerName,
      customerPhone: phone,
      pickupToken: token,
      takeawayStatus: 'PREPARING',
      payOnPickup,
      serverName: shift.cashierName,
      items: [],
      status: 'OPEN',
      paymentStatus: 'UNPAID',
      discountPercent: 0,
      tipAmount: 0,
      taxRate: 0.08,
      createdAt: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setCurrentMode('REGISTER');
    return newOrder;
  };

  const markTakeawayReady = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              takeawayStatus: 'READY_FOR_PICKUP',
              status: o.paymentStatus === 'PAID' ? 'SERVED' : 'SERVED',
              items: o.items.map((i) => ({ ...i, kitchenStatus: 'SERVED' as const }))
            }
          : o
      )
    );
  };

  const markTakeawayCollected = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              takeawayStatus: 'COLLECTED',
              status: 'COMPLETED',
              closedAt: new Date().toISOString()
            }
          : o
      )
    );
  };

  const updateTakeawayDetails = (orderId: string, details: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...details } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, ...details } : null));
    }
  };

  const addItemToActiveOrder = (product: Product, notes?: string) => {
    let targetOrder = activeOrder;

    // If no active order or if active order is already PAID (closed bill), start a fresh order
    if (!targetOrder || targetOrder.paymentStatus === 'PAID') {
      targetOrder = startQuickSale();
    }

    // Determine current max round in order
    const maxRound = targetOrder.items.reduce((max, item) => Math.max(max, item.round), 1);
    const roundToAssign = targetOrder.items.some((i) => i.kitchenStatus === 'DRAFT')
      ? maxRound
      : maxRound + (targetOrder.items.length > 0 ? 1 : 0);

    // Check if item already exists in DRAFT status with same notes
    const existingDraftIndex = targetOrder.items.findIndex(
      (item) => item.productId === product.id && item.kitchenStatus === 'DRAFT' && item.notes === notes
    );

    let updatedItems: OrderItem[];

    if (existingDraftIndex >= 0) {
      updatedItems = [...targetOrder.items];
      updatedItems[existingDraftIndex] = {
        ...updatedItems[existingDraftIndex],
        quantity: updatedItems[existingDraftIndex].quantity + 1
      };
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        notes,
        round: roundToAssign,
        kitchenStatus: targetOrder.type === 'TAKEAWAY' ? 'DRAFT' : 'DRAFT'
      };
      updatedItems = [...targetOrder.items, newItem];
    }

    const updatedOrder = {
      ...targetOrder,
      items: updatedItems
    };

    // Keep draft additions in activeOrder; do not update orders list until Update or Send is clicked
    setActiveOrder(updatedOrder);
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;

    const item = activeOrder.items.find((i) => i.id === itemId);
    if (!item) return;

    let updatedItems: OrderItem[];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      // If already sent to kitchen, we don't just delete; in POS it requires void. But for drafts, delete.
      updatedItems = activeOrder.items.filter((i) => i.id !== itemId);
    } else {
      updatedItems = activeOrder.items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i));
    }

    const updatedOrder = {
      ...activeOrder,
      items: updatedItems
    };

    const hasDrafts = updatedItems.some((i) => i.kitchenStatus === 'DRAFT');
    if (!hasDrafts) {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    }
    setActiveOrder(updatedOrder);
  };

  const removeItemFromOrder = (itemId: string) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedItems = activeOrder.items.filter((i) => i.id !== itemId);
    const updatedOrder = { ...activeOrder, items: updatedItems };
    const hasDrafts = updatedItems.some((i) => i.kitchenStatus === 'DRAFT');
    if (!hasDrafts) {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    }
    setActiveOrder(updatedOrder);
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedItems = activeOrder.items.map((i) => (i.id === itemId ? { ...i, notes } : i));
    const updatedOrder = { ...activeOrder, items: updatedItems };
    const hasDrafts = updatedItems.some((i) => i.kitchenStatus === 'DRAFT');
    if (!hasDrafts) {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    }
    setActiveOrder(updatedOrder);
  };

  const sendDraftsToKitchen = (): OrderItem[] => {
    if (!activeOrder) return [];

    const drafts = activeOrder.items.filter((i) => i.kitchenStatus === 'DRAFT');
    if (drafts.length === 0) return [];

    const now = new Date().toISOString();
    const updatedItems = activeOrder.items.map((item) =>
      item.kitchenStatus === 'DRAFT'
        ? {
            ...item,
            kitchenStatus: 'SENT_TO_KITCHEN' as const,
            sentAt: now
          }
        : item
    );

    const updatedOrder: Order = {
      ...activeOrder,
      items: updatedItems,
      status: 'PREPARING',
      takeawayStatus: activeOrder.type === 'TAKEAWAY' ? 'PREPARING' : activeOrder.takeawayStatus,
      payOnPickup: activeOrder.type === 'TAKEAWAY' ? true : activeOrder.payOnPickup,
      kitchenBumped: false
    };

    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updatedOrder.id);
      return exists ? prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)) : [updatedOrder, ...prev];
    });
    setActiveOrder(updatedOrder);

    // Return the items that were just sent for KOT display
    return drafts.map((d) => ({ ...d, sentAt: now }));
  };

  const printGuestCheck = (orderId: string): Order | null => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return null;

    if (targetOrder.tableId) {
      setTables((prev) =>
        prev.map((t) => (t.id === targetOrder.tableId ? { ...t, status: 'BILL_PRINTED' } : t))
      );
    }

    return targetOrder;
  };

  const settleOrder = (
    orderId: string,
    method: PaymentMethod,
    amount: number,
    tip: number,
    tendered?: number,
    changeDue?: number
  ): { order: Order; payment: PaymentRecord } => {
    const targetOrder = orders.find((o) => o.id === orderId) || (activeOrder?.id === orderId ? activeOrder : null);
    if (!targetOrder) throw new Error('Order not found');

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId,
      orderNumber: targetOrder.orderNumber,
      method,
      amount,
      tendered,
      changeDue,
      timestamp: new Date().toISOString()
    };

    const now = new Date().toISOString();
    // Auto-send any draft items to kitchen so KOT is always sent!
    const updatedItems = targetOrder.items.map((item) =>
      item.kitchenStatus === 'DRAFT'
        ? {
            ...item,
            kitchenStatus: 'SENT_TO_KITCHEN' as const,
            sentAt: now
          }
        : item
    );

    const allServed = updatedItems.length > 0 && updatedItems.every((i) => i.kitchenStatus === 'SERVED');
    const newStatus: OrderStatus = allServed ? 'COMPLETED' : 'PREPARING';

    const updatedOrder: Order = {
      ...targetOrder,
      items: updatedItems,
      tipAmount: tip,
      paymentStatus: 'PAID',
      status: newStatus,
      takeawayStatus: targetOrder.type === 'TAKEAWAY' ? (allServed ? 'READY_FOR_PICKUP' : 'PREPARING') : undefined,
      payOnPickup: false,
      kitchenBumped: false,
      closedAt: allServed ? now : undefined
    };

    // Update orders list
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === orderId);
      return exists ? prev.map((o) => (o.id === orderId ? updatedOrder : o)) : [updatedOrder, ...prev];
    });

    // Record payment
    setPaymentHistory((prev) => [payment, ...prev]);

    // Free table if dine-in AND all food was already served
    if (targetOrder.tableId && allServed) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === targetOrder.tableId
            ? {
                ...t,
                status: 'AVAILABLE',
                activeOrderId: undefined,
                seatedAt: undefined,
                guestCount: undefined,
                serverName: undefined
              }
            : t
        )
      );
    }

    // Update shift totals
    setShift((prev) => ({
      ...prev,
      totalRevenue: Number((prev.totalRevenue + amount).toFixed(2)),
      totalOrdersCount: prev.totalOrdersCount + 1,
      cashSales: method === 'CASH' ? Number((prev.cashSales + amount).toFixed(2)) : prev.cashSales,
      cardSales: method === 'CARD' ? Number((prev.cardSales + amount).toFixed(2)) : prev.cardSales,
      qrSales: method === 'QR' ? Number((prev.qrSales + amount).toFixed(2)) : prev.qrSales
    }));

    return { order: updatedOrder, payment };
  };

  const transferTable = (fromTableId: string, toTableId: string): boolean => {
    const fromTbl = tables.find((t) => t.id === fromTableId);
    const toTbl = tables.find((t) => t.id === toTableId);

    if (!fromTbl || !toTbl || !fromTbl.activeOrderId || toTbl.status !== 'AVAILABLE') {
      return false;
    }

    const orderId = fromTbl.activeOrderId;
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return false;

    // Update order reference
    const updatedOrder: Order = {
      ...targetOrder,
      tableId: toTbl.id,
      tableName: `${toTbl.name} (${toTbl.number})`
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // Update tables
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === fromTableId) {
          return {
            ...t,
            status: 'AVAILABLE',
            activeOrderId: undefined,
            seatedAt: undefined,
            guestCount: undefined,
            serverName: undefined
          };
        }
        if (t.id === toTableId) {
          return {
            ...t,
            status: fromTbl.status,
            activeOrderId: orderId,
            seatedAt: fromTbl.seatedAt,
            guestCount: fromTbl.guestCount,
            serverName: fromTbl.serverName
          };
        }
        return t;
      })
    );

    setActiveOrder(updatedOrder);
    return true;
  };

  const setOrderDiscount = (discountPercent: number) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedOrder = { ...activeOrder, discountPercent };
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setActiveOrder(updatedOrder);
  };

  const setOrderTip = (tipAmount: number) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedOrder = { ...activeOrder, tipAmount };
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setActiveOrder(updatedOrder);
  };

  const setOrderType = (type: OrderType, tableId?: string, tableName?: string) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedOrder: Order = {
      ...activeOrder,
      type,
      tableId,
      tableName: type === 'DINE_IN' ? tableName || 'Dine-In Table' : undefined,
      payOnPickup: type === 'TAKEAWAY' ? true : false
    };

    if (type === 'DINE_IN' && tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, status: 'OCCUPIED', activeOrderId: updatedOrder.id, seatedAt: new Date().toISOString() }
            : t
        )
      );
    }

    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setActiveOrder(updatedOrder);
  };

  const setOrderCustomer = (customerName?: string, token?: string) => {
    if (!activeOrder || activeOrder.paymentStatus === 'PAID') return;
    const updatedOrder: Order = {
      ...activeOrder,
      customerName: customerName || activeOrder.customerName,
      pickupToken: token !== undefined ? token : activeOrder.pickupToken
    };
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setActiveOrder(updatedOrder);
  };

  const clearActiveCart = () => {
    if (!activeOrder) return;
    // If order has no items sent to kitchen yet, delete it completely
    const hasSentItems = activeOrder.items.some((i) => i.kitchenStatus !== 'DRAFT');
    if (!hasSentItems) {
      setOrders((prev) => prev.filter((o) => o.id !== activeOrder.id));
      if (activeOrder.tableId) {
        setTables((prev) =>
          prev.map((t) => (t.id === activeOrder.tableId ? { ...t, status: 'AVAILABLE', activeOrderId: undefined } : t))
        );
      }
    }
    setActiveOrder(null);
  };

  const parkActiveOrder = (): OrderItem[] => {
    if (!activeOrder) return [];
    // Send all draft items to kitchen
    const sent = sendDraftsToKitchen();
    // Clear active drawer so next order is ready immediately!
    setActiveOrder(null);
    return sent;
  };

  const updateOrderItemStatus = (orderId: string, itemId: string, status: KitchenStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((i) => (i.id === itemId ? { ...i, kitchenStatus: status } : i));
        // Individual item cross-off on chef checklist does NOT mark the order as ready or close the ticket.
        // The KOT remains active until the chef explicitly clicks Mark Ready / Bump.
        return {
          ...order,
          items: updatedItems,
          status: order.status === 'OPEN' ? 'PREPARING' : order.status
        };
      })
    );
  };

  const markOrderCooking = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: 'PREPARING',
          takeawayStatus: order.type === 'TAKEAWAY' ? 'PREPARING' : order.takeawayStatus,
          // Apply cooking status to all items in the order commonly
          items: order.items.map((i) => ({ ...i, kitchenStatus: 'PREPARING' as const }))
        };
      })
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'PREPARING',
              items: prev.items.map((i) => ({ ...i, kitchenStatus: 'PREPARING' as const }))
            }
          : null
      );
    }
  };

  const bumpOrderKitchen = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const isPaid = order.paymentStatus === 'PAID';
        const isDineIn = order.type === 'DINE_IN';
        const isTakeaway = order.type === 'TAKEAWAY';
        const newStatus: OrderStatus = (isDineIn && isPaid) ? 'COMPLETED' : 'SERVED';

        return {
          ...order,
          status: newStatus,
          takeawayStatus: isTakeaway ? 'READY_FOR_PICKUP' : order.takeawayStatus,
          closedAt: (isDineIn && isPaid) ? new Date().toISOString() : order.closedAt,
          kitchenBumped: true,
          kitchenBumpedAt: new Date().toISOString(),
          items: order.items.map((i) => ({ ...i, kitchenStatus: 'SERVED' as const }))
        };
      })
    );

    // If dine in and already paid, free table
    setTables((prev) =>
      prev.map((tbl) => {
        if (tbl.activeOrderId === orderId) {
          const ord = orders.find((o) => o.id === orderId);
          if (ord && ord.paymentStatus === 'PAID') {
            return {
              ...tbl,
              status: 'AVAILABLE',
              activeOrderId: undefined,
              seatedAt: undefined,
              guestCount: undefined,
              serverName: undefined
            };
          }
        }
        return tbl;
      })
    );
  };

  const closeActiveOrderDrawer = () => {
    setActiveOrder(null);
  };

  const closeShiftSession = (_countedCash: number) => {
    setShift((prev) => ({
      ...prev,
      status: 'CLOSED',
      closedAt: new Date().toISOString()
    }));
  };

  const resetAllData = () => {
    setTables(INITIAL_TABLES);
    setOrders([]);
    setShift(INITIAL_SHIFT);
    setPaymentHistory([]);
    setActiveOrder(null);
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  };

  return (
    <POSContext.Provider
      value={{
        tables,
        products,
        categories,
        orders,
        activeOrder,
        currentMode,
        selectedSection,
        searchQuery,
        selectedCategory,
        shift,
        paymentHistory,
        setCurrentMode,
        setSelectedSection,
        setSearchQuery,
        setSelectedCategory,
        setActiveOrder,
        openTable,
        selectOrderForTable,
        startQuickSale,
        startTakeawayOrder,
        markTakeawayReady,
        markTakeawayCollected,
        updateTakeawayDetails,
        addItemToActiveOrder,
        updateItemQuantity,
        removeItemFromOrder,
        updateItemNotes,
        sendDraftsToKitchen,
        printGuestCheck,
        settleOrder,
        transferTable,
        setOrderDiscount,
        setOrderTip,
        setOrderType,
        setOrderCustomer,
        clearActiveCart,
        parkActiveOrder,
        updateOrderItemStatus,
        markOrderCooking,
        bumpOrderKitchen,
        closeActiveOrderDrawer,
        closeShiftSession,
        resetAllData
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
