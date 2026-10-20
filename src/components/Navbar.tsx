import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  LayoutGrid,
  CreditCard,
  ClipboardList,
  BarChart3,
  Search,
  Clock,
  User,
  RotateCcw,
  Store,
  ChefHat,
  ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentMode,
    setCurrentMode,
    tables,
    orders,
    shift,
    searchQuery,
    setSearchQuery,
    resetAllData
  } = usePOS();

  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'BILL_PRINTED').length;
  const unpaidCount = orders.filter((o) => o.paymentStatus === 'UNPAID').length;
  const activeOrdersCount = orders.filter((o) => {
    if (o.status === 'COMPLETED' || o.status === 'CANCELLED') return false;
    const hasCommittedItems = o.items.some((i) => i.kitchenStatus !== 'DRAFT');
    const isSeatedTable = !!o.tableId;
    if (!hasCommittedItems && !isSeatedTable) return false;
    if (o.paymentStatus === 'UNPAID') return true;
    if (!o.kitchenBumped) return true;
    if (o.type === 'TAKEAWAY' && o.takeawayStatus !== 'COLLECTED') return true;
    return false;
  }).length;
  const kitchenCount = orders.filter(
    (o) =>
      !o.kitchenBumped &&
      o.status !== 'COMPLETED' &&
      o.status !== 'CANCELLED' &&
      o.items.some(
        (i) => i.kitchenStatus === 'SENT_TO_KITCHEN' || i.kitchenStatus === 'PREPARING' || i.kitchenStatus === 'SERVED'
      )
  ).length;

  return (
    <header className="navbar-container">
      {/* Brand & Terminal Info */}
      <div className="navbar-brand">
        <div className="brand-logo-icon">
          <Store size={22} className="text-brand" />
        </div>
        <div className="brand-text">
          <div className="brand-title">
            AURA <span className="brand-badge">POS</span>
          </div>
          <div className="brand-subtitle">Terminal 01 • Main Dining</div>
        </div>
      </div>

      {/* Navigation Modes */}
      <nav className="navbar-nav">
        <button
          className={`nav-tab-btn ${currentMode === 'REGISTER' ? 'active' : ''}`}
          onClick={() => setCurrentMode('REGISTER')}
          id="nav-register-btn"
        >
          <CreditCard size={18} />
          <span>Register</span>
        </button>

        <button
          className={`nav-tab-btn ${currentMode === 'TABLES' ? 'active' : ''}`}
          onClick={() => setCurrentMode('TABLES')}
          id="nav-tables-btn"
        >
          <LayoutGrid size={18} />
          <span>Floor Map</span>
          {occupiedCount > 0 && <span className="nav-badge occupied">{occupiedCount} Busy</span>}
        </button>

        <button
          className={`nav-tab-btn ${currentMode === 'ORDERS' ? 'active' : ''}`}
          onClick={() => setCurrentMode('ORDERS')}
          id="nav-orders-btn"
        >
          <ClipboardList size={18} />
          <span>Active Tabs</span>
          {activeOrdersCount > 0 && (
            <span className="nav-badge unpaid">
              {unpaidCount > 0 ? `${unpaidCount} Open` : `${activeOrdersCount} Prep`}
            </span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${currentMode === 'KITCHEN' ? 'active' : ''}`}
          onClick={() => setCurrentMode('KITCHEN')}
          id="nav-kitchen-btn"
        >
          <ChefHat size={18} />
          <span>Kitchen (KDS)</span>
          {kitchenCount > 0 && <span className="nav-badge kitchen-badge">{kitchenCount} Live</span>}
        </button>

        <button
          className={`nav-tab-btn ${currentMode === 'ANALYTICS' ? 'active' : ''}`}
          onClick={() => setCurrentMode('ANALYTICS')}
          id="nav-analytics-btn"
        >
          <BarChart3 size={18} />
          <span>Shift Drawer</span>
        </button>
      </nav>

      {/* Search Input */}
      <div className="navbar-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search items, tables, orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Status Bar: Live Clock, Cashier, Open Kitchen Window & Reset */}
      <div className="navbar-status">
        <button
          className="kds-launch-btn"
          title="Open Kitchen Screen in a separate window or monitor"
          onClick={() => window.open('/?view=kitchen', '_blank')}
          id="btn-open-kitchen-window"
        >
          <ExternalLink size={14} />
          <span>Kitchen Window</span>
        </button>

        <div className="status-pill clock-pill">
          <Clock size={15} />
          <span className="mono-text">{timeStr}</span>
        </div>

        <div className="status-pill user-pill">
          <User size={15} />
          <div className="user-info">
            <span className="user-name">{shift.cashierName}</span>
            <span className="user-shift">${shift.totalRevenue.toFixed(2)} Today</span>
          </div>
        </div>

        <button
          className="reset-demo-btn"
          title="Reset Seed Demo Data"
          onClick={() => {
            if (confirm('Reset all demo tables and orders to default?')) {
              resetAllData();
            }
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};
