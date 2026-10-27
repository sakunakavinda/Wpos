import React from 'react';
import { usePOS } from '../context/POSContext';
import type { TableSection, RestaurantTable } from '../types/pos';
import {
  Users,
  Clock,
  Receipt,
  ArrowRightLeft,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Lock,
  Bookmark
} from 'lucide-react';

interface TableViewProps {
  onOpenTableModal: (table: RestaurantTable) => void;
  onPaymentModal: (orderId: string) => void;
  onTransferModal: (table: RestaurantTable) => void;
  onPrintGuestCheck: (orderId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  onOpenTableModal,
  onPaymentModal,
  onTransferModal,
  onPrintGuestCheck
}) => {
  const {
    tables,
    orders,
    selectedSection,
    setSelectedSection,
    searchQuery,
    selectOrderForTable,
    reserveTable,
    cancelReservation
  } = usePOS();

  const sections: (TableSection | 'All')[] = [
    'All',
    'Main Floor',
    'Patio Garden',
    'Bar Counter',
    'VIP Lounge'
  ];

  // Filtering
  const filteredTables = tables.filter((table) => {
    const matchesSection = selectedSection === 'All' || table.section === selectedSection;
    const matchesSearch =
      searchQuery === '' ||
      table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.serverName && table.serverName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  // Calculate elapsed time helper
  const getElapsedMinutes = (seatedAt?: string) => {
    if (!seatedAt) return 0;
    const diffMs = Date.now() - new Date(seatedAt).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  // Status stats
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const billPrintedCount = tables.filter((t) => t.status === 'BILL_PRINTED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="table-view-container">
      {/* Top Section Tabs & Quick Stats Bar */}
      <div className="table-header-bar">
        <div className="section-tabs">
          {sections.map((sec) => (
            <button
              key={sec}
              className={`section-tab-btn ${selectedSection === sec ? 'active' : ''}`}
              onClick={() => setSelectedSection(sec)}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="table-stats-bar">
          <div className="stat-badge available">
            <span className="dot dot-green" />
            <span>{availableCount} Free</span>
          </div>
          <div className="stat-badge occupied">
            <span className="dot dot-amber" />
            <span>{occupiedCount} Occupied</span>
          </div>
          <div className="stat-badge bill-printed">
            <span className="dot dot-blue" />
            <span>{billPrintedCount} Pre-Billed</span>
          </div>
          {reservedCount > 0 && (
            <div className="stat-badge reserved">
              <span className="dot dot-purple" />
              <span>{reservedCount} Reserved</span>
            </div>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {filteredTables.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.activeOrderId);
          const elapsed = getElapsedMinutes(table.seatedAt);

          // Calculate current balance
          let orderTotal = 0;
          let itemsCount = 0;
          if (activeOrder) {
            itemsCount = activeOrder.items.reduce((sum, item) => sum + item.quantity, 0);
            const subtotal = activeOrder.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );
            const discount = subtotal * (activeOrder.discountPercent / 100);
            const tax = (subtotal - discount) * activeOrder.taxRate;
            orderTotal = subtotal - discount + tax + (activeOrder.tipAmount || 0);
          }

          return (
            <div
              key={table.id}
              className={`table-card status-${table.status.toLowerCase()}`}
              id={`table-card-${table.id}`}
            >
              {/* Card Top: Number, Section & Capacity */}
              <div className="table-card-top">
                <div className="table-info-left">
                  <span className="table-number">{table.number}</span>
                  <span className="table-name">{table.name}</span>
                </div>
                <div className="table-info-right">
                  <span className="capacity-badge">
                    <Users size={12} />
                    <span>{table.capacity}</span>
                  </span>
                  <span className={`status-pill pill-${table.status.toLowerCase()}`}>
                    {table.status === 'AVAILABLE' && 'Available'}
                    {table.status === 'OCCUPIED' && 'Occupied'}
                    {table.status === 'BILL_PRINTED' && 'Bill Printed'}
                    {table.status === 'RESERVED' && 'Reserved'}
                  </span>
                </div>
              </div>

              {/* Card Middle: State details */}
              <div className="table-card-middle">
                {table.status === 'AVAILABLE' && (
                  <div className="available-state">
                    <div className="available-icon">
                      <CheckCircle2 size={32} />
                    </div>
                    <span className="available-label">Table Ready to Seat</span>
                    <div className="available-btn-group">
                      <button
                        className="btn-seat-table"
                        onClick={() => onOpenTableModal(table)}
                        id={`btn-seat-${table.id}`}
                      >
                        <PlusCircle size={15} />
                        <span>Seat & Open</span>
                      </button>
                      <button
                        type="button"
                        className="btn-reserve-quick"
                        onClick={() => reserveTable(table.id)}
                        id={`btn-reserve-${table.id}`}
                        title="Mark table as reserved"
                      >
                        <Bookmark size={14} />
                        <span>Reserve</span>
                      </button>
                    </div>
                  </div>
                )}

                {(table.status === 'OCCUPIED' || table.status === 'BILL_PRINTED') && activeOrder && (
                  <div className="occupied-state">
                    <div className="party-details">
                      <span className="party-name">{activeOrder.customerName || 'Dine-In Guest'}</span>
                      <span className="order-number-tag">{activeOrder.orderNumber}</span>
                    </div>

                    <div className="order-live-stats">
                      <div className="live-stat-item">
                        <Clock size={13} />
                        <span>{elapsed}m seated</span>
                      </div>
                      <div className="live-stat-item">
                        <span>{itemsCount} items</span>
                      </div>
                      <div className="live-stat-item server">
                        <span>{table.serverName || 'Staff'}</span>
                      </div>
                    </div>

                    <div className="table-total-row">
                      <span className="total-label">Unpaid Total:</span>
                      <span className="total-value">${orderTotal.toFixed(2)}</span>
                    </div>

                    {table.status === 'BILL_PRINTED' && (
                      <div className="bill-printed-alert">
                        <AlertCircle size={13} />
                        <span>Check presented to guest</span>
                      </div>
                    )}
                  </div>
                )}

                {table.status === 'RESERVED' && (
                  <div className="reserved-state">
                    <span className="reserved-label">Reserved for VIP Party</span>
                    <div className="reserved-btn-group">
                      <button
                        className="btn-seat-table secondary"
                        onClick={() => onOpenTableModal(table)}
                        id={`btn-checkin-${table.id}`}
                      >
                        <span>Check-In Guest</span>
                      </button>
                      <button
                        type="button"
                        className="btn-release-reservation"
                        onClick={() => cancelReservation(table.id)}
                        id={`btn-release-${table.id}`}
                        title="Cancel reservation and make table available"
                      >
                        <span>Release</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              {(table.status === 'OCCUPIED' || table.status === 'BILL_PRINTED') && activeOrder && (
                <div className="table-card-actions">
                  {activeOrder.paymentStatus !== 'PAID' ? (
                    <>
                      <button
                        className="action-btn open-tab"
                        title="Open Table Cart & Add Items"
                        onClick={() => selectOrderForTable(table.id)}
                      >
                        <span>Add Items / Cart</span>
                      </button>

                      <button
                        className="action-btn print-bill"
                        title="Print Guest Check"
                        onClick={() => onPrintGuestCheck(activeOrder.id)}
                      >
                        <Receipt size={14} />
                        <span>Check</span>
                      </button>

                      <button
                        className="action-btn transfer"
                        title="Move Order to Another Table"
                        onClick={() => onTransferModal(table)}
                      >
                        <ArrowRightLeft size={14} />
                      </button>

                      <button
                        className="action-btn pay-now"
                        title="Settle Payment"
                        onClick={() => onPaymentModal(activeOrder.id)}
                      >
                        <DollarSign size={14} />
                        <span>Pay</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn view-tab"
                      title="View Settled Bill (Locked & Read Only)"
                      onClick={() => selectOrderForTable(table.id)}
                    >
                      <Lock size={13} />
                      <span>View Paid Bill</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
