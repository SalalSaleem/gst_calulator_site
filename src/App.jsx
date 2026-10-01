import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Classic Burger",
    price: 550,
    category: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 2,
    name: "Cheese Pizza",
    price: 950,
    category: "Pizza",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    name: "Creamy Pasta",
    price: 780,
    category: "Pasta",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 4,
    name: "Hot Coffee",
    price: 320,
    category: "Beverages",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 5,
    name: "Crispy Fries",
    price: 280,
    category: "Sides",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 6,
    name: "Club Sandwich",
    price: 620,
    category: "Sandwiches",
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 7,
    name: "Chocolate Cake",
    price: 450,
    category: "Desserts",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 8,
    name: "Fresh Juice",
    price: 300,
    category: "Beverages",
    image:
      "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=1000&q=85",
  },
];

const formatCurrency = (value) =>
  `Rs. ${Number(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getGSTRate = (subtotal) => {
  if (subtotal < 1000) return 0;
  if (subtotal <= 2000) return 5;
  return 3;
};

const getSummary = (cart) => {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const gstRate = getGSTRate(subtotal);
  const gstAmount = (subtotal * gstRate) / 100;
  const grandTotal = subtotal + gstAmount;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    subtotal,
    gstRate,
    gstAmount,
    grandTotal,
    totalItems,
  };
};

const loadStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [products, setProducts] = useState(() =>
    loadStorage("shop_products", DEFAULT_PRODUCTS)
  );

  const [cart, setCart] = useState(() =>
    loadStorage("shop_cart", [])
  );

  const [sales, setSales] = useState(() =>
    loadStorage("shop_sales", [])
  );

  const [adminModal, setAdminModal] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "shop_products",
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      "shop_cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "shop_sales",
      JSON.stringify(sales)
    );
  }, [sales]);

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [cart]
  );

  const showNotice = (message) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 2600);
  };

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          category: product.category,
          quantity: 1,
        },
      ];
    });

    showNotice(`${product.name} added to your bag`);
  };

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    showNotice("Your bag has been cleared");
  };

  const addProduct = (newProduct) => {
    const product = {
      ...newProduct,
      id: Date.now(),
      price: Number(newProduct.price),
      createdAt: new Date().toISOString(),
      isNew: true,
    };

    setProducts((currentProducts) => [
      product,
      ...currentProducts,
    ]);

    showNotice(`${product.name} added to Shop.com`);
  };

  const deleteProduct = (productId) => {
    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) => product.id !== productId
      )
    );

    showNotice("Product removed from listings");
  };

  const deleteSale = (saleId) => {
    setSales((currentSales) =>
      currentSales.filter(
        (sale) => sale.id !== saleId
      )
    );

    showNotice("Order removed from sales records");
  };

  const saveOrder = (navigate) => {
    if (cart.length === 0) {
      showNotice("Your bag is empty");
      return;
    }

    const summary = getSummary(cart);

    const order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal: summary.subtotal,
      gstRate: summary.gstRate,
      gstAmount: summary.gstAmount,
      grandTotal: summary.grandTotal,
      totalItems: summary.totalItems,
    };

    setSales((currentSales) => [
      order,
      ...currentSales,
    ]);

    setCart([]);

    localStorage.removeItem("shop_cart");

    showNotice(
      "Thank you for purchasing! Your order has been saved."
    );

    setTimeout(() => {
      navigate("/");
    }, 850);
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar
          cartCount={cartCount}
          onAdminClick={() => setAdminModal(true)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <ShopPage
                products={products}
                cart={cart}
                addToCart={addToCart}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                decreaseQuantity={decreaseQuantity}
                clearCart={clearCart}
                saveOrder={saveOrder}
              />
            }
          />

          <Route
            path="/admin"
            element={
              <AdminPage
                sales={sales}
                products={products}
                addProduct={addProduct}
                deleteProduct={deleteProduct}
                deleteSale={deleteSale}
              />
            }
          />
        </Routes>

        {adminModal && (
          <AdminLoginModal
            onClose={() => setAdminModal(false)}
          />
        )}

        {notice && (
          <div className="toast">
            <span className="toast-check">✓</span>
            {notice}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

/* =========================================
   NAVBAR
========================================= */

function Navbar({ cartCount, onAdminClick }) {
  return (
    <header className="navbar">
      <div className="nav-inner">

        <Link to="/" className="logo">
          <div className="logo-name">
            <strong>Shop</strong>
            <span>.com</span>
          </div>

          <div className="logo-divider"></div>

          <small>EVERYTHING YOU NEED</small>
        </Link>

        <nav className="nav-links">
          <Link to="/">Shop</Link>
          <Link to="/cart">Cart</Link>
        </nav>

        <div className="nav-actions">

          <button
            className="admin-button"
            onClick={onAdminClick}
          >
            <span>⚙</span>
            Admin
          </button>

          <Link
            to="/cart"
            className="cart-button"
          >
            <span className="cart-symbol">
              🛒
            </span>

            <span>Bag</span>

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>
    </header>
  );
}

/* =========================================
   SHOP PAGE
========================================= */

function ShopPage({
  products,
  cart,
  addToCart,
}) {
  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = getSummary(cart).grandTotal;

  return (
    <main className="page">

      <section className="hero">

        <div className="hero-copy">

          <span className="eyebrow">
            WELCOME TO SHOP.COM
          </span>

          <h1>
            Good things.
            <br />
            <span>Chosen simply.</span>
          </h1>

          <p>
            Discover our everyday favorites, add what
            you need to your bag, and let Shop.com handle
            the GST automatically.
          </p>

          <div className="hero-actions">

            <a
              href="#products"
              className="hero-shop-button"
            >
              Start Shopping
              <span>↓</span>
            </a>

            <Link
              to="/cart"
              className="hero-cart-link"
            >
              View your bag →
            </Link>

          </div>

          <div className="hero-meta">
            <span>✓ Simple shopping</span>
            <span>✓ Automatic GST</span>
            <span>✓ Secure order flow</span>
          </div>

        </div>

        <div className="hero-showcase">

          <div className="showcase-top">
            <span>CURRENT BAG</span>

            <strong>
              {cartCount}{" "}
              {cartCount === 1
                ? "ITEM"
                : "ITEMS"}
            </strong>
          </div>

          <div className="showcase-main">

            <small>YOUR TOTAL</small>

            <strong>
              {formatCurrency(cartTotal)}
            </strong>

            <span>
              including applicable GST
            </span>

          </div>

          <div className="showcase-line"></div>

          <div className="showcase-bottom">
            <span>New products</span>
            <strong>Always on top</strong>
          </div>

        </div>

      </section>

      <section
        className="products-section"
        id="products"
      >

        <div className="section-header">

          <div>
            <span className="eyebrow">
              SHOP COLLECTION
            </span>

            <h2>Popular Products</h2>

            <p>
              Fresh listings, everyday essentials and
              customer favorites.
            </p>
          </div>

          <div className="product-count">
            {products.length} LISTINGS
          </div>

        </div>

        <div className="products-grid">

          {products.map((product, index) => {

            const cartItem = cart.find(
              (item) => item.id === product.id
            );

            const isNew =
              product.isNew ||
              (index === 0 &&
                product.id > 1000000000000);

            return (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cartItem?.quantity || 0}
                isNew={isNew}
                addToCart={addToCart}
              />
            );
          })}

        </div>

      </section>

      <section className="gst-strip">

        <div className="gst-strip-copy">

          <span className="eyebrow">
            BUILT-IN GST SYSTEM
          </span>

          <h3>
            You shop. We do the calculation.
          </h3>

          <p>
            Your GST is automatically calculated on
            the final subtotal in your bag.
          </p>

        </div>

        <div className="gst-rules-mini">

          <div>
            <span>Below 1,000</span>
            <strong>0%</strong>
          </div>

          <div>
            <span>1,000 – 2,000</span>
            <strong>5%</strong>
          </div>

          <div>
            <span>Above 2,000</span>
            <strong>3%</strong>
          </div>

        </div>

      </section>

    </main>
  );
}

/* =========================================
   PRODUCT CARD
========================================= */

function ProductCard({
  product,
  quantity,
  isNew,
  addToCart,
}) {
  return (
    <article className="product-card">

      <div className="product-image-wrap">

        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />

        <div className="product-overlay"></div>

        <span className="category-tag">
          {product.category}
        </span>

        {isNew && (
          <span className="new-tag">
            NEW
          </span>
        )}

        {quantity > 0 && (
          <span className="bag-tag">
            {quantity} IN BAG
          </span>
        )}

      </div>

      <div className="product-content">

        <div className="product-title-area">

          <h3>{product.name}</h3>

          <p>
            Freshly listed on Shop.com
          </p>

        </div>

        <div className="product-bottom">

          <div className="product-price">
            {formatCurrency(product.price)}
          </div>

          <button
            className="add-to-bag"
            onClick={() => addToCart(product)}
          >
            <span>+</span>
            Add
          </button>

        </div>

      </div>

    </article>
  );
}

/* =========================================
   CART PAGE
========================================= */

function CartPage({
  cart,
  decreaseQuantity,
  clearCart,
  saveOrder,
}) {
  const navigate = useNavigate();

  const summary = getSummary(cart);

  return (
    <main className="page cart-page">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            SHOPPING BAG
          </span>

          <h1>Your Cart</h1>

          <p>
            Review everything before saving your order.
          </p>
        </div>

        <Link
          to="/"
          className="secondary-page-button"
        >
          ← Back to Shopping
        </Link>

      </div>

      {cart.length === 0 ? (
        <section className="empty-state">

          <div className="empty-icon">
            🛒
          </div>

          <span className="eyebrow">
            NOTHING HERE YET
          </span>

          <h2>Your bag is empty</h2>

          <p>
            Start shopping and your selected products
            will appear here.
          </p>

          <Link
            to="/"
            className="primary-action"
          >
            Explore Products
          </Link>

        </section>
      ) : (

        <section className="cart-layout">

          <div className="cart-items-panel">

            <div className="panel-heading">

              <div>
                <span className="eyebrow">
                  SELECTED ITEMS
                </span>

                <h2>Your Products</h2>
              </div>

              <span className="panel-count">
                {summary.totalItems} ITEMS
              </span>

            </div>

            <div className="cart-list">

              {cart.map((item) => (
                <div
                  className="cart-item"
                  key={item.id}
                >

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div className="cart-item-info">

                    <span className="item-category">
                      {item.category}
                    </span>

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      {formatCurrency(item.price)} each
                    </p>

                  </div>

                  <div className="quantity-box">
                    <span>QTY</span>
                    <strong>
                      {item.quantity}
                    </strong>
                  </div>

                  <div className="item-total">
                    <span>TOTAL</span>

                    <strong>
                      {formatCurrency(
                        item.price *
                          item.quantity
                      )}
                    </strong>
                  </div>

                  <button
                    className="remove-quantity"
                    onClick={() =>
                      decreaseQuantity(item.id)
                    }
                  >
                    ×
                  </button>

                </div>
              ))}

            </div>

            <button
              className="clear-cart-button"
              onClick={clearCart}
            >
              Clear entire bag
            </button>

          </div>

          <aside className="summary-card">

            <div className="summary-title">
              <span>ORDER SUMMARY</span>

              <strong>
                {summary.totalItems} ITEMS
              </strong>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>

              <strong>
                {formatCurrency(
                  summary.subtotal
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>GST Rate</span>

              <strong>
                {summary.gstRate}%
              </strong>
            </div>

            <div className="summary-row">
              <span>GST Amount</span>

              <strong>
                {formatCurrency(
                  summary.gstAmount
                )}
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="grand-total">

              <div>
                <span>Grand Total</span>
                <small>
                  Including GST
                </small>
              </div>

              <strong>
                {formatCurrency(
                  summary.grandTotal
                )}
              </strong>

            </div>

            <button
              className="save-order-button"
              onClick={() =>
                saveOrder(navigate)
              }
            >
              Save Order
              <span>→</span>
            </button>

            <button
              className="back-shopping-button"
              onClick={() => navigate("/")}
            >
              ← Back to Shopping
            </button>

          </aside>

        </section>
      )}

    </main>
  );
}

/* =========================================
   ADMIN LOGIN
========================================= */

function AdminLoginModal({ onClose }) {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    if (password === "admin") {

      localStorage.setItem(
        "shop_admin_authenticated",
        "true"
      );

      onClose();
      navigate("/admin");

      return;
    }

    setError(
      "Incorrect admin password."
    );
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="admin-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div className="modal-icon">
            ⚙
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <span className="eyebrow">
          ADMIN ACCESS
        </span>

        <h2>
          Welcome back.
        </h2>

        <p>
          Enter the administrator password to
          continue to the Shop.com dashboard.
        </p>

        <form onSubmit={handleLogin}>

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter admin password"
            autoFocus
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="modal-actions">

            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-login"
            >
              Enter Dashboard →
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =========================================
   ADMIN PAGE
========================================= */

function AdminPage({
  sales,
  products,
  addProduct,
  deleteProduct,
  deleteSale,
}) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("sales");

  const [openOrder, setOpenOrder] =
    useState(null);

  useEffect(() => {

    const authenticated =
      localStorage.getItem(
        "shop_admin_authenticated"
      ) === "true";

    if (!authenticated) {
      navigate("/");
    }

  }, [navigate]);

  const totalRevenue = sales.reduce(
    (sum, order) =>
      sum + order.grandTotal,
    0
  );

  const totalUnits = sales.reduce(
    (sum, order) =>
      sum + order.totalItems,
    0
  );

  const logout = () => {

    localStorage.removeItem(
      "shop_admin_authenticated"
    );

    navigate("/");
  };

  return (
    <main className="page admin-page">

      <div className="admin-main-header">

        <div>
          <span className="eyebrow">
            SHOP.COM CONTROL CENTER
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage your sales and product listings
            from one place.
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            className="admin-shop-button"
            onClick={() => navigate("/")}
          >
            ← Shop
          </button>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </div>

      <section className="admin-stats">

        <div className="admin-stat">
          <span>ORDERS</span>
          <strong>
            {sales.length}
          </strong>
        </div>

        <div className="admin-stat">
          <span>REVENUE</span>
          <strong>
            {formatCurrency(totalRevenue)}
          </strong>
        </div>

        <div className="admin-stat">
          <span>ITEMS SOLD</span>
          <strong>
            {totalUnits}
          </strong>
        </div>

        <div className="admin-stat">
          <span>LISTINGS</span>
          <strong>
            {products.length}
          </strong>
        </div>

      </section>

      <section className="admin-workspace">

        <div className="admin-tabs">

          <button
            className={
              activeTab === "sales"
                ? "admin-tab active"
                : "admin-tab"
            }
            onClick={() =>
              setActiveTab("sales")
            }
          >
            Sales
            <span>
              {sales.length}
            </span>
          </button>

          <button
            className={
              activeTab === "products"
                ? "admin-tab active"
                : "admin-tab"
            }
            onClick={() =>
              setActiveTab("products")
            }
          >
            Products
            <span>
              {products.length}
            </span>
          </button>

        </div>

        {activeTab === "sales" ? (
          <SalesManager
            sales={sales}
            openOrder={openOrder}
            setOpenOrder={setOpenOrder}
            deleteSale={deleteSale}
          />
        ) : (
          <ProductsManager
            products={products}
            addProduct={addProduct}
            deleteProduct={deleteProduct}
          />
        )}

      </section>

    </main>
  );
}

/* =========================================
   SALES MANAGER
========================================= */

function SalesManager({
  sales,
  openOrder,
  setOpenOrder,
  deleteSale,
}) {
  return (
    <div className="manager-content">

      <div className="manager-header">

        <div>
          <span className="eyebrow">
            SALES RECORDS
          </span>

          <h2>
            Customer Orders
          </h2>

          <p>
            Every saved order appears here automatically.
          </p>
        </div>

        <span className="manager-count">
          {sales.length} ORDERS
        </span>

      </div>

      {sales.length === 0 ? (
        <div className="manager-empty">

          <div>◌</div>

          <h3>
            No orders yet
          </h3>

          <p>
            Saved customer purchases will appear here.
          </p>

        </div>
      ) : (

        <div className="sales-list">

          {sales.map((order) => (

            <article
              className="sale-card"
              key={order.id}
            >

              <div className="sale-summary">

                <div>

                  <span className="sale-label">
                    ORDER
                  </span>

                  <strong>
                    {order.id}
                  </strong>

                  <small>
                    {new Date(
                      order.date
                    ).toLocaleString("en-PK")}
                  </small>

                </div>

                <div className="sale-items-small">

                  <span>ITEMS</span>

                  <strong>
                    {order.totalItems}
                  </strong>

                </div>

                <div className="sale-money">

                  <span>TOTAL</span>

                  <strong>
                    {formatCurrency(
                      order.grandTotal
                    )}
                  </strong>

                </div>

                <div className="sale-card-actions">

                  <button
                    className="view-sale"
                    onClick={() =>
                      setOpenOrder(
                        openOrder === order.id
                          ? null
                          : order.id
                      )
                    }
                  >
                    {openOrder === order.id
                      ? "Hide"
                      : "View"}
                  </button>

                  <button
                    className="delete-sale"
                    onClick={() =>
                      deleteSale(order.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

              {openOrder === order.id && (

                <div className="order-details">

                  <div className="order-details-title">
                    Order Breakdown
                  </div>

                  {order.items.map((item) => (

                    <div
                      className="order-detail-row"
                      key={item.id}
                    >

                      <div>

                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {formatCurrency(
                            item.price
                          )}{" "}
                          × {item.quantity}
                        </span>

                      </div>

                      <strong>
                        {formatCurrency(
                          item.price *
                            item.quantity
                        )}
                      </strong>

                    </div>
                  ))}

                  <div className="order-breakdown">

                    <div>
                      <span>Subtotal</span>

                      <strong>
                        {formatCurrency(
                          order.subtotal
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        GST ({order.gstRate}%)
                      </span>

                      <strong>
                        {formatCurrency(
                          order.gstAmount
                        )}
                      </strong>
                    </div>

                    <div className="order-grand">

                      <span>
                        Grand Total
                      </span>

                      <strong>
                        {formatCurrency(
                          order.grandTotal
                        )}
                      </strong>

                    </div>

                  </div>

                </div>
              )}

            </article>
          ))}

        </div>
      )}

    </div>
  );
}

/* =========================================
   PRODUCTS MANAGER
========================================= */

function ProductsManager({
  products,
  addProduct,
  deleteProduct,
}) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
  });

  const [imageName, setImageName] =
    useState("");

  const [error, setError] =
    useState("");

  const handleTextChange = (event) => {

    const { name, value } =
      event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  };

  const handleImageChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    // Keep uploaded images reasonably small
    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Image must be 2MB or smaller."
      );
      return;
    }

    setImageName(file.name);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {

      setForm((currentForm) => ({
        ...currentForm,
        image: reader.result,
      }));

    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  const submitProduct = (event) => {

    event.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const image = form.image;
    const price = Number(form.price);

    if (!name || !category) {
      setError(
        "Please fill in product name and category."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Please enter a valid product price."
      );
      return;
    }

    if (!image) {
      setError(
        "Please select a product image."
      );
      return;
    }

    addProduct({
      name,
      price,
      category,
      image,
    });

    setForm({
      name: "",
      price: "",
      category: "",
      image: "",
    });

    setImageName("");
    setError("");

    event.target.reset();
  };

  return (
    <div className="manager-content">

      <div className="manager-header">

        <div>

          <span className="eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h2>
            Manage Listings
          </h2>

          <p>
            Upload products directly from your computer.
            New products always appear first.
          </p>

        </div>

        <span className="manager-count">
          {products.length} LISTINGS
        </span>

      </div>

      <div className="product-manager-layout">

        {/* ADD PRODUCT */}

        <section className="add-product-panel">

          <div className="add-product-heading">

            <div className="form-icon">
              +
            </div>

            <div>
              <span className="eyebrow">
                NEW LISTING
              </span>

              <h3>
                Add Product
              </h3>
            </div>

          </div>

          <form
            onSubmit={submitProduct}
            className="product-form"
          >

            <div className="form-group">

              <label>
                Product Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="e.g. Premium Coffee"
                value={form.name}
                onChange={handleTextChange}
              />

            </div>

            <div className="form-two-columns">

              <div className="form-group">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 750"
                  value={form.price}
                  onChange={handleTextChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Beverages"
                  value={form.category}
                  onChange={handleTextChange}
                />

              </div>

            </div>

            {/* IMAGE UPLOAD */}

            <div className="form-group">

              <label>
                Product Image
              </label>

              <label className="image-upload-box">

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                <span className="upload-icon">
                  ↑
                </span>

                <strong>
                  {imageName
                    ? imageName
                    : "Choose Image"}
                </strong>

                <small>
                  JPG, PNG, WEBP • Max 2MB
                </small>

              </label>

            </div>

            {/* IMAGE PREVIEW */}

            {form.image && (

              <div className="image-preview">

                <img
                  src={form.image}
                  alt="Product preview"
                />

                <div>

                  <span>
                    IMAGE PREVIEW
                  </span>

                  <strong>
                    {form.name ||
                      "New Product"}
                  </strong>

                </div>

              </div>
            )}

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="add-product-submit"
            >
              Add Product to Shop
              <span>→</span>
            </button>

          </form>

        </section>

        {/* ALL PRODUCTS */}

        <section className="listings-panel">

          <div className="listings-heading">

            <div>

              <span className="eyebrow">
                ALL LISTINGS
              </span>

              <h3>
                Current Products
              </h3>

            </div>

            <span>
              Newest first
            </span>

          </div>

          <div className="admin-products-grid">

            {products.map(
              (product, index) => (

                <div
                  className="admin-product-card"
                  key={product.id}
                >

                  <div className="admin-product-image">

                    <img
                      src={product.image}
                      alt={product.name}
                    />

                    {index === 0 && (
                      <span className="admin-new-badge">
                        TOP
                      </span>
                    )}

                  </div>

                  <div className="admin-product-info">

                    <span>
                      {product.category}
                    </span>

                    <h4>
                      {product.name}
                    </h4>

                    <strong>
                      {formatCurrency(
                        product.price
                      )}
                    </strong>

                    <button
                      className="admin-delete-product"
                      onClick={() =>
                        deleteProduct(
                          product.id
                        )
                      }
                    >
                      Remove Listing
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      </div>

    </div>
  );
}

export default App;