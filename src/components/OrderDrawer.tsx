import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Plus,
  Minus,
  Trash2,
  Flame,
  Receipt,
  CreditCard,
  MessageSquare,
  Percent,
  ShoppingBag,
  RotateCcw,
  UtensilsCrossed,
  Tag,
  Lock,
  CheckCircle2
} from 'lucide-react';
import type { OrderItem, OrderType } from '../types/pos';

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
    tables,
    updateItemQuantity,
    removeItemFromOrder,
    updateItemNotes,
    setOrderDiscount,
    setOrderType,
    setOrderCustomer,
    clearActiveCart,
    parkActiveOrder,
    sendDraftsToKitchen
  } = usePOS();

  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Calculate pricing if order exists
  const items = activeOrder?.items || [];
  const isPaid = activeOrder?.paymentStatus === 'PAID';
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountPercent = activeOrder?.discountPercent || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = activeOrder?.taxRate || 0.08;
  const taxAmount = discountedSubtotal * taxRate;
  const tipAmount = activeOrder?.tipAmount || 0;
  const grandTotal = discountedSubtotal + taxAmount + tipAmount;

  const draftItems = items.filter((i) => i.kitchenStatus === 'DRAFT');
  const activeKitchenItems = items.filter(
    (i) => i.kitchenStatus === 'SENT_TO_KITCHEN' || i.kitchenStatus === 'PREPARING'
  );
  const servedItems = items.filter((i) => i.kitchenStatus === 'SERVED');

  const handleHoldAndPayLater = () => {
    const newlySent = parkActiveOrder();
    if (newlySent.length > 0) {
      onKOTModal(newlySent);
    }
  };

  const handlePayNow = () => {
    if (!activeOrder) return;
    const newlySent = sendDraftsToKitchen();
    if (newlySent.length > 0) {
      onKOTModal(newlySent);
    }
    onPaymentModal(activeOrder.id);
  };

  const handleSaveCustomerInfo = () => {
    setOrderCustomer(customerNameInput.trim() || undefined, tokenInput.trim() || undefined);
    setIsEditingCustomer(false);
  };

  const handleSaveNote = (itemId: string) => {
    updateItemNotes(itemId, noteText);
    setEditingNoteItemId(null);
    setNoteText('');
  };

  const handleTypeChange = (newType: OrderType) => {
    if (newType === 'DINE_IN') {
      // Find first available table or default
      const firstAvail = tables.find((t) => t.status === 'AVAILABLE') || tables[0];
      setOrderType('DINE_IN', firstAvail.id, `${firstAvail.name} (${firstAvail.number})`);
    } else {
      setOrderType('TAKEAWAY');
    }
  };

  return (
    <aside className="order-drawer active-drawer" id="active-order-drawer">
      {/* Drawer Header: Order ID, Type Switch & Quick Actions */}
      <div className="drawer-header">
        <div className="drawer-order-info">
          <div className="order-title-row">
            <span className="order-number-title">
              {activeOrder ? activeOrder.orderNumber : 'New Order'}
            </span>

            {isPaid ? (
              <span className="drawer-locked-pill">
                <Lock size={12} /> Closed Bill (Paid)
              </span>
            ) : (
              /* Simple Order Type Switch */
              <div className="order-type-switch">
                <button
                  type="button"
                  className={`type-switch-btn ${(!activeOrder || activeOrder.type === 'TAKEAWAY') ? 'active' : ''}`}
                  onClick={() => handleTypeChange('TAKEAWAY')}
                >
                  <ShoppingBag size={13} />
                  <span>Takeaway</span>
                </button>
                <button
                  type="button"
                  className={`type-switch-btn ${activeOrder?.type === 'DINE_IN' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('DINE_IN')}
                >
                  <UtensilsCrossed size={13} />
                  <span>Dine-In</span>
                </button>
              </div>
            )}
          </div>

          {/* Table / Customer inline row */}
          {isPaid ? (
            <div className="order-subtitle-row">
              <span className="locked-destination-info">
                {activeOrder?.type === 'DINE_IN'
                  ? (activeOrder.tableName || 'Dine-In Table')
                  : (activeOrder?.pickupToken || activeOrder?.customerName || 'Takeaway')}
              </span>
              <span className="locked-server-info">Server: {activeOrder?.serverName}</span>
            </div>
          ) : (
            <div className="order-subtitle-row">
              {activeOrder?.type === 'DINE_IN' ? (
                <div className="table-inline-picker">
                  <span className="picker-label">Table:</span>
                  <select
                    value={activeOrder.tableId || ''}
                    onChange={(e) => {
                      const tbl = tables.find((t) => t.id === e.target.value);
                      if (tbl) {
                        setOrderType('DINE_IN', tbl.id, `${tbl.name} (${tbl.number})`);
                      }
                    }}
                    className="table-select-dropdown"
                  >
                    {tables.map((tbl) => (
                      <option key={tbl.id} value={tbl.id}>
                        {tbl.number} - {tbl.name} ({tbl.capacity}p) {tbl.status !== 'AVAILABLE' && tbl.id !== activeOrder.tableId ? '• Busy' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="takeaway-inline-info">
                  {activeOrder?.customerName && (
                    <span className="client-name">{activeOrder.customerName}</span>
                  )}
                  {activeOrder?.pickupToken && (
                    <span className="token-chip">{activeOrder.pickupToken}</span>
                  )}
                  {!isEditingCustomer && (
                    <button
                      type="button"
                      className="btn-add-customer-tag"
                      onClick={() => {
                        setCustomerNameInput(activeOrder?.customerName || '');
                        setTokenInput(activeOrder?.pickupToken || '');
                        setIsEditingCustomer(true);
                      }}
                    >
                      <Tag size={11} />
                      <span>{activeOrder?.customerName ? 'Edit Tag' : '+ Name / Buzzer #'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Optional inline tag edit popup */}
          {isEditingCustomer && !isPaid && (
            <div className="inline-customer-edit">
              <input
                type="text"
                placeholder="Name (e.g. John)"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="mini-input"
                autoFocus
              />
              <input
                type="text"
                placeholder="Buzzer / Token #"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="mini-input"
              />
              <button type="button" className="mini-save-btn" onClick={handleSaveCustomerInfo}>
                Save
              </button>
              <button type="button" className="mini-cancel-btn" onClick={() => setIsEditingCustomer(false)}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Clear Cart Button */}
        {activeOrder && items.length > 0 && (
          <button
            className="drawer-clear-btn"
            onClick={clearActiveCart}
            title="Clear and Start Fresh"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* Items Scrollable List */}
      <div className="drawer-items-list">
        {items.length === 0 ? (
          <div className="ready-to-add-placeholder">
            <div className="tap-prompt-icon">👆</div>
            <h4>New Order</h4>
            <p>Tap any food or drink item on the menu to add it immediately to this order.</p>
          </div>
        ) : (
          <>
            {/* Draft Items Section */}
            {draftItems.length > 0 && (
              <div className="item-group-section draft-group">
                <div className="group-header">
                  <span className="dot dot-amber" />
                  <span>New Items ({draftItems.length})</span>
                </div>
                {draftItems.map((item) => renderItemRow(item, true))}
              </div>
            )}

            {/* In Kitchen Section */}
            {activeKitchenItems.length > 0 && (
              <div className="item-group-section kitchen-group">
                <div className="group-header">
                  <span className="dot dot-purple" />
                  <span>Cooking / Sent ({activeKitchenItems.length})</span>
                </div>
                {activeKitchenItems.map((item) => renderItemRow(item, false))}
              </div>
            )}

            {/* Served Section */}
            {servedItems.length > 0 && (
              <div className="item-group-section served-group">
                <div className="group-header">
                  <span className="dot dot-green" />
                  <span>Served / Ready ({servedItems.length})</span>
                </div>
                {servedItems.map((item) => renderItemRow(item, false))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Simple Quick Adjustments (Only visible when items exist and order is NOT paid) */}
      {items.length > 0 && !isPaid && (
        <div className="drawer-adjustments">
          <div className="adjustment-row">
            <span className="adj-label">
              <Percent size={13} /> Discount:
            </span>
            <div className="pill-selector">
              {[0, 5, 10, 15, 20].map((disc) => (
                <button
                  key={disc}
                  className={`adj-pill ${discountPercent === disc ? 'active' : ''}`}
                  onClick={() => setOrderDiscount(disc)}
                >
                  {disc === 0 ? 'None' : `${disc}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="drawer-summary">
        <div className="summary-line">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountPercent > 0 && (
          <div className="summary-line discount-line">
            <span>Discount ({discountPercent}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line">
          <span>Tax (8%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="summary-line grand-total-line">
          <span>TOTAL</span>
          <span className="grand-total-val">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="drawer-footer-actions">
        {isPaid ? (
          <div className="drawer-paid-locked-bar">
            <div className="paid-locked-info">
              <CheckCircle2 size={18} className="text-green" />
              <div className="locked-text-wrap">
                <span className="locked-main">Bill Closed & Paid</span>
                <span className="locked-sub">Total: ${grandTotal.toFixed(2)} • Read Only</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-new-order-fresh"
              onClick={clearActiveCart}
              id="btn-drawer-new-order"
            >
              <Plus size={15} />
              <span>New Order</span>
            </button>
          </div>
        ) : (
          <>
            {activeOrder?.type === 'DINE_IN' && items.length > 0 && (
              <button
                type="button"
                className="footer-btn guest-check-btn-compact"
                onClick={() => onPrintGuestCheck(activeOrder.id)}
                title="Print Guest Check"
              >
                <Receipt size={16} />
                <span>Check</span>
              </button>
            )}

            {/* 1. Pay Later / Hold button: sends to kitchen and clears screen for next customer */}
            <button
              className="footer-btn hold-pickup-btn"
              onClick={handleHoldAndPayLater}
              disabled={items.length === 0}
              title={
                activeOrder?.type === 'DINE_IN'
                  ? 'Send items to kitchen & keep table open for post-dine payment'
                  : 'Send items to kitchen & park in pickup queue for payment upon collection'
              }
              id="btn-hold-pay-later"
            >
              <Flame size={17} />
              <span>Send / Pay Later</span>
            </button>

            {/* 2. Pay Now button: instant checkout */}
            <button
              className="footer-btn pay-btn"
              onClick={handlePayNow}
              disabled={items.length === 0}
              id="btn-pay-now"
            >
              <CreditCard size={17} />
              <span>Pay Now (${grandTotal.toFixed(2)})</span>
            </button>
          </>
        )}
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
            {!isPaid ? (
              <>
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
              </>
            ) : (
              <span className="qty-val locked-qty">{item.quantity}x</span>
            )}
          </div>

          <div className="item-total-col">
            <span className="item-line-total">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            {isDraft && !isPaid && (
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
              {!isPaid && (
                <button
                  className="edit-note-btn"
                  onClick={() => {
                    setEditingNoteItemId(item.id);
                    setNoteText(item.notes || '');
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          )}

          {!item.notes && !isEditingNote && isDraft && !isPaid && (
            <button
              className="add-note-prompt"
              onClick={() => {
                setEditingNoteItemId(item.id);
                setNoteText('');
              }}
            >
              + Kitchen note
            </button>
          )}

          {isEditingNote && (
            <div className="note-input-row">
              <input
                type="text"
                placeholder="e.g. Medium Rare, No Onions..."
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
