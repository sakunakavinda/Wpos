import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Flame,
  Receipt,
  CreditCard,
  MessageSquare,
  Users,
  AlertTriangle,
  Percent
} from 'lucide-react';
import type { OrderItem } from '../types/pos';

interface OrderDrawerProps {
  onPaymentModal: (orderId: string) => void;
  onPrintGuestCheck: (orderId: string) => void;
  onKOTModal: (newlySentItems: OrderItem[]) => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  onPaymentModal,
  onPrintGuestCheck,
  onKOTModal
}) => {
  const {
    activeOrder,
    closeActiveOrderDrawer,
    updateItemQuantity,
    removeItemFromOrder,
    updateItemNotes,
    sendDraftsToKitchen,
    setOrderDiscount,
    setOrderTip
  } = usePOS();

  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  if (!activeOrder) {
    return (
      <aside className="order-drawer empty-drawer">
        <div className="empty-cart-state">
          <div className="empty-cart-icon">🛒</div>
          <h3>No Active Order Selected</h3>
          <p>Select an occupied table from the Floor Map or pick items from the Quick Register to start an order.</p>
        </div>
      </aside>
    );
  }

  // Calculate pricing
  const subtotal = activeOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * (activeOrder.discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * activeOrder.taxRate;
  const grandTotal = discountedSubtotal + taxAmount + (activeOrder.tipAmount || 0);

  // Group items by status
  const draftItems = activeOrder.items.filter((i) => i.kitchenStatus === 'DRAFT');
  const activeKitchenItems = activeOrder.items.filter(
    (i) => i.kitchenStatus === 'SENT_TO_KITCHEN' || i.kitchenStatus === 'PREPARING'
  );
  const servedItems = activeOrder.items.filter((i) => i.kitchenStatus === 'SERVED');

  const handleSendToKitchen = () => {
    const newlySent = sendDraftsToKitchen();
    if (newlySent.length > 0) {
      onKOTModal(newlySent);
    }
  };

  const handleSaveNote = (itemId: string) => {
    updateItemNotes(itemId, noteText);
    setEditingNoteItemId(null);
    setNoteText('');
  };

  return (
    <aside className="order-drawer active-drawer" id="active-order-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-order-info">
          <div className="order-title-row">
            <span className="order-number-title">{activeOrder.orderNumber}</span>
            <span className={`order-type-badge ${activeOrder.type.toLowerCase()}`}>
              {activeOrder.type === 'DINE_IN' ? '🍽️ Dine-In' : '🛍️ Takeaway'}
            </span>
          </div>

          <div className="order-subtitle">
            {activeOrder.tableName ? (
              <span className="table-highlight">{activeOrder.tableName}</span>
            ) : (
              <span>Takeaway Customer</span>
            )}
            {activeOrder.guestCount && (
              <span className="guest-badge">
                <Users size={12} /> {activeOrder.guestCount} Guests
              </span>
            )}
          </div>
        </div>

        <button
          className="drawer-close-btn"
          onClick={closeActiveOrderDrawer}
          title="Minimize Cart"
        >
          <X size={18} />
        </button>
      </div>

      {/* Warning banner if unsent draft items exist */}
      {draftItems.length > 0 && activeOrder.type === 'DINE_IN' && (
        <div className="draft-alert-banner">
          <div className="draft-alert-text">
            <AlertTriangle size={15} />
            <span>{draftItems.length} new item(s) not yet sent to kitchen</span>
          </div>
          <button className="fire-kitchen-btn-mini" onClick={handleSendToKitchen}>
            <Flame size={14} /> Send KOT
          </button>
        </div>
      )}

      {/* Items Scrollable List */}
      <div className="drawer-items-list">
        {activeOrder.items.length === 0 ? (
          <div className="no-items-placeholder">
            <span>Ticket is currently empty.</span>
            <span className="subtext">Tap any food or drink to add to this order.</span>
          </div>
        ) : (
          <>
            {/* Draft Items Section */}
            {draftItems.length > 0 && (
              <div className="item-group-section draft-group">
                <div className="group-header">
                  <span className="dot dot-amber" />
                  <span>Draft Items (Pending Kitchen Send)</span>
                  <span className="group-count">{draftItems.length}</span>
                </div>
                {draftItems.map((item) => renderItemRow(item, true))}
              </div>
            )}

            {/* In Kitchen Section */}
            {activeKitchenItems.length > 0 && (
              <div className="item-group-section kitchen-group">
                <div className="group-header">
                  <span className="dot dot-purple" />
                  <span>In Kitchen / Preparing</span>
                  <span className="group-count">{activeKitchenItems.length}</span>
                </div>
                {activeKitchenItems.map((item) => renderItemRow(item, false))}
              </div>
            )}

            {/* Served Section */}
            {servedItems.length > 0 && (
              <div className="item-group-section served-group">
                <div className="group-header">
                  <span className="dot dot-green" />
                  <span>Served to Table</span>
                  <span className="group-count">{servedItems.length}</span>
                </div>
                {servedItems.map((item) => renderItemRow(item, false))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Discount & Tip Selectors */}
      <div className="drawer-adjustments">
        <div className="adjustment-row">
          <span className="adj-label">
            <Percent size={13} /> Discount:
          </span>
          <div className="pill-selector">
            {[0, 5, 10, 15, 20].map((disc) => (
              <button
                key={disc}
                className={`adj-pill ${activeOrder.discountPercent === disc ? 'active' : ''}`}
                onClick={() => setOrderDiscount(disc)}
              >
                {disc === 0 ? 'None' : `${disc}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="adjustment-row">
          <span className="adj-label">Tip / Gratuity:</span>
          <div className="pill-selector">
            {[
              { label: '0%', val: 0 },
              { label: '10%', val: Number((discountedSubtotal * 0.1).toFixed(2)) },
              { label: '15%', val: Number((discountedSubtotal * 0.15).toFixed(2)) },
              { label: '20%', val: Number((discountedSubtotal * 0.2).toFixed(2)) }
            ].map((tipOpt) => (
              <button
                key={tipOpt.label}
                className={`adj-pill ${activeOrder.tipAmount === tipOpt.val ? 'active' : ''}`}
                onClick={() => setOrderTip(tipOpt.val)}
              >
                {tipOpt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Pricing Summary */}
      <div className="drawer-summary">
        <div className="summary-line">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {activeOrder.discountPercent > 0 && (
          <div className="summary-line discount-line">
            <span>Discount ({activeOrder.discountPercent}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line">
          <span>Sales Tax (8%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        {activeOrder.tipAmount > 0 && (
          <div className="summary-line tip-line">
            <span>Gratuity / Tip</span>
            <span>+${activeOrder.tipAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line grand-total-line">
          <span>TOTAL DUE</span>
          <span className="grand-total-val">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="drawer-footer-actions">
        {activeOrder.type === 'DINE_IN' && draftItems.length > 0 && (
          <button
            className="footer-btn send-kot-btn"
            onClick={handleSendToKitchen}
            id="btn-send-kot"
          >
            <Flame size={17} />
            <span>Send to Kitchen ({draftItems.length})</span>
          </button>
        )}

        {activeOrder.type === 'DINE_IN' && (
          <button
            className="footer-btn guest-check-btn"
            onClick={() => onPrintGuestCheck(activeOrder.id)}
            id="btn-guest-check"
          >
            <Receipt size={17} />
            <span>Guest Check</span>
          </button>
        )}

        <button
          className="footer-btn pay-btn"
          onClick={() => onPaymentModal(activeOrder.id)}
          disabled={activeOrder.items.length === 0}
          id="btn-pay-now"
        >
          <CreditCard size={17} />
          <span>Pay & Settle (${grandTotal.toFixed(2)})</span>
        </button>
      </div>
    </aside>
  );

  // Helper renderer for item row
  function renderItemRow(item: OrderItem, isDraft: boolean) {
    const isEditingNote = editingNoteItemId === item.id;

    return (
      <div key={item.id} className="drawer-item-card">
        <div className="item-main-row">
          <div className="item-info">
            <span className="item-name">{item.name}</span>
            <span className="item-unit-price">${item.price.toFixed(2)} each</span>
          </div>

          <div className="item-qty-controls">
            <button
              className="qty-btn minus"
              onClick={() => updateItemQuantity(item.id, -1)}
            >
              <Minus size={13} />
            </button>
            <span className="qty-val">{item.quantity}</span>
            <button
              className="qty-btn plus"
              onClick={() => updateItemQuantity(item.id, 1)}
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="item-total-col">
            <span className="item-line-total">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            {isDraft && (
              <button
                className="item-delete-btn"
                onClick={() => removeItemFromOrder(item.id)}
                title="Remove Item"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Item Notes display or edit input */}
        <div className="item-notes-section">
          {item.notes && !isEditingNote && (
            <div className="item-note-badge">
              <MessageSquare size={11} />
              <span>{item.notes}</span>
              <button
                className="edit-note-btn"
                onClick={() => {
                  setEditingNoteItemId(item.id);
                  setNoteText(item.notes || '');
                }}
              >
                Edit
              </button>
            </div>
          )}

          {!item.notes && !isEditingNote && isDraft && (
            <button
              className="add-note-prompt"
              onClick={() => {
                setEditingNoteItemId(item.id);
                setNoteText('');
              }}
            >
              + Kitchen note / instructions
            </button>
          )}

          {isEditingNote && (
            <div className="note-input-row">
              <input
                type="text"
                placeholder="e.g. Medium Rare, No Onions, Extra Sauce..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                autoFocus
                className="note-input"
              />
              <button className="note-save-btn" onClick={() => handleSaveNote(item.id)}>
                Save
              </button>
              <button
                className="note-cancel-btn"
                onClick={() => setEditingNoteItemId(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
};
