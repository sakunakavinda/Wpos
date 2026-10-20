import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { TableView } from './components/TableView';
import { RegisterView } from './components/RegisterView';
import { ActiveOrdersView } from './components/ActiveOrdersView';
import { ShiftView } from './components/ShiftView';
import { OrderDrawer } from './components/OrderDrawer';
import { TakeawayQueueBar } from './components/TakeawayQueueBar';

import { KitchenDisplay } from './components/KitchenDisplay';

// Modals
import { OpenTableModal } from './components/modals/OpenTableModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { TransferTableModal } from './components/modals/TransferTableModal';
import { NewTakeawayModal } from './components/modals/NewTakeawayModal';

import type { RestaurantTable } from './types/pos';
import './index.css';

const POSMain: React.FC = () => {
  const { currentMode, printGuestCheck } = usePOS();

  // Modal states
  const [openTableTarget, setOpenTableTarget] = useState<RestaurantTable | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [transferTableSource, setTransferTableSource] = useState<RestaurantTable | null>(null);
  const [isTakeawayModalOpen, setIsTakeawayModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if opened as dedicated standalone Kitchen Screen window (e.g. /?view=kitchen)
  const isStandaloneKitchen = window.location.search.includes('view=kitchen');

  // If dedicated kitchen window, render KitchenDisplay full screen immediately
  if (isStandaloneKitchen) {
    return <KitchenDisplay />;
  }

  // Handle guest check without printing receipt
  const handlePrintGuestCheck = (orderId: string) => {
    printGuestCheck(orderId);
    showToast('Table Bill Status marked. Ready for payment.');
  };

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleKOTModal = () => {
    showToast('👨‍🍳 Order sent to Kitchen Screen (KOT)!');
  };

  return (
    <div className="pos-app-layout">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Body */}
      {currentMode === 'KITCHEN' ? (
        <div className="pos-full-kitchen-view">
          <KitchenDisplay />
        </div>
      ) : (
        <div className="pos-main-body">
          {/* Left / Center View Area */}
          <main className="pos-view-workspace">
            {currentMode === 'REGISTER' && <RegisterView />}

            {currentMode === 'TABLES' && (
              <TableView
                onOpenTableModal={(table) => setOpenTableTarget(table)}
                onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
                onTransferModal={(table) => setTransferTableSource(table)}
                onPrintGuestCheck={handlePrintGuestCheck}
              />
            )}

            {currentMode === 'ORDERS' && (
              <>
                <TakeawayQueueBar
                  onNewTakeaway={() => setIsTakeawayModalOpen(true)}
                  onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
                />
                <ActiveOrdersView
                  onPaymentModal={(orderId) => setPaymentOrderId(orderId)}
                  onPrintGuestCheck={handlePrintGuestCheck}
                />
              </>
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
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="pos-global-toast" role="alert">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODALS */}
      {isTakeawayModalOpen && (
        <NewTakeawayModal onClose={() => setIsTakeawayModalOpen(false)} />
      )}
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
          onPaymentSuccess={() => {
            showToast('✅ Payment settled successfully!');
          }}
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
