import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { X, ShoppingBag, User, Phone, Bell, Clock } from 'lucide-react';

interface NewTakeawayModalProps {
  onClose: () => void;
}

export const NewTakeawayModal: React.FC<NewTakeawayModalProps> = ({ onClose }) => {
  const { startTakeawayOrder, setCurrentMode } = usePOS();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState(`Pickup #${Math.floor(1 + Math.random() * 30)}`);
  const [payOnPickup, setPayOnPickup] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTakeawayOrder(
      customerName.trim() || 'Takeaway Customer',
      phone.trim() || undefined,
      token.trim(),
      payOnPickup
    );
    setCurrentMode('REGISTER');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog takeaway-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>New Takeaway / Pickup Order</h3>
            <span className="modal-subtitle">Pay immediately or hold unpaid until food is packed</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Customer Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="tak-customer-name">
              <User size={14} />
              <span>Customer / Contact Name:</span>
            </label>
            <input
              id="tak-customer-name"
              type="text"
              placeholder="e.g. Jessica, Marcus, or Counter"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
              autoFocus
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="tak-phone">
              <Phone size={14} />
              <span>Mobile Phone (Optional for Pickup SMS):</span>
            </label>
            <input
              id="tak-phone"
              type="tel"
              placeholder="e.g. (555) 234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Pickup Token / Buzzer */}
          <div className="form-group">
            <label className="form-label" htmlFor="tak-token">
              <Bell size={14} />
              <span>Pickup Token / Buzzer Number:</span>
            </label>
            <input
              id="tak-token"
              type="text"
              placeholder="e.g. Buzzer #4, Token #12"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Payment Timing Selector */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} />
              <span>Payment Timing:</span>
            </label>
            <div className="payment-timing-cards">
              <div
                className={`timing-card ${payOnPickup ? 'selected' : ''}`}
                onClick={() => setPayOnPickup(true)}
              >
                <div className="timing-radio">
                  <span className={`radio-dot ${payOnPickup ? 'active' : ''}`} />
                </div>
                <div className="timing-info">
                  <strong>Pay on Pickup (Recommended)</strong>
                  <p>Customer pays at the counter when food is prepared & packed.</p>
                </div>
              </div>

              <div
                className={`timing-card ${!payOnPickup ? 'selected' : ''}`}
                onClick={() => setPayOnPickup(false)}
              >
                <div className="timing-radio">
                  <span className={`radio-dot ${!payOnPickup ? 'active' : ''}`} />
                </div>
                <div className="timing-info">
                  <strong>Pay Upfront Now</strong>
                  <p>Customer settles payment at the counter right after ordering.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <ShoppingBag size={16} />
              <span>Start Takeaway Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
