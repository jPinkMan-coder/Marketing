'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface POItem {
  id: string;
  estimationItemId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  costHead: string;
  estimationRef?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  deliveryDate: string;
  terms: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  items: POItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
}

interface PurchaseOrderContextType {
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  getPurchaseOrderById: (id: string) => PurchaseOrder | undefined;
  editingPO: PurchaseOrder | null;
  setEditingPO: (po: PurchaseOrder | null) => void;
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

export function PurchaseOrderProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  // Load purchase orders from localStorage on mount
  useEffect(() => {
    const savedPOs = localStorage.getItem('purchaseOrders');
    if (savedPOs) {
      try {
        const parsed = JSON.parse(savedPOs);
        if (Array.isArray(parsed)) {
          setPurchaseOrders(parsed);
        } else {
          localStorage.removeItem('purchaseOrders');
        }
      } catch (error) {
        console.error('Error loading purchase orders from localStorage:', error);
        localStorage.removeItem('purchaseOrders');
      }
    }
  }, []);

  // Save purchase orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => {
    const totalAmount = poData.items.reduce((sum, item) => sum + item.totalCost, 0);
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${Date.now()}`,
      poNumber: poData.poNumber || `PO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount,
    };
    setPurchaseOrders(prev => [...prev, newPO]);
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        const updatedPO = { ...po, ...updates, updatedAt: new Date().toISOString() };
        if (updates.items) {
          updatedPO.totalAmount = updates.items.reduce((sum, item) => sum + item.totalCost, 0);
        }
        return updatedPO;
      }
      return po;
    }));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  const getPurchaseOrderById = (id: string) => {
    return purchaseOrders.find(po => po.id === id);
  };

  return (
    <PurchaseOrderContext.Provider value={{
      purchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      getPurchaseOrderById,
      editingPO,
      setEditingPO,
    }}>
      {children}
    </PurchaseOrderContext.Provider>
  );
}

export function usePurchaseOrder() {
  const context = useContext(PurchaseOrderContext);
  if (context === undefined) {
    throw new Error('usePurchaseOrder must be used within a PurchaseOrderProvider');
  }
  return context;
}