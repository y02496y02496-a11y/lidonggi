import React, { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrderStatus, getAdminPassword, setAdminPassword, isFirebaseEnabled } from '../firebase';
import { Order, OrderStatus } from '../types';
import { RESTAURANT_INFO } from '../data';
import { 
  Lock, CheckCircle, Clock, AlertTriangle, TrendingUp, Settings, 
  BarChart3, RefreshCw, Layers, ShieldCheck, Dumbbell, Egg, Eye, Ban, Utensils
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'settings'>('orders');

  // Authentication state
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Orders filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchTable, setOrderSearchTable] = useState<string>('');

  // Fetch password status on load
  useEffect(() => {
    checkPasswordStatus();
    
    // Check if authenticated in current session
    const sessAuth = sessionStorage.getItem('li_dong_ji_admin_auth');
    if (sessAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Listen to orders ONLY if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const checkPasswordStatus = async () => {
    try {
      const pwd = await getAdminPassword();
      setHasPassword(!!pwd);
    } catch {
      setHasPassword(false);
    }
  };

  // Set the password for the first time
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!newPassword1.trim()) {
      setAuthError('密碼不能為空！');
      return;
    }
    if (newPassword1 !== newPassword2) {
      setAuthError('兩次輸入的密碼不一致！');
      return;
    }

    try {
      await setAdminPassword(newPassword1);
      setHasPassword(true);
      setIsAuthenticated(true);
      sessionStorage.setItem('li_dong_ji_admin_auth', 'true');
    } catch (err: any) {
      setAuthError('設定密碼失敗：' + err.message);
    }
  };

  // Standard unlock verify password
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const actualPwd = await getAdminPassword();
      if (actualPwd === enteredPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem('li_dong_ji_admin_auth', 'true');
      } else {
        setAuthError('密碼錯誤！請重新輸入。');
      }
    } catch (err: any) {
      setAuthError('驗證失敗，請重新嘗試：' + err.message);
    }
  };

  // Sign out admin
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('li_dong_ji_admin_auth');
    setEnteredPassword('');
  };

  // Change order status action
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err: any) {
      alert('更新訂單狀態失敗: ' + err.message);
    }
  };

  // Change existing password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (newPassword1 !== newPassword2) {
      setAuthError('密碼不一致！');
      return;
    }
    try {
      await setAdminPassword(newPassword1);
      alert('密碼重設成功！');
      setNewPassword1('');
      setNewPassword2('');
    } catch (err: any) {
      setAuthError('更新密碼失敗:' + err.message);
    }
  };

  // --- ANALYTICS ENGINE CALCULATIONS ---
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const finishedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const totalSalesRevenue = finishedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrdersCount = orders.length;

  // 1. Top Selling menu items calculation
  const itemSalesMap: { [baseName: string]: { qty: number; revenue: number } } = {};
  orders.forEach(order => {
    // We count either all orders or completed orders only for sales metrics: finished only is more professional!
    if (order.status === 'completed') {
      order.items.forEach(it => {
        const key = it.baseName.split(' (')[0]; // simplify names for nice clean chart labels
        if (!itemSalesMap[key]) {
          itemSalesMap[key] = { qty: 0, revenue: 0 };
        }
        itemSalesMap[key].qty += it.quantity;
        itemSalesMap[key].revenue += it.price * it.quantity;
      });
    }
  });

  const topSellers = Object.entries(itemSalesMap)
    .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
    .sort((a, b) => b.qty - a.qty);

  // 2. Main Carbs Ratio
  const carbCounts = { 麵: 0, 河粉: 0, 麵線: 0, 冬粉: 0, 飯: 0, 無: 0 };
  orders.forEach(o => {
    if (o.status === 'completed') {
      o.items.forEach(it => {
        if (it.base in carbCounts) {
          carbCounts[it.base as keyof typeof carbCounts] += it.quantity;
        }
      });
    }
  });

  // 3. Choice distribution (綜合 vs 全肉)
  let mixCount = 0;
  let meatCount = 0;
  orders.forEach(o => {
    if (o.status === 'completed') {
      o.items.forEach(it => {
        if (it.type === '綜合') mixCount += it.quantity;
        else if (it.type === '全肉') meatCount += it.quantity;
      });
    }
  });

  // 4. Egg usage
  let withEggCount = 0;
  let totalCount = 0;
  orders.forEach(o => {
    if (o.status === 'completed') {
      o.items.forEach(it => {
        totalCount += it.quantity;
        if (it.addEgg) withEggCount += it.quantity;
      });
    }
  });
  const eggRate = totalCount > 0 ? Math.round((withEggCount / totalCount) * 100) : 0;

  // Filter orders view
  const searchFormatted = orderSearchTable.trim().toLowerCase();
  const filteredOrdersView = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesTable = searchFormatted === '' || o.tableNo.toLowerCase().includes(searchFormatted);
    return matchesStatus && matchesTable;
  });

  // --- RENDERING SECURITY GATES ---
  if (hasPassword === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-2">
        <RefreshCw className="animate-spin text-amber-700" size={28} />
        <span>安全通道驗證中...</span>
      </div>
    );
  }

  // First time prompt setup password
  if (!hasPassword) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6 my-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-700 mb-2">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">首次設定管理密碼</h2>
          <p className="text-sm text-gray-400">
            這是您第一次進入李東記點單後台，請設定一組管理密碼，用於後續核對。
          </p>
        </div>

        <form onSubmit={handleSetupPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">輸入管理者密碼</label>
            <input
              type="password"
              placeholder="請設定管理密碼"
              required
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-lg font-mono text-gray-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">再次確認新密碼</label>
            <input
              type="password"
              placeholder="請再次輸入相同密碼"
              required
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-lg font-mono text-gray-800 transition-all"
            />
          </div>

          {authError && <div className="p-3 text-rose-700 bg-rose-50 rounded-xl text-xs">{authError}</div>}

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            保存設定並登入
          </button>
        </form>
      </div>
    );
  }

  // Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6 my-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-700 mb-2">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">登入後台系統</h2>
          <p className="text-sm text-gray-400">
            請輸入管理密碼以查看訂單監控與銷量分析報表。
          </p>
        </div>

        <form onSubmit={handleVerifyPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">管理者密碼</label>
            <input
              type="password"
              placeholder="請輸入後台認證密碼"
              required
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-lg font-mono text-gray-800 transition-all text-center tracking-widest focus:placeholder:text-transparent"
            />
          </div>

          {authError && <div className="p-3 text-rose-700 bg-rose-50 rounded-xl text-xs text-center">{authError}</div>}

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            認證並解鎖後台
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-300 font-mono">
          ※ 密碼安全防護層 & Firestore 即時規則同步中
        </p>
      </div>
    );
  }

  // --- LOCKED MAIN WATERFALL CONTENT ---
  return (
    <div className="space-y-6" id="admin-main">
      
      {/* Top Admin Navigation Header */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Clock size={16} />
            即時訂單監控 ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <BarChart3 size={16} />
            銷量分析報表
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Settings size={16} />
            後台管理設定
          </button>
        </div>

        {/* Database Status Banner */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg select-none">
            <span className={`w-2 h-2 rounded-full ${isFirebaseEnabled ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></span>
            資料儲存體: {isFirebaseEnabled ? 'Firestore 雲端' : '在地高響應緩衝'}
          </div>

          <button
            onClick={handleLogout}
            className="text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            登出管理
          </button>
        </div>
      </div>

      {/* Metric Quick Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">本日售出營業總額</span>
          <span className="text-2xl md:text-3xl font-black font-mono text-amber-700 mt-1 block">
            ${totalSalesRevenue}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">僅計完成出餐訂單</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">累計收單宗數</span>
          <span className="text-2xl md:text-3xl font-black font-mono text-gray-800 mt-1 block">
            {totalOrdersCount} 筆
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 block flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            點單系統即時監控
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">製作排程中</span>
          <span className="text-2xl md:text-3xl font-black font-mono text-orange-600 mt-1 block">
            {activeOrders.length} 筆
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">待廚房核收或製作</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-400 font-medium block">取消點單退單率</span>
          <span className="text-2xl md:text-3xl font-black font-mono text-rose-600 mt-1 block">
            {totalOrdersCount > 0 ? Math.round((cancelledOrders.length / totalOrdersCount) * 100) : 0}%
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">異常/作廢訂單 {cancelledOrders.length} 筆</span>
        </div>
      </div>

      {/* --- SCREEN 1: ORDERS MONITOR --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Filters Subpanel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['all', 'pending', 'preparing', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === status
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-gray-100'
                  }`}
                >
                  {status === 'all' && '全部'}
                  {status === 'pending' && '待接單'}
                  {status === 'preparing' && '製作中'}
                  {status === 'completed' && '已完成'}
                  {status === 'cancelled' && '已取消'}
                </button>
              ))}
            </div>

            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="搜尋指定桌號 (EX: A1)"
                value={orderSearchTable}
                onChange={(e) => setOrderSearchTable(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-xl px-4 py-2 text-xs font-semibold placeholder:font-normal placeholder:text-gray-300"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <RefreshCw className="animate-spin text-amber-700 mx-auto mb-2" size={24} />
              <span>實體資料擷取中...</span>
            </div>
          ) : filteredOrdersView.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400">
              <Layers size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold">此分類下目前沒有點單資料</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="admin-orders-grid">
              {filteredOrdersView.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                >
                  
                  {/* Header */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="bg-amber-50 px-2.5 py-1 rounded-xl text-amber-900 border border-amber-100">
                        <span className="text-sm font-black font-mono">{order.tableNo} 桌</span>
                      </div>
                      
                      {/* Interactive Status Indicator Action Ring */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        order.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        order.status === 'preparing' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {order.status === 'pending' && '待確認'}
                        {order.status === 'preparing' && '熱炒製作中'}
                        {order.status === 'completed' && '出餐完成'}
                        {order.status === 'cancelled' && '已取消'}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-gray-400 font-mono flex justify-between">
                      <span>點單碼: {order.id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Order Items Details List */}
                  <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs divide-y divide-gray-200/40">
                    {order.items.map((it, i) => (
                      <div key={i} className="pt-2 first:pt-0 flex justify-between items-baseline">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 whitespace-pre-wrap">{it.baseName}</span>
                          {it.type !== '無' && (
                            <span className="text-[10px] text-amber-800">
                              (配料：{it.type})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-gray-500 shrink-0 ml-1">x{it.quantity}</span>
                      </div>
                    ))}

                    <div className="pt-2 text-[11px] text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>餐具：</span>
                        <span className={`font-semibold ${order.utensils === 'V' ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {order.utensils === 'V' ? '需要餐具' : '免餐具'}
                        </span>
                      </div>
                      {order.notes && (
                        <div className="bg-amber-50 p-2 rounded-lg text-amber-900 border border-amber-100">
                          <strong>特別備註：</strong>
                          {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-baseline text-xs font-semibold px-1">
                      <span className="text-gray-400">總付費</span>
                      <span className="text-base font-mono font-bold text-amber-800">${order.totalPrice}</span>
                    </div>
                    
                    {/* Real-time Order Action Triggers */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            接受訂單並製作
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-700 font-bold py-2 rounded-xl text-xs transition-all border border-gray-200"
                          >
                            取消此筆
                          </button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white col-span-2 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle size={14} />
                            完成並配送上桌 (已付款)
                          </button>
                        </>
                      )}

                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'pending')}
                          className="col-span-2 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold py-1.5 rounded-xl text-xs transition-all border border-gray-200"
                        >
                          重新開啟為新單
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SCREEN 2: SALES VOLUME & ANALYTICS DASHBOARD --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6" id="analytics-panel">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Hot Selling Items list bar chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingUp size={18} className="text-amber-700" />
                熱銷品項排行榜 (已出餐統計)
              </h3>
              
              <div className="space-y-4 pt-2">
                {topSellers.length === 0 ? (
                  <p className="text-gray-400 text-center py-10 text-sm">目前尚無成功出餐資料可供統計分析</p>
                ) : (
                  topSellers.map((seller, idx) => {
                    // Maximum for styling calculations
                    const maxQty = Math.max(...topSellers.map(s => s.qty));
                    const percentage = maxQty > 0 ? (seller.qty / maxQty) * 100 : 0;
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs font-semibold">
                          <span className="text-gray-700 flex items-center gap-1">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                              idx === 0 ? 'bg-amber-700 text-white font-black' :
                              idx === 1 ? 'bg-amber-600/80 text-white' :
                              idx === 2 ? 'bg-amber-500/60 text-amber-900' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {idx + 1}
                            </span>
                            {seller.name}
                          </span>
                          
                          <span className="font-mono text-gray-500 font-bold">
                            {seller.qty} 份 (${seller.revenue})
                          </span>
                        </div>

                        {/* Bar Graphic design */}
                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-200/40">
                          <div 
                            className="bg-amber-700 h-full rounded-full transition-all duration-750"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Main Side Stats Doughnut representation */}
            <div className="bg-white rounded-3xl p-6 border border-[#fefcf8] shadow-md space-y-5">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <Layers size={18} className="text-amber-700" />
                飽食主食選擇比例
              </h3>

              <div className="space-y-3 pt-2">
                {Object.entries(carbCounts).map(([carb, count]) => {
                  const maxCarbQty = Math.max(...Object.values(carbCounts));
                  const percentage = maxCarbQty > 0 ? (count / maxCarbQty) * 100 : 0;
                  if (count === 0) return null;

                  return (
                    <div key={carb} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-bold text-gray-500 text-right">{carb === '無' ? '僅湯' : carb}</span>
                      <div className="flex-1 h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div 
                          className="bg-amber-700/80 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-12 font-mono text-xs font-bold text-gray-600 text-right">{count} 份</span>
                    </div>
                  );
                })}
                {Object.values(carbCounts).every(c => c === 0) && (
                  <p className="text-gray-400 text-center py-10 text-sm">目前無主食比例統計</p>
                )}
              </div>
            </div>
          </div>

          {/* Sub Row details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Mix vs Meat ratio */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-500 flex items-center gap-1 mb-3">
                  <ShieldCheck size={16} className="text-amber-700" />
                  綜合/全肉 客群偏好
                </h3>
                
                <p className="text-xs text-gray-400">
                  綜合包含內臟等精挑碎品 (豬肚、大腸等)，全肉則專為肉排愛好者設計。
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>綜合 (肉品+內臟)</span>
                  <span className="font-mono">{mixCount} 份</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-751">
                  <span>全肉 (上品豚肉)</span>
                  <span className="font-mono">{meatCount} 份</span>
                </div>

                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex text-white text-[10px] font-black font-mono">
                  {mixCount + meatCount > 0 ? (
                    <>
                      <div 
                        style={{ width: `${Math.round((mixCount / (mixCount + meatCount)) * 100)}%` }} 
                        className="bg-amber-700 flex items-center justify-center transition-all"
                      >
                        {mixCount > 0 && `${Math.round((mixCount / (mixCount + meatCount)) * 100)}%`}
                      </div>
                      <div 
                        style={{ width: `${Math.round((meatCount / (mixCount + meatCount)) * 100)}%` }} 
                        className="bg-amber-500 flex items-center justify-center transition-all grow"
                      >
                        {meatCount > 0 && `${Math.round((meatCount / (mixCount + meatCount)) * 100)}%`}
                      </div>
                    </>
                  ) : (
                    <div className="w-full bg-gray-200 text-gray-400 flex items-center justify-center font-normal">無銷售資料</div>
                  )}
                </div>
              </div>
            </div>

            {/* Egg Rate Counter */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-gray-500 flex items-center gap-1">
                <Egg size={16} className="text-amber-700" />
                加蛋點餐比率 (營養加分)
              </h3>
              
              <div className="flex items-center gap-4 py-3">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  {/* Dynamic Circular SVG Progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#d97706" strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - eggRate / 100)}
                    />
                  </svg>
                  <span className="absolute text-xl font-mono font-black text-amber-700">{eggRate}%</span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-800">生鮮加蛋比例</p>
                  <p className="text-xs text-gray-400">
                    本日累計加蛋 {withEggCount} 份。加蛋有助於湯頭口感更濃郁！
                  </p>
                </div>
              </div>
            </div>

            {/* Utensil Environmental Stats */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-gray-500 flex items-center gap-1">
                <Utensils size={16} className="text-amber-700" />
                環保無餐具比率
              </h3>

              {/* Calculated counts */}
              {(() => {
                const yesU = finishedOrders.filter(d => d.utensils === 'V').length;
                const noU = finishedOrders.filter(d => d.utensils === 'X').length;
                const totalU = yesU + noU;
                const ecoPercentage = totalU > 0 ? Math.round((noU / totalU) * 100) : 0;

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-extrabold font-mono text-emerald-600">{ecoPercentage}%</span>
                      <span className="text-xs text-gray-400">
                        免餐具：{noU} 筆 / 需要：{yesU} 筆
                      </span>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all" 
                        style={{ width: `${ecoPercentage}%` }}
                      ></div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      配合政府落實餐飲減塑與免洗餐具使用，提倡客戶內用自備餐具落實環保綠生活！
                    </p>
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      )}

      {/* --- SCREEN 3: ADMINISTRATIVE SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-lg space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Lock className="text-amber-700" size={20} />
            <span className="font-bold text-lg text-gray-800">變更管理者密碼</span>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">新密碼</label>
              <input
                type="password"
                placeholder="請輸入新管理密碼"
                required
                value={newPassword1}
                onChange={(e) => setNewPassword1(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm text-gray-800 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">再次輸入密碼二</label>
              <input
                type="password"
                placeholder="請確認新密碼"
                required
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm text-gray-800 transition-all font-mono"
              />
            </div>

            {authError && <div className="p-3 text-rose-700 bg-rose-50 rounded-xl text-xs">{authError}</div>}

            <button
              type="submit"
              className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-md transition-all text-sm"
            >
              保存更新
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
