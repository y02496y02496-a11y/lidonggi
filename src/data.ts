import { MenuItem } from './types';

export const RESTAURANT_INFO = {
  name: '李東記肉骨茶專賣店',
  address: '雲林縣斗六市龍潭路10號',
  phones: ['0930917681', '0900238681'],
  description: '※綜合：肉品 + 內臟類 (隨機：豬肚、腸、心...) / 全肉：全肉品※',
};

export const MENU_ITEMS: MenuItem[] = [
  // === 湯品 (Soups) ===
  {
    id: 'soup_xiaosong_ban',
    category: 'soup',
    baseName: '小松板肉 (湯品)',
    typeOptions: ['綜合', '全肉'],
    baseOptions: ['無'],
    basePrice: 70,
    eggPrice: 75,
  },
  {
    id: 'soup_ribs',
    category: 'soup',
    baseName: '塊狀肋排 (湯品)',
    typeOptions: ['綜合', '全肉'],
    baseOptions: ['無'],
    basePrice: 75,
    eggPrice: 80,
  },
  {
    id: 'soup_premium',
    category: 'soup',
    baseName: '頂級系列 (湯品)',
    typeOptions: ['綜合', '全肉'],
    baseOptions: ['無'],
    basePrice: 135,
    eggPrice: 140,
  },

  // === 招牌系列 (Signature Carbs) ===
  {
    id: 'sig_xiaosong_ban_mix',
    category: 'signature',
    baseName: '招牌系列 I 小松板肉 (綜合)',
    typeOptions: ['綜合'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 80,
    eggPrice: 85,
  },
  {
    id: 'sig_xiaosong_ban_all',
    category: 'signature',
    baseName: '招牌系列 I 小松板肉 (全肉)',
    typeOptions: ['全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 80,
    eggPrice: 85,
  },
  {
    id: 'sig_chicken_all',
    category: 'signature',
    baseName: '招牌系列 I 台灣正土雞肉',
    typeOptions: ['全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 75,
    eggPrice: 80,
  },
  {
    id: 'sig_pork_leg_all',
    category: 'signature',
    baseName: '招牌系列 I 豬腳肉',
    typeOptions: ['全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 75,
    eggPrice: 80,
  },
  {
    id: 'sig_pork_heart_mix',
    category: 'signature',
    baseName: '招牌系列 I 豬心',
    typeOptions: ['綜合'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 75,
    eggPrice: 80,
  },
  {
    id: 'sig_ribs_mix',
    category: 'signature',
    baseName: '招牌系列 I 塊狀肋排系列 (綜合)',
    typeOptions: ['綜合'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 85,
    eggPrice: 90,
  },
  {
    id: 'sig_ribs_all',
    category: 'signature',
    baseName: '招牌系列 I 塊狀肋排系列 (全肉)',
    typeOptions: ['全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 85,
    eggPrice: 90,
  },

  // === 頂級系列 (Premium Carbs) ===
  {
    id: 'prem_ribs_xiaosong',
    category: 'premium',
    baseName: '頂級系列 (塊狀肋排 + 小松板肉)',
    typeOptions: ['綜合', '全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 140,
    eggPrice: 145,
  },

  // === 湯麵系列 (Soup Noodle Series - 料少) ===
  {
    id: 'soup_noodle_xiaosong',
    category: 'soup_noodle',
    baseName: '湯麵系列 I 小松板肉 (料少)',
    typeOptions: ['綜合', '全肉'],
    baseOptions: ['麵', '河粉', '麵線', '冬粉', '飯'],
    basePrice: 60,
    eggPrice: 65,
  },
];

export const CATEGORY_LABELS = {
  soup: '經典湯品',
  signature: '招牌主食系列 (麵/河粉/麵線/冬粉/飯)',
  premium: '頂級雙拼主食系列 (麵/河粉/麵線/冬粉/飯)',
  soup_noodle: '湯麵系列 (料少) (麵/河粉/麵線/冬粉/飯)',
};
