import React from 'react';
import type { OrderItem, Order } from '../../types/pos';
import { X, Flame, Printer } from 'lucide-react';

interface KOTModalProps {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
}

export const KOTModal: React.FC<KOTModalProps> = ({ order, items, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-dialog kot-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="text-flame">
              <Flame size={20} className="inline mr-2" />
              Kitchen Order Ticket (KOT)
            </h3>
            <span className="modal-subtitle">Sent to Kitchen Printer & Kitchen Display System (KDS)</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="kot-ticket-container">
          <div className="kot-slip">
            <div className="kot-slip-header">
              <h2>*** KITCHEN TICKET ***</h2>
              <div className="kot-meta-grid">
                <div>
                  <span className="label">TABLE:</span>
                  <span className="val bold-large">{order.tableName || 'TAKEAWAY'}</span>
                </div>
                <div>
                  <span className="label">ORDER #:</span>
                  <span className="val">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="label">SERVER:</span>
                  <span className="val">{order.serverName}</span>
                </div>
                <div>
                  <span className="label">TIME:</span>
                  <span className="val">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="kot-divider" />
            </div>

            <div className="kot-items-list">
              {items.map((item) => (
                <div key={item.id} className="kot-item-entry">
                  <div className="kot-item-top">
                    <span className="kot-qty">{item.quantity}x</span>
                    <span className="kot-name">{item.name}</span>
                  </div>
                  {item.notes && (
                    <div className="kot-chef-note">
                      *** NOTE: {item.notes} ***
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="kot-slip-footer">
              <div className="kot-divider" />
              <p>*** END OF ROUND ***</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Dismiss
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => {
              window.print();
            }}
          >
            <Printer size={16} />
            <span>Print Kitchen Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
