import React, { useState, useEffect } from 'react';
import { subscribeToOrders } from '../firebase';
import { Order, OrderStatus } from '../types';
import { Clock, Search, RefreshCw, CheckCircle, AlertTriangle, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderTrackerProps {
  initialTableNo?: string;
}

export default function OrderTracker({ initialTableNo = '' }: OrderTrackerProps) {
  const [searchTable, setSearchTable] = useState(initialTableNo);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync initial table search
  useEffect(() => {
    if (initialTableNo) {
      setSearchTable(initialTableNo);
    }
  }, [initialTableNo]);

  // Subscribe to real-time orders updates from Firebase or Emulation
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter orders by searched table (case insensitive, trim)
  const filteredOrders = orders.filter(
    order => order.tableNo.trim().toLowerCase() === searchTable.trim().toLowerCase()
  );

  // Status helper configuration
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: '收到新點單',
          sub: '廚房正在接收並派單...',
          colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
          stepIndex: 1,
        };
      case 'preparing':
        return {
          label: '製作烹煮中',
          sub: '師傅正熱騰騰為您烹煮...',
          colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
          stepIndex: 2,
        };
      case 'completed':
        return {
          label: '出餐已完成',
          sub: '餐點已送達！請好餐好茶慢用！',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          stepIndex: 3,
        };
      case 'cancelled':
        return {
          label: '點單已取消',
          sub: '如非本人操作請詳洽櫃檯。',
          colorClass: 'bg-gray-100 text-gray-500 border-gray-300',
          stepIndex: -1,
        };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="order-tracker-container">
      {/* Search Bar section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="text-amber-700" size={20} />
          即時點單進度查詢
        </h2>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          點單完成後，您可以於下方輸入您的 **桌號**，查看廚房爐灶的即時製作、配送出餐進度。
        </p>

        <div className="relative">
          <input
            type="text"
            placeholder="請輸入您的桌號查詢 (EX: A1)"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-12 pr-4 py-4 text-base font-bold font-mono text-gray-800 placeholder:font-normal placeholder:text-gray-300 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <RefreshCw className="animate-spin text-amber-700" size={24} />
          <span className="text-sm">即時爐點載入中...</span>
        </div>
      ) : searchTable.trim() === '' ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <Search size={36} className="mx-auto text-amber-700/30 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            請於上方填入您的桌號，我們為您抓取最新訂單資料！
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <AlertTriangle size={36} className="mx-auto text-orange-400 mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            目前查無「{searchTable}」桌的點單資料
          </p>
          <p className="text-xs text-gray-400 mt-1">
            訂單可能已被歸檔，或者尚未成功點單。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-amber-800">
              找到 {filteredOrders.length} 筆點單項目
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              點單即時更新中...
            </span>
          </div>

          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const config = getStatusConfig(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-5"
                >
                  {/* Status Banner */}
                  <div className={`flex justify-between items-start border p-4 rounded-2xl ${config.colorClass}`}>
                    <div>
                      <span className="text-xs uppercase tracking-wider opacity-80 font-bold block mb-1">
                        點單號碼: {order.id.substr(-6).toUpperCase()}
                      </span>
                      <h3 className="text-lg font-bold">{config.label}</h3>
                      <p className="text-xs opacity-90 mt-0.5">{config.sub}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs opacity-80 block">金額總計</span>
                      <span className="text-xl font-bold font-mono">${order.totalPrice}</span>
                    </div>
                  </div>

                  {/* Progressive Timeline Step Indicator */}
                  {order.status !== 'cancelled' && (
                    <div className="py-4 px-2">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute left-1/12 right-1/12 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-10">
                          <div 
                            className="bg-amber-700 h-full transition-all duration-500" 
                            style={{ 
                              width: order.status === 'pending' ? '0%' : order.status === 'preparing' ? '50%' : '100%' 
                            }}
                          ></div>
                        </div>

                        {/* Step 1: Pending */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                            config.stepIndex >= 1 
                              ? 'bg-amber-700 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            1
                          </div>
                          <span className="text-xs font-bold mt-2 text-gray-500">廚房接單</span>
                        </div>

                        {/* Step 2: Preparing */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                            config.stepIndex >= 2 
                              ? 'bg-amber-700 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            2
                          </div>
                          <span className="text-xs font-bold mt-2 text-gray-505">烹飪熱炒</span>
                        </div>

                        {/* Step 3: Completed */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                            config.stepIndex >= 3 
                              ? 'bg-amber-700 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            3
                          </div>
                          <span className="text-xs font-bold mt-2 text-gray-500">美味送達</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* items detail */}
                  <div className="bg-gray-50 rounded-2xl p-4 divide-y divide-gray-200/60 text-sm">
                    {order.items.map((it, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                        <div>
                          <span className="font-semibold text-gray-800">{it.baseName}</span>
                          <span className="text-xs text-gray-400 font-mono ml-2">x{it.quantity}</span>
                        </div>
                        <span className="font-mono font-semibold text-gray-650">${it.price * it.quantity}</span>
                      </div>
                    ))}

                    {(order.notes || order.utensils) && (
                      <div className="pt-3 mt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        <div>
                          <strong>餐具準備：</strong>
                          {order.utensils === 'V' ? '需要免洗餐具' : '免，自備餐具 (落實環保)'}
                        </div>
                        {order.notes && (
                          <div>
                            <strong>特別備註：</strong>
                            <span className="text-amber-800 font-medium">{order.notes}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-gray-400 font-mono text-right pt-1">
                          點單建立時間: {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
