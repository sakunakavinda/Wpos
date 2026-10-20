import React, { useState } from 'react';
import type { RestaurantTable } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { X, ArrowRightLeft, Check } from 'lucide-react';

interface TransferTableModalProps {
  sourceTable: RestaurantTable;
  onClose: () => void;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  sourceTable,
  onClose
}) => {
  const { tables, transferTable } = usePOS();
  const [targetTableId, setTargetTableId] = useState<string>('');

  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');

  const handleTransfer = () => {
    if (!targetTableId) return;
    const success = transferTable(sourceTable.id, targetTableId);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog transfer-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Transfer Table Tab</h3>
            <span className="modal-subtitle">
              Move unpaid order from <strong>{sourceTable.name} ({sourceTable.number})</strong>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="transfer-instruction">
            Select an available table to transfer all ordered items and the open tab to:
          </p>

          <div className="transfer-grid">
            {availableTables.length === 0 ? (
              <p className="no-tables-warn">No other tables are currently available.</p>
            ) : (
              availableTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`transfer-table-card ${targetTableId === t.id ? 'selected' : ''}`}
                  onClick={() => setTargetTableId(t.id)}
                >
                  <div className="t-card-top">
                    <span className="t-num">{t.number}</span>
                    {targetTableId === t.id && <Check size={16} className="text-brand" />}
                  </div>
                  <span className="t-name">{t.name}</span>
                  <span className="t-sec">{t.section} • {t.capacity} Pax</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-action"
            disabled={!targetTableId}
            onClick={handleTransfer}
          >
            <ArrowRightLeft size={16} />
            <span>Confirm Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
