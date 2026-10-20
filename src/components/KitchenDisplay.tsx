import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  ArrowLeft,
  Check,
  ShoppingBag,
  UtensilsCrossed
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const {
    orders,
    tables,
    updateOrderItemStatus,
    markOrderCooking,
    bumpOrderKitchen,
    setCurrentMode
  } = usePOS();

  const [filter, setFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'COMPLETED'>('ALL');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Play web audio chime when a new kitchen ticket arrives
  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext not allowed without gesture
    }
  };

  // Find all orders that have items sent to kitchen
  const kitchenOrders = orders.filter((o) => {
    // Has items that were sent to kitchen or served
    const hasKitchenItems = o.items.some(
      (i) => i.kitchenStatus === 'SENT_TO_KITCHEN' || i.kitchenStatus === 'PREPARING' || i.kitchenStatus === 'SERVED'
    );
    return hasKitchenItems;
  });

  // Active cooking orders: tickets that are live in the kitchen and NOT yet bumped/cleared
  const activeKitchenOrders = kitchenOrders.filter((o) => {
    if (o.kitchenBumped) return false;
    if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return false;
    return true;
  });

  // Play sound when new active orders count increases
  useEffect(() => {
    if (activeKitchenOrders.length > lastOrderCount) {
      playChime();
    }
    setLastOrderCount(activeKitchenOrders.length);
  }, [activeKitchenOrders.length]);

  // Elapsed time helper
  const getElapsedMins = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.floor(diff / 60000));
  };

  // Filter list
  const filteredOrders = (filter === 'COMPLETED' ? kitchenOrders : activeKitchenOrders).filter((o) => {
    if (filter === 'DINE_IN') return o.type === 'DINE_IN';
    if (filter === 'TAKEAWAY') return o.type === 'TAKEAWAY';
    if (filter === 'COMPLETED') {
      return o.kitchenBumped || o.status === 'COMPLETED' || o.status === 'SERVED';
    }
    return true;
  });

  // Sort orders: oldest first (FIFO - First In, First Out)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const isStandaloneWindow = window.location.search.includes('view=kitchen');

  return (
    <div className="kds-screen-container">
      {/* Top Chef Bar */}
      <header className="kds-header">
        <div className="kds-header-left">
          <div className="kds-logo-badge">
            <ChefHat size={24} />
          </div>
          <div>
            <h1 className="kds-title">Kitchen Display System (KDS)</h1>
            <span className="kds-subtitle">Live Kitchen Order Tickets & Real-Time Prep Queue</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="kds-filter-pills">
          <button
            className={`kds-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            <span>Active Tickets</span>
            <span className="count-tag">{activeKitchenOrders.length}</span>
          </button>
          <button
            className={`kds-filter-btn ${filter === 'DINE_IN' ? 'active' : ''}`}
            onClick={() => setFilter('DINE_IN')}
          >
            <UtensilsCrossed size={14} />
            <span>Dine-In</span>
            <span className="count-tag">
              {activeKitchenOrders.filter((o) => o.type === 'DINE_IN').length}
            </span>
          </button>
          <button
            className={`kds-filter-btn ${filter === 'TAKEAWAY' ? 'active' : ''}`}
            onClick={() => setFilter('TAKEAWAY')}
          >
            <ShoppingBag size={14} />
            <span>Takeaway</span>
            <span className="count-tag">
              {activeKitchenOrders.filter((o) => o.type === 'TAKEAWAY').length}
            </span>
          </button>
          <button
            className={`kds-filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            <Check size={14} />
            <span>Completed History</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="kds-header-right">
          <button
            className={`kds-action-icon-btn ${audioEnabled ? 'active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Mute Kitchen Chime' : 'Enable Kitchen Chime'}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {!isStandaloneWindow && (
            <button
              className="kds-open-window-btn"
              onClick={() => window.open('/?view=kitchen', '_blank')}
              title="Open Kitchen Screen in a separate window or second monitor"
            >
              <ExternalLink size={15} />
              <span>Open in New Window</span>
            </button>
          )}

          {!isStandaloneWindow && (
            <button
              className="kds-back-pos-btn"
              onClick={() => setCurrentMode('REGISTER')}
            >
              <ArrowLeft size={15} />
              <span>Back to Register</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Tickets Workspace */}
      <main className="kds-tickets-workspace">
        {sortedOrders.length === 0 ? (
          <div className="kds-empty-state">
            <ChefHat size={64} className="empty-chef-icon" />
            <h2>Kitchen Queue is Clear</h2>
            <p>No active orders currently waiting for preparation. New tickets will appear here automatically with sound alert.</p>
          </div>
        ) : (
          <div className="kds-tickets-grid">
            {sortedOrders.map((order) => {
              const elapsed = getElapsedMins(order.createdAt);
              // Delay color coding: < 5m green, 5-12m yellow, > 12m red
              const delayClass = elapsed > 12 ? 'delay-high' : elapsed > 5 ? 'delay-med' : 'delay-low';
              const isTakeaway = order.type === 'TAKEAWAY';

              // Table or Token label
              let destinationLabel = '';
              if (isTakeaway) {
                destinationLabel = order.pickupToken || 'TAKEAWAY PICKUP';
              } else if (order.tableId) {
                const tbl = tables.find((t) => t.id === order.tableId);
                destinationLabel = tbl ? `${tbl.number} • ${tbl.name}` : (order.tableName || 'Dine-In');
              } else {
                destinationLabel = order.tableName || 'DINE-IN TABLE';
              }

              return (
                <div
                  key={order.id}
                  className={`kds-ticket-card ${delayClass}`}
                  id={`kds-ticket-${order.id}`}
                >
                  {/* Ticket Header */}
                  <div className="ticket-card-header">
                    <div className="ticket-title-block">
                      <span className="destination-badge">
                        {isTakeaway ? <ShoppingBag size={14} /> : <UtensilsCrossed size={14} />}
                        <strong>{destinationLabel}</strong>
                      </span>
                      <span className="ticket-order-num">{order.orderNumber}</span>
                    </div>

                    <div className={`ticket-timer-pill ${delayClass}`}>
                      <Clock size={13} />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Customer / Server sub-bar */}
                  <div className="ticket-meta-bar">
                    {order.customerName && (
                      <span className="meta-guest">Guest: <strong>{order.customerName}</strong></span>
                    )}
                    <span className="meta-server">Staff: {order.serverName}</span>
                    <span className="meta-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Items Checklist */}
                  <div className="ticket-items-list">
                    {order.items
                      .filter((item) => item.kitchenStatus !== 'DRAFT')
                      .map((item) => {
                        const isItemDone = item.kitchenStatus === 'SERVED';
                        const isCooking = item.kitchenStatus === 'PREPARING';
                        const isQueued = item.kitchenStatus === 'SENT_TO_KITCHEN';

                      return (
                        <div
                          key={item.id}
                          className={`kds-item-row ${isItemDone ? 'item-done' : isCooking ? 'item-cooking' : ''}`}
                          onClick={() => {
                            // Cycle status on row tap: Queued -> Cooking -> Done -> Queued
                            if (isQueued) {
                              updateOrderItemStatus(order.id, item.id, 'PREPARING');
                            } else if (isCooking) {
                              updateOrderItemStatus(order.id, item.id, 'SERVED');
                            } else {
                              updateOrderItemStatus(order.id, item.id, 'SENT_TO_KITCHEN');
                            }
                          }}
                          title="Click row to cycle: Queued ⏱️ → Cooking 🔥 → Done ✅"
                        >
                          <div className="item-qty-col">
                            <span className="kds-qty">{item.quantity}x</span>
                          </div>

                          <div className="item-desc-col">
                            <span className="kds-item-name">{item.name}</span>
                            {item.notes && (
                              <div className="kds-chef-note">
                                <Flame size={12} className="inline mr-1" />
                                <span>{item.notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Individual Item Kitchen Status Controls */}
                          <div className="kds-item-actions">
                            {/* Cooking Status Button for this specific item */}
                            {isCooking ? (
                              <button
                                type="button"
                                className="kds-item-status-btn cooking"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderItemStatus(order.id, item.id, 'SENT_TO_KITCHEN');
                                }}
                                title="Cooking in progress! Click to revert to queued"
                              >
                                <Flame size={12} />
                                <span>Cooking</span>
                              </button>
                            ) : isQueued ? (
                              <button
                                type="button"
                                className="kds-item-status-btn queued"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderItemStatus(order.id, item.id, 'PREPARING');
                                }}
                                title="Click to start cooking this item separately"
                              >
                                <Flame size={12} />
                                <span>Cook</span>
                              </button>
                            ) : (
                              <span className="kds-item-status-pill done">Done</span>
                            )}

                            {/* Done / Checkmark toggle button */}
                            <button
                              type="button"
                              className={`kds-item-check-btn ${isItemDone ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderItemStatus(order.id, item.id, isItemDone ? 'PREPARING' : 'SERVED');
                              }}
                              title={isItemDone ? 'Mark as still preparing' : 'Mark item completed'}
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Action Footer */}
                  <div className="ticket-card-footer">
                    {(() => {
                      const nonDraftItems = order.items.filter((i) => i.kitchenStatus !== 'DRAFT');
                      const cookingCount = nonDraftItems.filter((i) => i.kitchenStatus === 'PREPARING').length;
                      const readyCount = nonDraftItems.filter((i) => i.kitchenStatus === 'SERVED').length;
                      const allCooking = nonDraftItems.length > 0 && nonDraftItems.every((i) => i.kitchenStatus === 'PREPARING');
                      const allItemsReady = nonDraftItems.length > 0 && readyCount === nonDraftItems.length;

                      return (
                        <>
                          <button
                            type="button"
                            className={`btn-kds-action cook-btn ${allCooking ? 'active' : ''}`}
                            onClick={() => markOrderCooking(order.id)}
                            title="Apply cooking status to all items in this order"
                          >
                            <Flame size={15} />
                            <span>
                              {allCooking
                                ? 'All Cooking 🔥'
                                : cookingCount > 0
                                ? `Cooking (${cookingCount}/${nonDraftItems.length}) 🔥`
                                : 'Cook All'}
                            </span>
                          </button>

                          <button
                            type="button"
                            className={`btn-kds-action bump-btn ${allItemsReady ? 'ready-active' : 'disabled'}`}
                            onClick={() => {
                              if (!allItemsReady) return;
                              bumpOrderKitchen(order.id);
                              playChime();
                            }}
                            disabled={!allItemsReady}
                            id={`kds-bump-btn-${order.id}`}
                            title={
                              allItemsReady
                                ? 'All items ready! Click to bump ticket off screen'
                                : `Cannot bump: ${readyCount}/${nonDraftItems.length} items ready. All items must be marked done (✓) first.`
                            }
                          >
                            <CheckCircle2 size={16} />
                            <span>
                              {allItemsReady
                                ? 'Mark Ready / Bump'
                                : `Ready / Bump (${readyCount}/${nonDraftItems.length})`}
                            </span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
