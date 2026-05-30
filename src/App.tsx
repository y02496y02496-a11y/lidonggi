import React, { useState } from 'react';
import OrderForm from './components/OrderForm';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import { RESTAURANT_INFO } from './data';
import { isFirebaseEnabled } from './firebase';
import { ShoppingBag, Clock, ShieldCheck, Heart, Info, Coffee } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'order' | 'track' | 'admin'>('order');
  const [trackTableNo, setTrackTableNo] = useState('');

  // When order is placed successfully, redirect to tracker and carry tableNo!
  const handleOrderSuccess = (orderId: string, tableNo: string) => {
    setTrackTableNo(tableNo);
    setActiveTab('track');
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 text-gray-800 font-sans antialiased" id="main-app">
      
      {/* Dynamic Mode Switch Banner */}
      {!isFirebaseEnabled && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3 px-4 text-xs font-medium text-center flex items-center justify-center gap-2 select-none">
          <Info size={14} className="text-amber-700 shrink-0" />
          <span>
            目前執行於 <strong>【在地高響應緩衝模式】</strong>。欲啟用跨裝置雲端即時點單，請至右側 Firebase 視窗點擊啟動 Firestore 資料庫服務。
          </span>
        </div>
      )}

      {/* Styled Taiwanese Header design */}
      <header className="bg-white border-b border-gray-100 shadow-xs pt-8 pb-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Coffee className="text-amber-700 shrink-0 mb-1" size={32} />
              {RESTAURANT_INFO.name}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              地址：{RESTAURANT_INFO.address} | 專線：{RESTAURANT_INFO.phones.join('、')}
            </p>
          </div>

          <p className="text-xs max-w-md bg-amber-50/40 text-amber-900 px-4 py-2.5 rounded-xl border border-amber-100/50 leading-relaxed font-semibold">
            {RESTAURANT_INFO.description}
          </p>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 select-none">
        <div className="max-w-7xl mx-auto flex justify-center border-b border-gray-100">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('order')}
              className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'order'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShoppingBag size={18} />
              熱售美味點單
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'track'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Clock size={18} />
              進度即時查詢
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
                activeTab === 'admin'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShieldCheck size={18} />
              後台經營管理
            </button>
          </nav>
        </div>
      </div>

      {/* Main Body content wrapper */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Render active tabs */}
        {activeTab === 'order' && (
          <OrderForm 
            onOrderSuccess={handleOrderSuccess} 
            isFirebaseActive={isFirebaseEnabled}
          />
        )}

        {activeTab === 'track' && (
          <OrderTracker initialTableNo={trackTableNo} />
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}

      </main>

      {/* Warm Taiwanese Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400 select-none mt-12">
        <p className="flex items-center justify-center gap-1">
          <span>由 李東記肉骨茶專賣店 本店提供正宗餐飲服務</span>
          <Heart size={12} className="text-amber-700 fill-amber-700" />
        </p>
        <p className="mt-1 font-mono text-[10px]">
          雲林縣斗六市龍潭路10號 - 專線: 0930-917681、0900-238681
        </p>
      </footer>

    </div>
  );
}
