import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Utensils,
  Flame,
  Pizza,
  Sandwich,
  Cake,
  Wine,
  Coffee,
  Grid,
  Barcode,
  Plus,
  Check
} from 'lucide-react';

export const RegisterView: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    addItemToActiveOrder,
    activeOrder
  } = usePOS();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Map category icons
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils size={16} />;
      case 'Flame':
        return <Flame size={16} />;
      case 'Pizza':
        return <Pizza size={16} />;
      case 'Sandwich':
        return <Sandwich size={16} />;
      case 'Cake':
        return <Cake size={16} />;
      case 'Wine':
        return <Wine size={16} />;
      case 'Coffee':
        return <Coffee size={16} />;
      default:
        return <Grid size={16} />;
    }
  };

  // Filter products by selected category and search
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'cat-all' || prod.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Handle simulated barcode scanning
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const foundProduct = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (foundProduct) {
      addItemToActiveOrder(foundProduct);
      setScanMessage(`Added: ${foundProduct.name}`);
      setBarcodeInput('');
      setTimeout(() => setScanMessage(null), 2500);
    } else {
      setScanMessage(`Barcode '${barcodeInput}' not found`);
      setTimeout(() => setScanMessage(null), 2500);
    }
  };

  // Quick simulate scan sample barcodes
  const sampleBarcodes = [
    { label: 'Truffle Fries (890100101)', code: '890100101' },
    { label: 'Angus Ribeye (890100201)', code: '890100201' },
    { label: 'Margherita Pizza (890100301)', code: '890100301' },
    { label: 'Aperol Spritz (890100603)', code: '890100603' }
  ];

  return (
    <div className="register-view-container">
      {/* Category Pills & Barcode Quick Tool */}
      <div className="register-header-controls">
        <div className="category-scroll-bar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Barcode scanner simulator */}
        <form className="barcode-simulator-bar" onSubmit={handleBarcodeSubmit}>
          <Barcode size={18} className="barcode-icon" />
          <input
            type="text"
            placeholder="Scan Barcode / SKU..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="barcode-input"
          />
          <button type="submit" className="barcode-submit-btn">
            Scan
          </button>
        </form>
      </div>

      {/* Barcode feedback alert */}
      {scanMessage && (
        <div className="scan-alert-banner">
          <Check size={16} />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Quick sample barcode clickers */}
      <div className="sample-barcode-chips">
        <span className="chips-label">Quick Scan Shortcuts:</span>
        {sampleBarcodes.map((item) => (
          <button
            key={item.code}
            className="barcode-chip"
            onClick={() => {
              const prod = products.find((p) => p.barcode === item.code);
              if (prod) {
                addItemToActiveOrder(prod);
                setScanMessage(`Added: ${prod.name}`);
                setTimeout(() => setScanMessage(null), 2000);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((prod) => {
          // Check if item is already in active cart
          const inCartQty = activeOrder?.items
            .filter((item) => item.productId === prod.id)
            .reduce((sum, item) => sum + item.quantity, 0) || 0;

          return (
            <div
              key={prod.id}
              className={`product-card ${inCartQty > 0 ? 'in-cart' : ''}`}
              onClick={() => addItemToActiveOrder(prod)}
              id={`prod-card-${prod.id}`}
            >
              <div className="product-image-wrap">
                <img src={prod.image} alt={prod.name} loading="lazy" />
                <span className="product-price-tag">${prod.price.toFixed(2)}</span>
                {inCartQty > 0 && (
                  <span className="in-cart-badge">{inCartQty} in cart</span>
                )}
              </div>

              <div className="product-details">
                <span className="product-sku">{prod.sku}</span>
                <h4 className="product-name">{prod.name}</h4>
                <p className="product-desc">{prod.description}</p>

                <div className="product-footer">
                  <span className="stock-info">
                    {prod.stockCount > 10 ? (
                      <span className="stock-good">{prod.stockCount} in stock</span>
                    ) : (
                      <span className="stock-low">Only {prod.stockCount} left</span>
                    )}
                  </span>
                  <button className="add-btn" title="Add to Order">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
