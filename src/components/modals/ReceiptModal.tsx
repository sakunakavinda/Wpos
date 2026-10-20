import React from 'react';
import type { Order, PaymentRecord } from '../../types/pos';
import { X, Printer } from 'lucide-react';

interface ReceiptModalProps {
  order: Order;
  payment?: PaymentRecord;
  isPreBill?: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  payment,
  isPreBill = false,
  onClose
}) => {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = subtotal * (order.discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * order.taxRate;
  const tipAmount = order.tipAmount || 0;
  const totalAmount = discountedSubtotal + taxAmount + tipAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog receipt-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>{isPreBill ? 'Guest Check (Pre-Bill)' : 'Customer Payment Receipt'}</h3>
            <span className="modal-subtitle">Formatted for standard 80mm thermal printer</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="receipt-scroll-container">
          {/* Thermal Receipt Paper Card */}
          <div className="thermal-receipt" id="printable-receipt">
            {/* Header */}
            <div className="receipt-header">
              <h2 className="receipt-brand">AURA BISTRO & BAR</h2>
              <p className="receipt-address">742 Evergreen Terrace, Suite 100</p>
              <p className="receipt-phone">Tel: (555) 234-5678 • VAT: US-9874521</p>
              <div className="receipt-divider-dashed" />
            </div>

            {/* Order Meta */}
            <div className="receipt-meta">
              <div className="meta-line">
                <span>Receipt #:</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="meta-line">
                <span>Date & Time:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="meta-line">
                <span>Type:</span>
                <span>{order.type === 'DINE_IN' ? 'DINE-IN' : 'TAKEAWAY'}</span>
              </div>
              {order.tableName && (
                <div className="meta-line">
                  <span>Table / Location:</span>
                  <strong>{order.tableName}</strong>
                </div>
              )}
              {order.customerName && (
                <div className="meta-line">
                  <span>Customer:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              <div className="meta-line">
                <span>Server / Cashier:</span>
                <span>{order.serverName}</span>
              </div>
              <div className="receipt-divider-dashed" />
            </div>

            {/* Items Table */}
            <div className="receipt-items-list">
              <div className="items-header-row">
                <span className="col-desc">ITEM</span>
                <span className="col-qty">QTY</span>
                <span className="col-price">TOTAL</span>
              </div>
              <div className="receipt-divider-dashed" />

              {order.items.map((item) => (
                <div key={item.id} className="receipt-item-row">
                  <div className="item-title-col">
                    <span className="name">{item.name}</span>
                    {item.notes && <span className="notes">({item.notes})</span>}
                  </div>
                  <span className="qty">{item.quantity}</span>
                  <span className="total">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="receipt-divider-dashed" />
            </div>

            {/* Financial Calculations */}
            <div className="receipt-totals">
              <div className="totals-row">
                <span>SUBTOTAL</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {order.discountPercent > 0 && (
                <div className="totals-row">
                  <span>DISCOUNT ({order.discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="totals-row">
                <span>TAX (8.00%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              {tipAmount > 0 && (
                <div className="totals-row">
                  <span>GRATUITY / TIP</span>
                  <span>+${tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="receipt-divider-double" />

              <div className="totals-row grand-total">
                <span>TOTAL DUE</span>
                <span className="amount">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="receipt-divider-double" />

              {/* Payment Settlement Info (If settled) */}
              {payment && !isPreBill && (
                <div className="receipt-payment-info">
                  <div className="totals-row">
                    <span>PAYMENT METHOD</span>
                    <span>{payment.method}</span>
                  </div>
                  {payment.tendered !== undefined && (
                    <div className="totals-row">
                      <span>CASH TENDERED</span>
                      <span>${payment.tendered.toFixed(2)}</span>
                    </div>
                  )}
                  {payment.changeDue !== undefined && payment.changeDue > 0 && (
                    <div className="totals-row change-line">
                      <span>CHANGE RETURNED</span>
                      <span>${payment.changeDue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="receipt-divider-dashed" />
                </div>
              )}
            </div>

            {/* Pre-Bill Gratuity Guide (if Pre-Bill) */}
            {isPreBill && (
              <div className="gratuity-guide">
                <p className="guide-title">--- SUGGESTED GRATUITY ---</p>
                <div className="guide-row">
                  <span>15% = ${(discountedSubtotal * 0.15).toFixed(2)}</span>
                  <span>18% = ${(discountedSubtotal * 0.18).toFixed(2)}</span>
                  <span>20% = ${(discountedSubtotal * 0.20).toFixed(2)}</span>
                </div>
                <div className="pre-bill-notice">
                  *** THIS IS A GUEST CHECK, NOT A TAX INVOICE ***
                </div>
              </div>
            )}

            {/* Barcode & Footer */}
            <div className="receipt-footer">
              <div className="barcode-mockup">
                |||| | |||||| || |||||||| |||| | ||| |||||||
              </div>
              <span className="barcode-number">{order.id}</span>
              <p className="thank-you">THANK YOU FOR DINING WITH US!</p>
              <p className="wifi-pass">WiFi: AURA-GUEST • Pass: welcome2026</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Done
          </button>
          <button type="button" className="btn-primary-action" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
