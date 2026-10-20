import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Search,
  Clock,
  Users,
  DollarSign,
  Receipt,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface ActiveOrdersViewProps {
  onPaymentModal: (orderId: string) => void;
  onPrintGuestCheck: (orderId: string) => void;
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  onPaymentModal,
  onPrintGuestCheck
}) => {
  const { orders, setActiveOrder, setCurrentMode } = usePOS();
  const [filter, setFilter] = useState<'ALL_ACTIVE' | 'DINE_IN' | 'TAKEAWAY' | 'COMPLETED'>('ALL_ACTIVE');
  const [query, setQuery] = useState('');

  const getElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diff / 60000));
  };

  const filteredOrders = orders.filter((order) => {
    const isUnpaid = order.paymentStatus === 'UNPAID';
    let matchesTab = true;

    if (filter === 'ALL_ACTIVE') matchesTab = isUnpaid;
    else if (filter === 'DINE_IN') matchesTab = isUnpaid && order.type === 'DINE_IN';
    else if (filter === 'TAKEAWAY') matchesTab = isUnpaid && order.type === 'TAKEAWAY';
    else if (filter === 'COMPLETED') matchesTab = order.paymentStatus === 'PAID';

    const matchesSearch =
      query === '' ||
      order.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      (order.tableName && order.tableName.toLowerCase().includes(query.toLowerCase())) ||
      (order.customerName && order.customerName.toLowerCase().includes(query.toLowerCase())) ||
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
          >
            All Open Tabs ({orders.filter((o) => o.paymentStatus === 'UNPAID').length})
          </button>
          <button
            className={`filter-tab-btn ${filter === 'DINE_IN' ? 'active' : ''}`}
            onClick={() => setFilter('DINE_IN')}
          >
            Dine-In Tables
          </button>
          <button
            className={`filter-tab-btn ${filter === 'TAKEAWAY' ? 'active' : ''}`}
            onClick={() => setFilter('TAKEAWAY')}
          >
            Takeaways
          </button>
          <button
            className={`filter-tab-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Settled History
          </button>
        </div>

        <div className="orders-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search orders by number, table, customer..."
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
            <CheckCircle size={36} className="text-muted" />
            <h3>No orders found</h3>
            <p>All tables are settled or no orders match your search criteria.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
            const discount = subtotal * (order.discountPercent / 100);
            const tax = (subtotal - discount) * order.taxRate;
            const total = subtotal - discount + tax + (order.tipAmount || 0);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const elapsed = getElapsed(order.createdAt);

            return (
              <div
                key={order.id}
                className={`order-summary-card ${order.paymentStatus === 'PAID' ? 'completed' : 'unpaid'}`}
              >
                <div className="order-card-header">
                  <div className="order-card-id-block">
                    <span className="order-card-number">{order.orderNumber}</span>
                    <span className={`order-pill ${order.type.toLowerCase()}`}>
                      {order.type === 'DINE_IN' ? 'Dine-In' : 'Takeaway'}
                    </span>
                  </div>

                  <span
                    className={`payment-badge ${
                      order.paymentStatus === 'PAID' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {order.paymentStatus === 'PAID' ? '✓ Paid' : '● Unpaid'}
                  </span>
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

                  {/* Items snapshot */}
                  <div className="items-snapshot">
                    {order.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="snapshot-pill">
                        {item.quantity}x {item.name}
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
                    <button
                      className="order-btn edit-btn"
                      onClick={() => {
                        setActiveOrder(order);
                        setCurrentMode('REGISTER');
                      }}
                      title="Open Order in Register Drawer"
                    >
                      <span>Open Cart</span>
                      <ArrowRight size={13} />
                    </button>

                    {order.paymentStatus === 'UNPAID' && (
                      <>
                        <button
                          className="order-btn check-btn"
                          onClick={() => onPrintGuestCheck(order.id)}
                          title="Print Pre-Bill"
                        >
                          <Receipt size={14} />
                        </button>
                        <button
                          className="order-btn pay-btn"
                          onClick={() => onPaymentModal(order.id)}
                        >
                          <DollarSign size={14} />
                          <span>Pay</span>
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
