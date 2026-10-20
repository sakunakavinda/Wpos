import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Search,
  Clock,
  Users,
  DollarSign,
  Receipt,
  CheckCircle,
  ArrowRight,
  Flame,
  ChefHat,
  ShoppingBag,
  UtensilsCrossed,
  PackageCheck,
  Lock
} from 'lucide-react';
import type { Order } from '../types/pos';

interface ActiveOrdersViewProps {
  onPaymentModal: (orderId: string) => void;
  onPrintGuestCheck: (orderId: string) => void;
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  onPaymentModal,
  onPrintGuestCheck
}) => {
  const {
    orders,
    setActiveOrder,
    setCurrentMode,
    markTakeawayCollected,
    markTakeawayReady
  } = usePOS();

  const [filter, setFilter] = useState<'ALL_ACTIVE' | 'DINE_IN' | 'TAKEAWAY' | 'COMPLETED'>('ALL_ACTIVE');
  const [query, setQuery] = useState('');

  const getElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diff / 60000));
  };

  // Determine if an order is active (either unpaid OR still being prepared / waiting for collection)
  const isOrderActive = (order: Order) => {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') return false;
    if (order.paymentStatus === 'UNPAID') return true;
    
    // If paid, it remains active if kitchen hasn't bumped it yet, or takeaway hasn't been collected
    if (!order.kitchenBumped) return true;
    if (order.type === 'TAKEAWAY' && order.takeawayStatus !== 'COLLECTED') return true;
    
    return false;
  };

  const activeOrders = orders.filter(isOrderActive);
  const completedOrders = orders.filter((o) => !isOrderActive(o));

  const filteredOrders = orders.filter((order) => {
    const active = isOrderActive(order);
    let matchesTab = true;

    if (filter === 'ALL_ACTIVE') matchesTab = active;
    else if (filter === 'DINE_IN') matchesTab = active && order.type === 'DINE_IN';
    else if (filter === 'TAKEAWAY') matchesTab = active && order.type === 'TAKEAWAY';
    else if (filter === 'COMPLETED') matchesTab = !active;

    const matchesSearch =
      query === '' ||
      order.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      (order.tableName && order.tableName.toLowerCase().includes(query.toLowerCase())) ||
      (order.customerName && order.customerName.toLowerCase().includes(query.toLowerCase())) ||
      (order.pickupToken && order.pickupToken.toLowerCase().includes(query.toLowerCase())) ||
      order.serverName.toLowerCase().includes(query.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="active-orders-container">
      {/* Top Filter and Search Bar */}
      <div className="orders-header-bar">
        <div className="orders-filter-tabs">
          <button
            className={`filter-tab-btn ${filter === 'ALL_ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilter('ALL_ACTIVE')}
            id="tab-all-active"
          >
            <span>All Active Orders</span>
            <span className="count-pill">{activeOrders.length}</span>
          </button>
          <button
            className={`filter-tab-btn ${filter === 'DINE_IN' ? 'active' : ''}`}
            onClick={() => setFilter('DINE_IN')}
            id="tab-dine-in"
          >
            <UtensilsCrossed size={14} />
            <span>Dine-In Tables</span>
            <span className="count-pill">
              {activeOrders.filter((o) => o.type === 'DINE_IN').length}
            </span>
          </button>
          <button
            className={`filter-tab-btn ${filter === 'TAKEAWAY' ? 'active' : ''}`}
            onClick={() => setFilter('TAKEAWAY')}
            id="tab-takeaway"
          >
            <ShoppingBag size={14} />
            <span>Takeaway Queue</span>
            <span className="count-pill">
              {activeOrders.filter((o) => o.type === 'TAKEAWAY').length}
            </span>
          </button>
          <button
            className={`filter-tab-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
            id="tab-completed"
          >
            <span>Settled History</span>
            <span className="count-pill">{completedOrders.length}</span>
          </button>
        </div>

        <div className="orders-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search orders by number, table, customer, token..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="orders-search-input"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-cards-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-orders-msg">
            <CheckCircle size={40} className="text-muted" />
            <h3>No orders found</h3>
            <p>
              {filter === 'COMPLETED'
                ? 'No settled orders yet in this session.'
                : 'All orders are settled and served, or no orders match your search criteria.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const discount = subtotal * (order.discountPercent / 100);
            const tax = (subtotal - discount) * order.taxRate;
            const total = subtotal - discount + tax + (order.tipAmount || 0);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const elapsed = getElapsed(order.createdAt);

            // Preparing state analysis
            const hasCookingItems = order.items.some((i) => i.kitchenStatus === 'PREPARING');
            const hasSentItems = order.items.some((i) => i.kitchenStatus === 'SENT_TO_KITCHEN');
            const hasDraftItems = order.items.some((i) => i.kitchenStatus === 'DRAFT');

            const isPaid = order.paymentStatus === 'PAID';
            const isTakeaway = order.type === 'TAKEAWAY';
            const isReady = !!order.kitchenBumped || order.takeawayStatus === 'READY_FOR_PICKUP' || order.status === 'SERVED';

            return (
              <div
                key={order.id}
                className={`order-summary-card ${isPaid ? 'card-paid' : 'card-unpaid'} ${hasCookingItems ? 'card-preparing' : ''}`}
                id={`order-card-${order.id}`}
              >
                {/* Header: Order ID, Type & Prominent Status Badges */}
                <div className="order-card-header">
                  <div className="order-card-id-block">
                    <span className="order-card-number">{order.orderNumber}</span>
                    <span className={`order-pill ${order.type.toLowerCase()}`}>
                      {isTakeaway ? (
                        <>
                          <ShoppingBag size={11} className="inline mr-1" />
                          {order.pickupToken || 'Takeaway'}
                        </>
                      ) : (
                        <>
                          <UtensilsCrossed size={11} className="inline mr-1" />
                          Dine-In
                        </>
                      )}
                    </span>
                  </div>

                  {/* Dual Status Badges: Payment Status + Preparing Status */}
                  <div className="order-badges-group">
                    {/* 1. Payment Status */}
                    <span className={`payment-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                      {isPaid ? '✓ Paid' : '● Unpaid'}
                    </span>

                    {/* 2. Preparing / Kitchen Status */}
                    {hasCookingItems ? (
                      <span className="prep-badge prep-cooking" title="Currently cooking in kitchen">
                        <Flame size={12} className="inline mr-1" />
                        Cooking
                      </span>
                    ) : hasSentItems ? (
                      <span className="prep-badge prep-sent" title="Order ticket sent to kitchen">
                        <ChefHat size={12} className="inline mr-1" />
                        Sent (KOT)
                      </span>
                    ) : isReady ? (
                      <span className="prep-badge prep-ready" title="Prepared and ready">
                        <CheckCircle size={12} className="inline mr-1" />
                        {isTakeaway ? 'Ready' : 'Served'}
                      </span>
                    ) : hasDraftItems ? (
                      <span className="prep-badge prep-draft">Draft</span>
                    ) : (
                      <span className="prep-badge prep-ready">Ready</span>
                    )}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="customer-row">
                    <span className="customer-title">
                      {order.tableName || order.customerName || 'Guest'}
                    </span>
                    {order.guestCount && (
                      <span className="guest-count">
                        <Users size={12} /> {order.guestCount} Pax
                      </span>
                    )}
                  </div>

                  <div className="meta-row">
                    <div className="meta-item">
                      <Clock size={12} />
                      <span>{elapsed}m ago</span>
                    </div>
                    <div className="meta-item">
                      <span>Server: {order.serverName}</span>
                    </div>
                    <div className="meta-item">
                      <span>{itemCount} items</span>
                    </div>
                  </div>

                  {/* Items snapshot with kitchen status */}
                  <div className="items-snapshot">
                    {order.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={`snapshot-pill ${item.kitchenStatus === 'SERVED' ? 'item-served' : ''}`}
                      >
                        {item.quantity}x {item.name}
                        {item.kitchenStatus === 'PREPARING' && ' 🔥'}
                        {item.kitchenStatus === 'SERVED' && ' ✓'}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="snapshot-more">+{order.items.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="total-display">
                    <span className="total-caption">Total Amount:</span>
                    <span className="total-val">${total.toFixed(2)}</span>
                  </div>

                  <div className="card-btn-group">
                    {/* If Unpaid, allow Open / Edit. If Paid, show View Bill (Read Only) */}
                    {!isPaid ? (
                      <button
                        className="order-btn edit-btn"
                        onClick={() => {
                          setActiveOrder(order);
                          setCurrentMode('REGISTER');
                        }}
                        title="Open Order in Register Drawer to Edit"
                      >
                        <span>Open / Edit</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        className="order-btn view-only-btn"
                        onClick={() => {
                          setActiveOrder(order);
                          setCurrentMode('REGISTER');
                        }}
                        title="View Settled Bill (Locked & Read Only)"
                      >
                        <Lock size={12} />
                        <span>View Bill</span>
                      </button>
                    )}

                    {/* If Takeaway & Ready but not collected */}
                    {isTakeaway && isReady && order.takeawayStatus !== 'COLLECTED' && isPaid && (
                      <button
                        className="order-btn collect-btn"
                        onClick={() => markTakeawayCollected(order.id)}
                        title="Customer Picked Up Food"
                      >
                        <PackageCheck size={14} />
                        <span>Collected</span>
                      </button>
                    )}

                    {/* Quick Ready bump if cooking and not ready */}
                    {isTakeaway && !isReady && (
                      <button
                        className="order-btn ready-quick-btn"
                        onClick={() => markTakeawayReady(order.id)}
                        title="Mark Prepared and Ready for Pickup"
                      >
                        <CheckCircle size={14} />
                        <span>Ready</span>
                      </button>
                    )}

                    {/* Pay Button for Unpaid orders */}
                    {!isPaid && (
                      <>
                        <button
                          className="order-btn check-btn"
                          onClick={() => onPrintGuestCheck(order.id)}
                          title="Mark Guest Check"
                        >
                          <Receipt size={14} />
                        </button>
                        <button
                          className="order-btn pay-btn"
                          onClick={() => onPaymentModal(order.id)}
                        >
                          <DollarSign size={14} />
                          <span>Pay Now</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
