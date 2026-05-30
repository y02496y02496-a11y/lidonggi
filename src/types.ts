export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string; // unique item-config ID (e.g. menu_soup_xiaosongban_mix)
  baseName: string; // e.g. 小松板肉
  categoryName: string; // e.g. 湯品, 招牌系列, 頂級系列, 湯麵系列(料少)
  type: '綜合' | '全肉' | '無'; // 綜合, 全肉
  base: '無' | '麵' | '河粉' | '麵線' | '冬粉' | '飯'; // 麵, 河粉, etc.
  addEgg: boolean;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNo: string;
  status: OrderStatus;
  utensils: 'V' | 'X'; // V: 要餐具, X: 不要餐具
  items: OrderItem[];
  totalPrice: number;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  notes?: string;
}

export interface MenuItem {
  id: string;
  category: 'soup' | 'signature' | 'premium' | 'soup_noodle';
  baseName: string;
  typeOptions: ('綜合' | '全肉')[];
  baseOptions: ('無' | '麵' | '河粉' | '麵線' | '冬粉' | '飯')[];
  basePrice: number; // Price without egg
  eggPrice: number;  // Price with egg
}
