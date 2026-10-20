import React, { useState } from 'react';
import type { RestaurantTable } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { X, Users, User, Check } from 'lucide-react';

interface OpenTableModalProps {
  table: RestaurantTable;
  onClose: () => void;
}

export const OpenTableModal: React.FC<OpenTableModalProps> = ({ table, onClose }) => {
  const { openTable, setCurrentMode } = usePOS();
  const [guestCount, setGuestCount] = useState<number>(Math.min(2, table.capacity));
  const [customerName, setCustomerName] = useState<string>('');
  const [serverName, setServerName] = useState<string>('Alex Morgan');

  const servers = ['Alex Morgan', 'Sarah Jenkins', 'Liam Chen', 'Marcus Vance'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openTable(table.id, guestCount, customerName.trim() || undefined, serverName);
    setCurrentMode('REGISTER');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog open-table-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Seat Table: {table.number}</h3>
            <span className="modal-subtitle">{table.name} • {table.section} (Capacity: {table.capacity})</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Party Size / Guest Count */}
          <div className="form-group">
            <label className="form-label">
              <Users size={15} />
              <span>Number of Guests:</span>
            </label>
            <div className="guest-selector-row">
              {Array.from({ length: Math.min(10, Math.max(6, table.capacity)) }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`guest-count-btn ${guestCount === num ? 'selected' : ''}`}
                  onClick={() => setGuestCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Customer / Party Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="customer-name-input">
              <span>Customer / Tab Name (Optional):</span>
            </label>
            <input
              id="customer-name-input"
              type="text"
              placeholder="e.g. Harrison Party, Table Tab"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          {/* Server Selector */}
          <div className="form-group">
            <label className="form-label">
              <User size={15} />
              <span>Assigned Server:</span>
            </label>
            <div className="server-selector-row">
              {servers.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`server-btn ${serverName === s ? 'selected' : ''}`}
                  onClick={() => setServerName(s)}
                >
                  {serverName === s && <Check size={13} className="mr-1" />}
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>Open Tab & Start Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
