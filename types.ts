
export enum Category {
  BUSINESS = 'Business Laptops',
  GAMING = 'Gaming Laptops',
  ULTRABOOKS = 'Ultrabooks',
  WORKSTATIONS = 'Workstations',
  STUDENT = 'Student & Home',
  ACCESSORIES = 'Accessories'
}

export interface Product {
  id?: string;
  _id?: string;
  isNewItem: boolean;
  productId: string;
  originalId?: string;
  title: string;
  brand: string;
  slug?: string;
  category: Category;
  description: string;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    display: string;
    graphics: string;
    os: string;
  };
  rating: number;
  reviews: number;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stock: number;
  config?: any;
  image: string;
  images?: string[]; // Gallery images
  isNew?: boolean;
  isTrending?: boolean;
  isBestDeal?: boolean;
  condition?: string;
  configOptions?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedConfig?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: string;
  totalSpent?: number;
  ordersCount?: number;
  joinedDate?: string;
  createdAt?: string;
  status?: 'active' | 'blocked';
}

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  date: string;
  mapLink: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: 'Razorpay' | 'COD' | 'Card';
  items: CartItem[];
  shippingAddress?: Address;
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  email?: string
  country: string;
  phone: string;
  type: 'Home' | 'Work' | 'Other';
}
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  image: string;
  updatedAt?: string;
  content?: string; // Markdown content
}
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  discountAmount: number
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  valid: boolean;
  isActive: boolean;
}

export interface SiteConfig {
  hero: {
    title: string;
    subtitle: string;
    image: string;
    badgeText: string;
    imageMobile: string;
    imageTablet: string;
    imageDesktop: string;
    activeHeroTemplate: "default",
  };
  banners: Array<{
    id: string;
    title: string;
    desc: string;
    image: string;
    link: string;
    bg: string;
    accent: string;
  }>;
  blogs?: BlogPost[]; // Add blogs array
  sections: {
    hero: boolean;
    brands: boolean;
    trending: boolean;
    flashSale: boolean;
    comparison: boolean;
    emi: boolean;
    explore: boolean;
    blogs: boolean;
    services: boolean;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
}


export const LAPTOP_BRANDS = [
  "Dell",
  "HP",
  "Lenovo",
  "Acer",
  "Asus",
  "Apple",
  "MSI",
  "Samsung",
  "Microsoft Surface",
  "Avita",
  "LG",
  "Sony",
  "Toshiba"
];

export const RAM_OPTIONS = [
  "4 GB",
  "8 GB",
  "12 GB",
  "16 GB",
  "24 GB",
  "32 GB",
  "64 GB"
];

export const STORAGE_TYPES = [
  "256 GB SSD",
  "512 GB SSD",
  "1 TB SSD",
  "2 TB SSD",
  "128 GB SSD",
  "500 GB HDD",
  "1 TB HDD"
];

export const PROCESSORS = [
  // Intel
  "Intel Celeron",
  "Intel Pentium",
  "Intel Core i3 ",
  "Intel Core i5",
  "Intel Core i7",
  "Intel Core i9",

  // AMD
  "AMD Ryzen 3",
  "AMD Ryzen 5",
  "AMD Ryzen 7",
  "AMD Ryzen 9",

  // Apple Silicon
  "Apple M1",
  "Apple M2",
  "Apple M3",
  "Apple M1 Pro",
  "Apple M2 Pro",
  "Apple M3 Pro",
  "Apple M1 Max",
  "Apple M2 Max",
  "Apple M3 Max"
];

export const GENERATIONS = [
  "3th Gen",
  "4th Gen",
  "5th Gen",
  "6th Gen",
  "7th Gen",
  "8th Gen",
  "9th Gen",
  "10th Gen",
  "11th Gen",
  "12th Gen",
  "13th Gen",
  "14th Gen"
];

export const DISPLAY_SIZES = [
  "11.6 inch",
  "12 inch",
  "13.3 inch",
  "14 inch",
  "15.6 inch",
  "16 inch",
  "17 inch"
];


export const LAPTOP_OPTIONS = {
  brands: LAPTOP_BRANDS,
  ram: RAM_OPTIONS,
  storage: STORAGE_TYPES,
  processors: PROCESSORS,
  generations: GENERATIONS,
  displaySizes: DISPLAY_SIZES
};

