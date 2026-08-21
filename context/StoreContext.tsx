"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { Product, Order, Coupon, User, SiteConfig, BlogPost } from "../types";
import { api } from "../api/api";

interface StoreContextType {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  customers: User[];
  siteConfig: SiteConfig | null;
  blogs: BlogPost[];

  // Product Actions
  addProduct: (product: Product) => Promise<void>;

  // Blog Actions
  addBlog: (blogData: {
    title?: string;
    excerpt?: string;
    content?: string;
    image?: string;
    slug?: string;
  }) => Promise<void>;
  updateBlog: (id: string, blogData: {
    title?: string;
    excerpt?: string;
    content?: string;
    image?: string;
    slug?: string;
  }) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;

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
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  // Initial Load from API
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

        const customerOrdersPromise = token
          ? api.get("/orders/mine", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { orders: [] } }))
          : Promise.resolve({ data: { orders: [] } });

        // Admin-only data (orders, coupons, users) is never consumed by the
        // storefront — skip it there so customer pages aren't blocked on it.
        const [productsRes, blogsRes, siteRes, customerOrdersRes, ordersRes, couponsRes, usersRes] = await Promise.all([
          api.get("/products").catch(() => ({ data: [] })),
          // In the admin panel, pull the draft-inclusive feed so unpublished
          // posts are editable; the storefront gets the cached public one.
          isAdminRoute && token
            ? api
                .get("/blogs/all", { headers: { Authorization: `Bearer ${token}` } })
                .catch(() => api.get("/blogs").catch(() => ({ data: [] })))
            : api.get("/blogs").catch(() => ({ data: [] })),
          api.get("/site-config").catch(() => ({ data: null })),
          customerOrdersPromise,
          isAdminRoute ? api.get("/orders").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          isAdminRoute ? api.get("/coupons").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          isAdminRoute ? api.get("/users", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        setCustomerOrders(customerOrdersRes.data.orders || []);
        setProducts(productsRes.data);
        setBlogs(blogsRes.data);
        setOrders(ordersRes.data.orders || ordersRes.data);
        setCoupons(couponsRes.data);
        setCustomers(usersRes.data);
        setSiteConfig(siteRes.data);

      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ------------------------
  // PRODUCT ACTIONS
  // ------------------------
  // Product and blog writes are admin-only on the server, so they must send the
  // token. Without it these calls come back 401.
  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Local state only. The admin panel already persists the product itself via a
  // multipart request (images have to be uploaded as files), then calls these
  // with the saved document. Re-sending it here fired a second write that could
  // not succeed — the JSON body carries no file, so the server rejected it for a
  // missing image and the UI reported failure on a product that had saved fine.
  const addProduct = async (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const updateProduct = async (product: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === product.productId ? product : p))
    );
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`, { headers: authHeaders() });
    // The admin panel passes the Mongo _id, but this filtered on `p.id`, which
    // these documents don't have — so the row never disappeared even though the
    // server had deleted it. Match on any of the three identifiers the API
    // returns so the caller can pass whichever it holds.
    setProducts((prev) =>
      prev.filter((p: any) => p._id !== id && p.productId !== id && p.id !== id)
    );
  };

  // ------------------------
  // BLOG ACTIONS
  // ------------------------
  // In StoreContext
  const addBlog = async (blogData: any) => {
    const res = await api.post('/blogs', blogData, { headers: authHeaders() });
    setBlogs((prev) => [...prev, res.data]);
  };

  const updateBlog = async (
    id: string,
    blogData: {
      title?: string;
      excerpt?: string;
      content?: string;
      image?: string;
      slug?: string;
    }
  ) => {
    const res = await api.put(`/blogs/${id}`, blogData, { headers: authHeaders() });

    setBlogs((prev) =>
      prev.map((b) => (b._id === id ? res.data : b))
    );
  };


  const deleteBlog = async (id: string) => {
    await api.delete(`/blogs/${id}`, { headers: authHeaders() });
    setBlogs((prev) => prev.filter((b) => b._id !== id));
  };

  // ------------------------
  // ORDER ACTIONS
  // ------------------------
  const placeOrder = async (order: Order) => {
    const res = await api.post("/orders", order);
    setOrders((prev) => [res.data, ...prev]);
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    setOrders(prev =>
      prev.map(o =>
        o.orderId === orderId ? { ...o, status } : o
      )
    );

    const res = await api.put(`/orders/${orderId}/status`, { status });

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
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) return;
    const res = await api.put("/admin/site-config", config, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
        blogs,
        siteConfig,
        addProduct,
        updateProduct,
        deleteProduct,
        placeOrder,
        updateOrderStatus,
        addCoupon,
        updateCoupon,
        validateCoupon,
        addBlog,
        updateBlog,
        deleteBlog,
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

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
};