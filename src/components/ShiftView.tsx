import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  DollarSign,
  CreditCard,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Archive
} from 'lucide-react';

export const ShiftView: React.FC = () => {
  const { shift, orders, closeShiftSession, paymentHistory } = usePOS();
  const [countedCashInput, setCountedCashInput] = useState('');

  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'UNPAID');
  const expectedCashInDrawer = shift.openingFloat + shift.cashSales;
  const countedNum = parseFloat(countedCashInput) || 0;
  const variance = countedNum - expectedCashInDrawer;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (unpaidOrders.length > 0) {
      if (
        !confirm(
          `There are still ${unpaidOrders.length} unpaid tables/orders! Are you sure you want to close this shift?`
        )
      ) {
        return;
      }
    }
    closeShiftSession(countedNum);
  };

  return (
    <div className="shift-view-container">
      {/* Shift Header Summary */}
      <div className="shift-header-card">
        <div className="shift-header-left">
          <h2>Cash Register Session & Shift Drawer</h2>
          <div className="shift-meta-pills">
            <span className="meta-pill">
              <User size={13} />
              <span>Cashier: <strong>{shift.cashierName}</strong></span>
            </span>
            <span className="meta-pill">
              <Clock size={13} />
              <span>Opened: {new Date(shift.openedAt).toLocaleTimeString()}</span>
            </span>
            <span className={`status-pill ${shift.status === 'OPEN' ? 'pill-available' : 'pill-reserved'}`}>
              ● Session {shift.status}
            </span>
          </div>
        </div>

        <div className="shift-header-right">
          <div className="total-revenue-badge">
            <span className="label">TOTAL REVENUE TODAY</span>
            <span className="value">${shift.totalRevenue.toFixed(2)}</span>
            <span className="sub">{shift.totalOrdersCount} Completed Orders</span>
          </div>
        </div>
      </div>

      {/* Unpaid Orders Alert */}
      {unpaidOrders.length > 0 && (
        <div className="unpaid-warning-box">
          <AlertTriangle size={20} className="warning-icon" />
          <div className="warning-content">
            <h4>Attention: {unpaidOrders.length} Active Tables / Orders Remain Unpaid</h4>
            <p>
              Orders at {unpaidOrders.map((o) => o.tableName || o.orderNumber).slice(0, 4).join(', ')}
              {unpaidOrders.length > 4 ? ` and ${unpaidOrders.length - 4} more` : ''} are still open.
              Customer tabs must be settled or transferred before final end-of-day drawer lock.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="shift-metrics-grid">
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Opening Cash Float</span>
            <Archive size={18} className="metric-icon" />
          </div>
          <span className="metric-number">${shift.openingFloat.toFixed(2)}</span>
          <span className="metric-sub">Base change in drawer</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Cash Sales</span>
            <DollarSign size={18} className="metric-icon" />
          </div>
          <span className="metric-number text-green">${shift.cashSales.toFixed(2)}</span>
          <span className="metric-sub">Collected today</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Card Payments</span>
            <CreditCard size={18} className="metric-icon" />
          </div>
          <span className="metric-number text-blue">${shift.cardSales.toFixed(2)}</span>
          <span className="metric-sub">Visa, Mastercard, Amex</span>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Digital / QR Sales</span>
            <QrCode size={18} className="metric-icon" />
          </div>
          <span className="metric-number text-purple">${shift.qrSales.toFixed(2)}</span>
          <span className="metric-sub">Apple Pay, Mobile QR</span>
        </div>
      </div>

      {/* Cash Drawer Reconciliation */}
      <div className="drawer-reconciliation-section">
        <div className="reconciliation-card">
          <div className="card-top">
            <h3>Cash Drawer Reconciliation</h3>
            <span className="subtitle">Count and balance actual cash against expected drawer total</span>
          </div>

          <div className="calculation-breakdown">
            <div className="calc-row">
              <span>Opening Float:</span>
              <span>${shift.openingFloat.toFixed(2)}</span>
            </div>
            <div className="calc-row">
              <span>+ Cash Sales Collected:</span>
              <span>+${shift.cashSales.toFixed(2)}</span>
            </div>
            <div className="calc-divider" />
            <div className="calc-row expected-row">
              <strong>EXPECTED CASH IN DRAWER:</strong>
              <strong className="expected-val">${expectedCashInDrawer.toFixed(2)}</strong>
            </div>
          </div>

          <form onSubmit={handleCloseShift} className="reconciliation-form">
            <div className="form-group">
              <label className="form-label">Actual Cash Counted in Drawer ($):</label>
              <div className="input-with-symbol">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 435.00"
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {countedCashInput && (
              <div
                className={`variance-box ${
                  Math.abs(variance) < 0.01
                    ? 'balanced'
                    : variance > 0
                    ? 'overage'
                    : 'shortage'
                }`}
              >
                <div className="variance-title">
                  {Math.abs(variance) < 0.01 ? (
                    <>
                      <CheckCircle size={18} />
                      <span>Drawer Balanced! Exact Match.</span>
                    </>
                  ) : variance > 0 ? (
                    <>
                      <CheckCircle size={18} />
                      <span>Cash Overage: +${variance.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={18} />
                      <span>Cash Shortage: -${Math.abs(variance).toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary-action close-shift-btn"
              disabled={!countedCashInput || shift.status === 'CLOSED'}
            >
              <span>{shift.status === 'CLOSED' ? 'Shift Closed' : 'End Cashier Shift & Lock Drawer'}</span>
            </button>
          </form>
        </div>

        {/* Recent Transactions List */}
        <div className="recent-payments-card">
          <h3>Recent Shift Payments</h3>
          <div className="recent-payments-list">
            {paymentHistory.length === 0 ? (
              <p className="no-payments">No payments recorded in this session yet.</p>
            ) : (
              paymentHistory.slice(0, 8).map((pay) => (
                <div key={pay.id} className="payment-log-item">
                  <div className="log-left">
                    <span className="log-order">{pay.orderNumber}</span>
                    <span className="log-time">{new Date(pay.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="log-right">
                    <span className="log-method">{pay.method}</span>
                    <span className="log-amount">${pay.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
