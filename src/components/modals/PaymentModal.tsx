import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import type { PaymentMethod, PaymentRecord, Order } from '../../types/pos';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Users
} from 'lucide-react';

interface PaymentModalProps {
  orderId: string;
  onClose: () => void;
  onPaymentSuccess: (order: Order, payment: PaymentRecord) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  onClose,
  onPaymentSuccess
}) => {
  const { orders, settleOrder, setOrderTip } = usePOS();
  const order = orders.find((o) => o.id === orderId);

  if (!order) return null;

  // Calculation breakdown
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = subtotal * (order.discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * order.taxRate;
  
  const [tipAmount, setTipAmount] = useState<number>(order.tipAmount || 0);
  const totalAmount = discountedSubtotal + taxAmount + tipAmount;

  // Split bill state
  const [splitCount, setSplitCount] = useState<number>(1);

  // Payment method & cash tender state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>(totalAmount.toFixed(2));

  const splitShare = totalAmount / splitCount;
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  const handleQuickCash = (amt: number) => {
    setCashTendered(amt.toFixed(2));
  };

  const handleConfirmPayment = () => {
    const result = settleOrder(
      order.id,
      selectedMethod,
      totalAmount,
      tipAmount,
      selectedMethod === 'CASH' ? tenderedNum : totalAmount,
      selectedMethod === 'CASH' ? changeDue : 0
    );

    onPaymentSuccess(result.order, result.payment);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog payment-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Settle Order: {order.orderNumber}</h3>
            <span className="modal-subtitle">
              {order.tableName || order.customerName || 'Customer'} • Server: {order.serverName}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body payment-body">
          {/* Bill Overview & Split Selector */}
          <div className="payment-overview-card">
            <div className="overview-row">
              <span className="overview-label">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {order.discountPercent > 0 && (
              <div className="overview-row discount-text">
                <span>Discount ({order.discountPercent}%):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="overview-row">
              <span>Tax (8%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>

            {/* Tip selector */}
            <div className="overview-row tip-selector-row">
              <span>Gratuity / Tip:</span>
              <div className="tip-pill-group">
                {[
                  { label: '0%', val: 0 },
                  { label: '10%', val: Number((discountedSubtotal * 0.1).toFixed(2)) },
                  { label: '15%', val: Number((discountedSubtotal * 0.15).toFixed(2)) },
                  { label: '20%', val: Number((discountedSubtotal * 0.2).toFixed(2)) }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={`tip-btn ${tipAmount === opt.val ? 'active' : ''}`}
                    onClick={() => {
                      setTipAmount(opt.val);
                      setOrderTip(opt.val);
                      setCashTendered((discountedSubtotal + taxAmount + opt.val).toFixed(2));
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overview-row total-highlight">
              <span>TOTAL DUE:</span>
              <span className="total-highlight-val">${totalAmount.toFixed(2)}</span>
            </div>

            {/* Split Bill Option */}
            <div className="split-bill-section">
              <span className="split-label">
                <Users size={14} /> Split Bill:
              </span>
              <div className="split-btn-group">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`split-btn ${splitCount === count ? 'active' : ''}`}
                    onClick={() => setSplitCount(count)}
                  >
                    {count === 1 ? 'Single' : `${count} Ways`}
                  </button>
                ))}
              </div>
              {splitCount > 1 && (
                <div className="split-result-banner">
                  Each guest pays: <strong>${splitShare.toFixed(2)}</strong> (x{splitCount} guests)
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="method-tabs">
            <button
              type="button"
              className={`method-tab ${selectedMethod === 'CASH' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('CASH')}
            >
              <Banknote size={18} />
              <span>Cash Tender</span>
            </button>
            <button
              type="button"
              className={`method-tab ${selectedMethod === 'CARD' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('CARD')}
            >
              <CreditCard size={18} />
              <span>Credit / Debit</span>
            </button>
            <button
              type="button"
              className={`method-tab ${selectedMethod === 'QR' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('QR')}
            >
              <QrCode size={18} />
              <span>Mobile / QR</span>
            </button>
          </div>

          {/* Tender specifics */}
          {selectedMethod === 'CASH' && (
            <div className="cash-tender-box">
              <div className="quick-cash-row">
                <button
                  type="button"
                  className="quick-cash-btn exact"
                  onClick={() => handleQuickCash(totalAmount)}
                >
                  Exact (${totalAmount.toFixed(2)})
                </button>
                {[20, 50, 100].map((amt) => {
                  if (amt >= totalAmount) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        className="quick-cash-btn"
                        onClick={() => handleQuickCash(amt)}
                      >
                        ${amt} Bill
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="form-group cash-input-wrap">
                <label className="form-label">Cash Received ($):</label>
                <div className="input-with-symbol">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="form-input cash-tender-input"
                  />
                </div>
              </div>

              <div className={`change-due-box ${tenderedNum >= totalAmount ? 'change-positive' : 'change-short'}`}>
                <span className="change-label">Change to Return:</span>
                <span className="change-value">${changeDue.toFixed(2)}</span>
                {tenderedNum < totalAmount && (
                  <span className="short-warning">Short by ${(totalAmount - tenderedNum).toFixed(2)}</span>
                )}
              </div>
            </div>
          )}

          {selectedMethod === 'CARD' && (
            <div className="card-terminal-box">
              <div className="terminal-screen">
                <CreditCard size={36} className="terminal-icon" />
                <h4>Insert, Tap, or Swipe Card</h4>
                <p className="terminal-amount">${totalAmount.toFixed(2)}</p>
                <span className="terminal-status">Ready for Contactless / Chip</span>
              </div>
            </div>
          )}

          {selectedMethod === 'QR' && (
            <div className="qr-pay-box">
              <div className="qr-code-placeholder">
                <QrCode size={120} />
              </div>
              <p className="qr-instructions">Scan to pay with Apple Pay, Google Pay, or Banking App</p>
              <span className="qr-amount">${totalAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className="btn-primary-action settle-btn"
            disabled={selectedMethod === 'CASH' && tenderedNum < totalAmount}
            onClick={handleConfirmPayment}
            id="btn-confirm-payment"
          >
            <CheckCircle2 size={18} />
            <span>Complete & Print Receipt (${totalAmount.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
