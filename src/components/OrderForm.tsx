import React, { useState } from 'react';
import { MENU_ITEMS, CATEGORY_LABELS, RESTAURANT_INFO } from '../data';
import { MenuItem, OrderItem } from '../types';
import { createOrder } from '../firebase';
import { Plus, Minus, ShoppingBag, Utensils, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderFormProps {
  onOrderSuccess: (orderId: string, tableNo: string) => void;
  isFirebaseActive: boolean;
}

export default function OrderForm({ onOrderSuccess, isFirebaseActive }: OrderFormProps) {
  // Table No state
  const [tableNo, setTableNo] = useState('');
  // Utensils state (V: Yes, X: No) - default to Yes (V)
  const [utensils, setUtensils] = useState<'V' | 'X'>('V');
  // Order custom notes
  const [notes, setNotes] = useState('');

  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'soup' | 'signature' | 'premium' | 'soup_noodle'>('all');

  // Currently configuring item states (to select options before adding to cart)
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [itemType, setItemType] = useState<'綜合' | '全肉'>('綜合');
  const [itemBase, setItemBase] = useState<'無' | '麵' | '河粉' | '麵線' | '冬粉' | '飯'>('麵');
  const [addEgg, setAddEgg] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Error/Success statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items
  const filteredItems = selectedCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(it => it.category === selectedCategory);

  // Handle open configuration modal for an item
  const startConfigure = (item: MenuItem) => {
    setConfiguringItem(item);
    // Set default item options
    setItemType(item.typeOptions[0] || '綜合');
    setItemBase(item.baseOptions.includes('無') ? '無' : '麵');
    setAddEgg(false);
    setQuantity(1);
    setItemNotes('');
  };

  // Add configured item to cart
  const addToCart = () => {
    if (!configuringItem) return;

    // Calculate dynamic price
    const unitPrice = addEgg ? configuringItem.eggPrice : configuringItem.basePrice;
    
    // Create detailed name description
    const optionDesc: string[] = [];
    if (configuringItem.typeOptions.length > 1) {
      optionDesc.push(itemType);
    }
    if (configuringItem.baseOptions.length > 1 && itemBase !== '無') {
      optionDesc.push(itemBase);
    }
    if (addEgg) {
      optionDesc.push('加蛋');
    }
    
    let displayName = configuringItem.baseName;
    if (optionDesc.length > 0) {
      displayName += ` (${optionDesc.join('/')})`;
    }

    // Generate a unique key for matching identical cart configurations
    const cartItemKey = `${configuringItem.id}_${itemType}_${itemBase}_${addEgg ? 'egg' : 'noegg'}_${itemNotes}`;

    const existingIndex = cart.findIndex(item => item.id === cartItemKey);
    
    const categoryLabel = CATEGORY_LABELS[configuringItem.category];

    if (existingIndex > -1) {
      // Update quantity of existing
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: cartItemKey,
        baseName: displayName,
        categoryName: categoryLabel,
        type: configuringItem.typeOptions.includes(itemType) ? itemType : '無',
        base: itemBase,
        addEgg,
        price: unitPrice,
        quantity,
      };
      setCart([...cart, newItem]);
    }

    // Reset configuring item state
    setConfiguringItem(null);
  };

  // Adjust quantity in cart
  const updateCartQty = (key: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === key) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as OrderItem[];
    setCart(updated);
  };

  const removeCartItem = (key: string) => {
    setCart(cart.filter(item => item.id !== key));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Submit order to DB
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tableNo.trim()) {
      setErrorMsg('請填寫桌號！');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('購物車目前是空的，請先點擊商品加入！');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await createOrder({
        tableNo: tableNo.trim(),
        status: 'pending',
        utensils,
        items: cart,
        totalPrice: totalCartPrice,
        notes: notes.trim(),
      });
      
      // Reset form & trigger callback
      setCart([]);
      setTableNo('');
      setNotes('');
      onOrderSuccess(orderId, tableNo);
    } catch (err: any) {
      setErrorMsg('提交點單失敗，請稍候再試：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="order-form-container">
      
      {/* Menu Area (8 columns on large screen) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-none" id="categories-tabs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-700 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            全部品項
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {key === 'soup' ? '經典湯品' : key === 'signature' ? '招牌系列' : key === 'premium' ? '頂級系列' : '湯麵(料少)'}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="items-grid">
          {filteredItems.map(item => (
            <motion.div
              layout
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-amber-50 shadow-sm hover:shadow-md hover:border-amber-100 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 inline-block mb-3">
                  {CATEGORY_LABELS[item.category].split(' ')[0]}
                </span>
                <h3 className="font-semibold text-gray-800 text-lg tracking-tight mb-2">
                  {item.baseName}
                </h3>
                <p className="text-xs text-gray-500 mb-4 font-mono">
                  ※綜合/全肉同價 • 加蛋單價 +$5
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">起售價</span>
                  <span className="text-xl font-bold font-mono text-amber-700">
                    ${item.basePrice}
                  </span>
                </div>

                <button
                  onClick={() => startConfigure(item)}
                  className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  選擇口味
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Customer Details Area (5 columns on large screen) */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl sticky top-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <ShoppingBag className="text-amber-700" size={22} />
            點單結帳明細
          </h2>

          <form onSubmit={submitOrder} className="space-y-6">
            
            {/* Table Number & Utensils Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  餐桌桌號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="EX: A1"
                  required
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-lg font-bold font-mono text-center text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Utensils size={14} className="text-amber-700" />
                  需要免洗餐具
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setUtensils('V')}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      utensils === 'V'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    要 (V)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUtensils('X')}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      utensils === 'X'
                        ? 'bg-white text-rose-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    免 (X)
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items list */}
            <div className="border-t border-b border-gray-100 py-4 max-h-[280px] overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">尚未選購商品，請點擊左側菜單</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-2 bg-amber-50/30 p-3 rounded-xl border border-amber-50/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-800">{item.baseName}</h4>
                      <p className="text-xs text-amber-800/80 mt-0.5">{item.categoryName}</p>
                      <span className="text-xs bg-white border border-amber-100 text-amber-800 px-2 py-0.5 rounded-md inline-block mt-1 font-mono font-bold">
                        ${item.price} / 份
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 scale-90 origin-right">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-sm inline-block text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="text-sm font-bold font-mono text-amber-800">
                        ${item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Custom order-level notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                整單備註 (客製化需求、不香菜等)
              </label>
              <input
                type="text"
                placeholder="EX: 湯多、只要麵線乾的"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Price breakdown and action */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between text-sm text-gray-500">
                <span>品項數量</span>
                <span className="font-mono font-semibold">{cart.reduce((s, d) => s + d.quantity, 0)} 份</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200/60">
                <span className="text-base font-bold text-gray-800">應付金總計</span>
                <span className="text-3xl font-extrabold font-mono text-amber-700">
                  ${totalCartPrice}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm flex gap-1.5 items-start">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                isSubmitting || cart.length === 0
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-amber-700 hover:bg-amber-800 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? '點單傳送中...' : '送出線上點單 (廚房即時同步)'}
            </button>
          </form>
        </div>
      </div>

      {/* Flavor Configuration Modal */}
      <AnimatePresence>
        {configuringItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-amber-100"
            >
              {/* Modal Header */}
              <div className="bg-amber-700 text-white p-6 relative">
                <span className="text-xs uppercase tracking-wider bg-amber-800/60 text-amber-100 px-2.5 py-1 rounded-full font-bold">
                  {CATEGORY_LABELS[configuringItem.category]}
                </span>
                <h3 className="text-xl font-bold mt-2 font-sans">{configuringItem.baseName}</h3>
                <button
                  type="button"
                  onClick={() => setConfiguringItem(null)}
                  className="absolute top-6 right-6 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                >
                  <Check className="rotate-45" size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* 1. Type Option (綜合/全肉) */}
                {configuringItem.typeOptions.length > 1 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">口味配料</label>
                    <div className="grid grid-cols-2 gap-3">
                      {configuringItem.typeOptions.map(t => (
                        <button
                          key={t}
                          onClick={() => setItemType(t)}
                          className={`py-3 px-4 rounded-xl font-semibold border text-center transition-all ${
                            itemType === t
                              ? 'bg-amber-50 border-amber-700 text-amber-900 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {t}
                          <p className="text-[10px] font-normal leading-tight text-gray-400 mt-1">
                            {t === '綜合' ? '配肉+內臟 (隨機豬心/豬肚/大腸等物)' : '均為上品全肉品'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Base Option (麵/河粉/麵線/冬粉/飯/無) */}
                {configuringItem.baseOptions.length > 1 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">飽食主食品項</label>
                    <div className="grid grid-cols-3 gap-2">
                      {configuringItem.baseOptions.map(b => (
                        <button
                          key={b}
                          onClick={() => setItemBase(b as any)}
                          className={`py-2 px-1 rounded-lg text-sm font-semibold border text-center transition-all ${
                            itemBase === b
                              ? 'bg-amber-50 border-amber-700 text-amber-900 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Add Egg Option */}
                <div className="flex items-center justify-between p-4 bg-amber-50/30 rounded-xl border border-amber-50">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-sm">加生新鮮雞蛋</span>
                    <span className="text-xs text-gray-400 font-mono">營養加滿 +$5 元</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddEgg(!addEgg)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                      addEgg
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {addEgg ? '已加蛋 (+$5)' : '不加蛋'}
                  </button>
                </div>

                {/* 4. Quantity Adjust */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-gray-700 text-sm">點購數量</span>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-gray-500 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold font-mono text-base inline-block text-gray-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-gray-500 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">合計總價</span>
                  <span className="text-2xl font-bold font-mono text-amber-700">
                    ${(addEgg ? configuringItem.eggPrice : configuringItem.basePrice) * quantity}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-xl text-sm tracking-wide transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={16} />
                  加入明細
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
