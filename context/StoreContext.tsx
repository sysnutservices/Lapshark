"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { Product, Order, Coupon, User, SiteConfig } from "../types";
import { api } from "../api/api";  // <-- axios instance

interface StoreContextType {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  customers: User[];
  siteConfig: SiteConfig | null;

  // Product Actions
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  validateCoupon: (code: string, cartTotal: number) => Promise<Coupon | null>;
  fetchCustomerOrders: () => Promise<void>;
  customerOrders: Order[];
  // Orders
  placeOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;

  // Coupons
  addCoupon: (coupon: Coupon) => Promise<void>;
  updateCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  // Customer
  blockCustomer: (id: string) => Promise<void>;

  // Site config
  updateSiteConfig: (config: SiteConfig) => Promise<void>;

  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
  };

  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [validCoupon, setValidCoupon] = useState<Coupon | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Load from API 
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true); // Explicitly set loading to true at start

        // Get token inside useEffect to avoid SSR issues
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        const productsRes = await api.get("/products").catch(() => ({ data: [] }));
        const ordersRes = await api.get("/orders").catch(() => ({ data: [] }));
        const customerOrdersRes = token
          ? await api.get("/orders/mine", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => ({ data: { orders: [] } }))
          : { data: { orders: [] } };
        const couponsRes = await api.get("/coupons").catch(() => ({ data: [] }));
        const usersRes = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }));
        const siteRes = await api.get("/site-config").catch(() => ({ data: null }));

        setCustomerOrders(customerOrdersRes.data.orders || []);
        setProducts(productsRes.data);
        setOrders(ordersRes.data.orders || ordersRes.data);
        setCoupons(couponsRes.data);
        setCustomers(usersRes.data);
        setSiteConfig(siteRes.data);

      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false); // Always set loading to false
      }
    };

    fetchAll();
  }, []);

  // ------------------------
  // PRODUCT ACTIONS
  // ------------------------
  const addProduct = async (product: Product) => {
    const res = await api.post("/products", product);
    setProducts((prev) => [res.data, ...prev]);
  };

  const updateProduct = async (product: Product) => {
    const res = await api.put(`/products/${product.productId}`, product);
    setProducts((prev) =>
      prev.map((p) => (p.productId === product.productId ? res.data : p))
    );
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ------------------------
  // ORDER ACTIONS
  // ------------------------
  const placeOrder = async (order: Order) => {
    const res = await api.post("/orders", order);
    setOrders((prev) => [res.data, ...prev]);
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    // ⭐ Optimistically update UI FIRST
    setOrders(prev =>
      prev.map(o =>
        o.orderId === orderId ? { ...o, status } : o
      )
    );

    // ⭐ THEN update backend
    const res = await api.put(`/orders/${orderId}/status`, { status });

    // ⭐ OPTIONAL: Replace with API response
    setOrders(prev =>
      prev.map(o =>
        o.orderId === orderId ? res.data.order : o
      )
    );
  };

  // ------------------------
  // COUPONS
  // ------------------------
  const validateCoupon = async (code: string, cartTotal: number) => {
    const res = await api.post("/coupons/validate", { code, cartTotal });
    return res.data;
  };


  const addCoupon = async (coupon: Coupon) => {
    const res = await api.post("/coupons", coupon);
    setCoupons((prev) => [...prev, res.data]);
  };

  const updateCoupon = async (coupon: Coupon) => {
    const res = await api.put(`/coupons/${coupon.id}`, coupon);
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? res.data : c))
    );
  };

  const deleteCoupon = async (id: string) => {
    await api.delete(`/coupons/${id}`);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  // ------------------------
  // CUSTOMERS
  // ------------------------
  const blockCustomer = async (id: string) => {
    const res = await api.put(`/users/${id}/block`);
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? res.data : c))
    );
  };

  // ------------------------
  // SITE CONFIG
  // ------------------------
  const updateSiteConfig = async (config: SiteConfig) => {
    const res = await api.put("/admin/site-config", config);
    setSiteConfig(res.data);
  };

  const fetchCustomerOrders = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) return;

    const res = await api.get("/orders/mine", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setCustomerOrders(res.data.orders || []);
  };

  // ------------------------
  // STATS
  // ------------------------
  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.stock < 5).length,
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        coupons,
        customers,
        siteConfig,
        addProduct,
        updateProduct,
        deleteProduct,
        placeOrder,
        updateOrderStatus,
        addCoupon,
        updateCoupon,
        validateCoupon,
        deleteCoupon,
        fetchCustomerOrders,
        blockCustomer,
        updateSiteConfig,
        customerOrders,
        stats,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook
export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
};