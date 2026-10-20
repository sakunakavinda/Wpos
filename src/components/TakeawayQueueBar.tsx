import React from 'react';
import { usePOS } from '../context/POSContext';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
  Bell,
  PackageCheck
} from 'lucide-react';

interface TakeawayQueueBarProps {
  onNewTakeaway: () => void;
  onPaymentModal: (orderId: string) => void;
}

export const TakeawayQueueBar: React.FC<TakeawayQueueBarProps> = ({
  onNewTakeaway,
  onPaymentModal
}) => {
  const {
    orders,
    setActiveOrder,
    setCurrentMode,
    markTakeawayReady,
    markTakeawayCollected
  } = usePOS();

  // Active takeaway orders that are not yet closed/collected (both paid-in-prep and unpaid)
  const activeTakeaways = orders.filter(
    (o) =>
      o.type === 'TAKEAWAY' &&
      (o.paymentStatus === 'UNPAID' ||
        o.status === 'PREPARING' ||
        o.takeawayStatus === 'PREPARING' ||
        o.takeawayStatus === 'READY_FOR_PICKUP') &&
      o.takeawayStatus !== 'COLLECTED'
  );

  const getElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diff / 60000));
  };

  return (
    <div className="takeaway-queue-container">
      <div className="queue-header">
        <div className="queue-title-left">
          <ShoppingBag size={18} className="text-amber" />
          <span className="queue-title">Takeaway Pickup Queue</span>
          <span className="queue-badge">{activeTakeaways.length} Active in Kitchen / Counter</span>
        </div>

        <button className="btn-new-takeaway" onClick={onNewTakeaway} id="btn-create-takeaway">
          <Plus size={15} />
          <span>+ New Takeaway Tab</span>
        </button>
      </div>

      <div className="takeaway-cards-scroll">
        {activeTakeaways.length === 0 ? (
          <div className="empty-queue-msg">
            <CheckCircle size={16} />
            <span>No pending takeaway orders waiting for preparation or pickup.</span>
          </div>
        ) : (
          activeTakeaways.map((order) => {
            const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const discount = subtotal * (order.discountPercent / 100);
            const tax = (subtotal - discount) * order.taxRate;
            const total = subtotal - discount + tax + (order.tipAmount || 0);
            const elapsed = getElapsed(order.createdAt);
            const isReady = order.takeawayStatus === 'READY_FOR_PICKUP' || order.items.every(i => i.kitchenStatus === 'SERVED');
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <div
                key={order.id}
                className={`takeaway-queue-card ${isReady ? 'ready' : 'preparing'}`}
              >
                <div className="card-top-line">
                  <span className="token-tag">
                    <Bell size={12} />
                    <strong>{order.pickupToken || order.orderNumber}</strong>
                  </span>

                  <div className="card-status-badges">
                    <span className={`payment-mini-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                      {isPaid ? '✓ Paid' : '● Pay on Pickup'}
                    </span>
                    <span className={`status-pill ${isReady ? 'pill-available' : 'pill-occupied'}`}>
                      {isReady ? 'Ready for Pickup' : 'Cooking in Kitchen'}
                    </span>
                  </div>
                </div>

                <div className="card-customer-line">
                  <span className="customer-name">{order.customerName || 'Customer'}</span>
                  {order.customerPhone && <span className="customer-phone">{order.customerPhone}</span>}
                </div>

                <div className="card-meta-line">
                  <span className="meta-time">
                    <Clock size={12} /> {elapsed}m ago
                  </span>
                  <span className="meta-items">{order.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                  <span className="meta-price">${total.toFixed(2)}</span>
                </div>

                <div className="card-action-buttons">
                  {!isReady && (
                    <button
                      className="btn-card-action ready-btn"
                      onClick={() => markTakeawayReady(order.id)}
                      title="Mark Food as Prepared & Ready"
                    >
                      <CheckCircle size={13} />
                      <span>Ready</span>
                    </button>
                  )}

                  {isReady && isPaid && (
                    <button
                      className="btn-card-action collect-btn"
                      onClick={() => markTakeawayCollected(order.id)}
                      title="Guest Picked Up Order"
                    >
                      <PackageCheck size={13} />
                      <span>Collected</span>
                    </button>
                  )}

                  <button
                    className="btn-card-action edit-btn"
                    onClick={() => {
                      setActiveOrder(order);
                      setCurrentMode('REGISTER');
                    }}
                    title="Open in Cart Drawer"
                  >
                    <span>Edit</span>
                    <ArrowRight size={13} />
                  </button>

                  {!isPaid && (
                    <button
                      className="btn-card-action pay-pickup-btn"
                      onClick={() => onPaymentModal(order.id)}
                      title="Customer Arrived - Collect Payment"
                    >
                      <DollarSign size={13} />
                      <span>Pay on Pickup</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
