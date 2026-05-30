import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Order, OrderStatus } from './types';

// Detect if Firebase setup is complete (has real config)
export const isFirebaseEnabled = !!(
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== '' && 
  firebaseConfig.projectId !== 'YOUR_FIREBASE_PROJECT_ID'
);

let app: any = null;
let db: any = null;

if (isFirebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase initialized successfully!');
  } catch (err) {
    console.error('Failed to initialize Firebase with config:', err);
  }
} else {
  console.log('Firebase Config not complete. Operating in local storage simulation mode.');
}

// === Firestore Error Handling ===
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// === Emulated Local Storage DB ===
const LOCAL_STORAGE_ORDERS_KEY = 'li_dong_ji_orders';
const LOCAL_STORAGE_PASSWORD_KEY = 'li_dong_ji_admin_pwd';

// Simple PubSub for emulating real-time callbacks in the local mode
type ListenerCallback = (orders: Order[]) => void;
const listeners = new Set<ListenerCallback>();

function triggerLocalListeners() {
  const o = getLocalOrders();
  listeners.forEach(cb => cb(o));
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  triggerLocalListeners();
}

// === DB Adapters ===

/**
 * Listens for real-time order updates.
 * Unsubscribe function is returned.
 */
export function subscribeToOrders(onUpdate: (orders: Order[]) => void): () => void {
  if (isFirebaseEnabled && db) {
    const ordersCol = collection(db, 'orders');
    // Query ordered by creation time descending (newest on top)
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          tableNo: data.tableNo || '',
          status: data.status || 'pending',
          utensils: data.utensils || 'X',
          items: data.items || [],
          totalPrice: data.totalPrice || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          notes: data.notes || '',
        });
      });
      onUpdate(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return unsubscribe;
  } else {
    // Local emulate mode
    listeners.add(onUpdate);
    // Instant initial load
    onUpdate(getLocalOrders());
    return () => {
      listeners.delete(onUpdate);
    };
  }
}

/**
 * Submits a new customer order.
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const timestampIso = new Date().toISOString();
  
  if (isFirebaseEnabled && db) {
    try {
      const ordersCol = collection(db, 'orders');
      const docRef = await addDoc(ordersCol, {
        ...order,
        createdAt: timestampIso,
        updatedAt: timestampIso
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      throw err;
    }
  } else {
    // Local emulation
    const randomId = 'order_' + Math.random().toString(36).substr(2, 9);
    const newOrder: Order = {
      ...order,
      id: randomId,
      createdAt: timestampIso,
      updatedAt: timestampIso
    };
    const current = getLocalOrders();
    // Prepend new order (newest first)
    saveLocalOrders([newOrder, ...current]);
    return randomId;
  }
}

/**
 * Updates order preparation status.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const timestampIso = new Date().toISOString();
  
  if (isFirebaseEnabled && db) {
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        status,
        updatedAt: timestampIso
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  } else {
    // Local emulation
    const current = getLocalOrders();
    const updated = current.map(o => {
      if (o.id === orderId) {
        return { ...o, status, updatedAt: timestampIso };
      }
      return o;
    });
    saveLocalOrders(updated);
  }
}

/**
 * Checks if admin password exists or needs setting.
 * Returns null if no password is set, otherwise returns the password string/hash.
 */
export async function getAdminPassword(): Promise<string | null> {
  if (isFirebaseEnabled && db) {
    try {
      const configDocRef = doc(db, 'configs', 'admin');
      const snap = await getDoc(configDocRef);
      if (snap.exists()) {
        return snap.data().password || null;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'configs/admin');
      return null;
    }
  } else {
    // Local emulation
    return localStorage.getItem(LOCAL_STORAGE_PASSWORD_KEY);
  }
}

/**
 * Sets the initial admin password.
 */
export async function setAdminPassword(password: string): Promise<void> {
  const timestampIso = new Date().toISOString();
  
  if (isFirebaseEnabled && db) {
    try {
      const configDocRef = doc(db, 'configs', 'admin');
      await setDoc(configDocRef, {
        password,
        createdAt: timestampIso,
        updatedAt: timestampIso
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'configs/admin');
    }
  } else {
    // Local emulation
    localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY, password);
  }
}
