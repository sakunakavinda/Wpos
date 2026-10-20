import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { TableView } from './components/TableView';
import { RegisterView } from './components/RegisterView';
import { ActiveOrdersView } from './components/ActiveOrdersView';
import { ShiftView } from './components/ShiftView';
import { OrderDrawer } from './components/OrderDrawer';

// Modals
import { OpenTableModal } from './components/modals/OpenTableModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { KOTModal } from './components/modals/KOTModal';
import { TransferTableModal } from './components/modals/TransferTableModal';

import type { RestaurantTable, Order, OrderItem, PaymentRecord } from './types/pos';
import './index.css';

const POSMain: React.FC = () => {
  const { currentMode, orders, printGuestCheck } = usePOS();

  // Modal states
  const [openTableTarget, setOpenTableTarget] = useState<RestaurantTable | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    order: Order;
    payment?: PaymentRecord;
    isPreBill?: boolean;
  } | null>(null);
  const [kotData, setKotData] = useState<{
    order: Order;
    items: OrderItem[];
  } | null>(null);
  const [transferTableSource, setTransferTableSource] = useState<RestaurantTable | null>(null);

  // Trigger pre-bill receipt modal
  const handlePrintGuestCheck = (orderId: string) => {
    const updatedOrder = printGuestCheck(orderId);
    if (updatedOrder) {
      setReceiptData({
        order: updatedOrder,
        isPreBill: true
      });
    }
  };

  // Trigger KOT modal when items are sent to kitchen
  const handleKOTModal = (newlySentItems: OrderItem[]) => {
    // Find corresponding order
    const parentOrder = orders.find((o) =>
      o.items.some((i) => newlySentItems.some((n) => n.id === i.id))
    );
    if (parentOrder) {
      setKotData({
        order: parentOrder,
        items: newlySentItems
      });
    }
  };

  // When payment is settled
  const handlePaymentSuccess = (order: Order, payment: PaymentRecord) => {
    setReceiptData({
      order,
      payment,
      isPreBill: false
    });
  };

  return (
    <div className="pos-app-layout">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Body */}
      <div className="pos-main-body">
        {/* Left / Center View Area */}
        <main className="pos-view-workspace">
          {currentMode === 'TABLES' && (
            <TableView
              onOpenTableModal={(table) => setOpenTableTarget(table)}
              onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
              onTransferModal={(table) => setTransferTableSource(table)}
              onPrintGuestCheck={handlePrintGuestCheck}
            />
          )}

          {currentMode === 'REGISTER' && <RegisterView />}

          {currentMode === 'ORDERS' && (
            <ActiveOrdersView
              onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
              onPrintGuestCheck={handlePrintGuestCheck}
            />
          )}

          {currentMode === 'ANALYTICS' && <ShiftView />}
        </main>

        {/* Right Cart / Active Order Drawer */}
        <OrderDrawer
          onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
          onPrintGuestCheck={handlePrintGuestCheck}
          onKOTModal={handleKOTModal}
        />
      </div>

      {/* MODALS */}
      {openTableTarget && (
        <OpenTableModal
          table={openTableTarget}
          onClose={() => setOpenTableTarget(null)}
        />
      )}

      {paymentOrderId && (
        <PaymentModal
          orderId={paymentOrderId}
          onClose={() => setPaymentOrderId(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {receiptData && (
        <ReceiptModal
          order={receiptData.order}
          payment={receiptData.payment}
          isPreBill={receiptData.isPreBill}
          onClose={() => setReceiptData(null)}
        />
      )}

      {kotData && (
        <KOTModal
          order={kotData.order}
          items={kotData.items}
          onClose={() => setKotData(null)}
        />
      )}

      {transferTableSource && (
        <TransferTableModal
          sourceTable={transferTableSource}
          onClose={() => setTransferTableSource(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <POSProvider>
      <POSMain />
    </POSProvider>
  );
}

export default App;
