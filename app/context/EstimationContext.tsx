'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface EstimationItem {
  id: string;
  partNumber: string;
  partDescription: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface Estimation {
  id: string;
  projectId: string;
  projectName: string;
  company: string;
  companyName: string;
  baseCurrency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  items: EstimationItem[];
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
}

export interface CRSReportData {
  slNo: string;
  particulars: string;
  estimate: number | null;
  committed: number | null;
  uncommitted: number | null;
  actual: number | null;
  anticipated: number | null;
  variance: number | null;
  variancePercent: number | null;
}

interface EstimationContextType {
  estimations: Estimation[];
  addEstimation: (estimation: Omit<Estimation, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => void;
  updateEstimation: (id: string, estimation: Partial<Estimation>) => void;
  deleteEstimation: (id: string) => void;
  getEstimationById: (id: string) => Estimation | undefined;
  getEstimationsByProject: (projectId: string) => Estimation[];
  getCRSReportData: () => CRSReportData[];
  getTotalsByCategory: () => Record<string, number>;
  getProjectSummary: () => {
    totalEstimate: number;
    totalCommitted: number;
    totalActual: number;
    totalVariance: number;
    variancePercent: number;
  };
  editingEstimation: Estimation | null;
  setEditingEstimation: (estimation: Estimation | null) => void;
}

const EstimationContext = createContext<EstimationContextType | undefined>(undefined);

export function EstimationProvider({ children }: { children: ReactNode }) {
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [editingEstimation, setEditingEstimation] = useState<Estimation | null>(null);

  // Load estimations from localStorage on mount
  useEffect(() => {
    const savedEstimations = localStorage.getItem('estimations');
    if (savedEstimations) {
      try {
        const parsed = JSON.parse(savedEstimations);
        if (Array.isArray(parsed)) {
          setEstimations(parsed);
        } else {
          // If the saved data is not an array, it's corrupted/stale.
          localStorage.removeItem('estimations');
        }
      } catch (error) {
        console.error('Error loading estimations from localStorage:', error);
        // If parsing fails, the data is corrupted.
        localStorage.removeItem('estimations');
      }
    }
  }, []);

  // Save estimations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('estimations', JSON.stringify(estimations));
  }, [estimations]);

  const addEstimation = (estimationData: Omit<Estimation, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => {
    const totalAmount = estimationData.items.reduce((sum, item) => sum + item.totalCost, 0);
    const newEstimation: Estimation = {
      ...estimationData,
      id: `EST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount,
    };
    setEstimations(prev => [...prev, newEstimation]);
  };

  const updateEstimation = (id: string, updates: Partial<Estimation>) => {
    setEstimations(prev => prev.map(est => {
      if (est.id === id) {
        const updatedEst = { ...est, ...updates, updatedAt: new Date().toISOString() };
        if (updates.items) {
          updatedEst.totalAmount = updates.items.reduce((sum, item) => sum + item.totalCost, 0);
        }
        return updatedEst;
      }
      return est;
    }));
  };

  const deleteEstimation = (id: string) => {
    setEstimations(prev => prev.filter(est => est.id !== id));
  };

  const getEstimationById = (id: string) => {
    return estimations.find(est => est.id === id);
  };

  const getEstimationsByProject = (projectId: string) => {
    return estimations.filter(est => est.projectId === projectId);
  };

  const getTotalsByCategory = () => {
    const totals: Record<string, number> = {};
    estimations.forEach(estimation => {
      if (estimation.status === 'approved' || estimation.status === 'submitted') {
        estimation.items.forEach(item => {
          totals[item.category] = (totals[item.category] || 0) + item.totalCost;
        });
      }
    });
    return totals;
  };

  const getCRSReportData = (): CRSReportData[] => {
    // Group by category
    // For demo, use mock committed/actual data per category
    const MOCK_CATEGORY_DATA: Record<string, { actual: number; committed: number }> = {
      'Materials': { actual: 45000, committed: 42000 },
      'Labor': { actual: 18000, committed: 15000 },
      'Equipment': { actual: 12000, committed: 10000 },
      'Services': { actual: 8000, committed: 7500 },
      'Other': { actual: 5000, committed: 4500 },
    };
    const totalsByCategory = getTotalsByCategory();
    return Object.entries(totalsByCategory).map(([category, estimate], idx) => {
      const mock = MOCK_CATEGORY_DATA[category] || { actual: 0, committed: 0 };
      const actual = mock.actual;
      const committed = mock.committed;
      const uncommitted = Math.max(0, estimate - committed);
      const anticipated = actual + uncommitted;
      const variance = anticipated - estimate;
      const variancePercent = estimate > 0 ? (variance / estimate) * 100 : 0;
      return {
        slNo: String(idx + 1),
        particulars: category,
        estimate: estimate > 0 ? estimate : null,
        committed: committed > 0 ? committed : null,
        uncommitted: uncommitted > 0 ? uncommitted : null,
        actual: actual > 0 ? actual : null,
        anticipated: anticipated > 0 ? anticipated : null,
        variance: Math.abs(variance) > 0 ? variance : null,
        variancePercent: Math.abs(variancePercent) > 0.01 ? variancePercent : null,
      };
    });
  };

  const getProjectSummary = () => {
    const reportData = getCRSReportData();
    const totalEstimate = reportData.reduce((sum, item) => sum + (item.estimate || 0), 0);
    const totalCommitted = reportData.reduce((sum, item) => sum + (item.committed || 0), 0);
    const totalActual = reportData.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalVariance = reportData.reduce((sum, item) => sum + (item.variance || 0), 0);
    const variancePercent = totalEstimate > 0 ? (totalVariance / totalEstimate) * 100 : 0;

    return {
      totalEstimate,
      totalCommitted,
      totalActual,
      totalVariance,
      variancePercent,
    };
  };

  return (
    <EstimationContext.Provider value={{
      estimations,
      addEstimation,
      updateEstimation,
      deleteEstimation,
      getEstimationById,
      getEstimationsByProject,
      getCRSReportData,
      getTotalsByCategory,
      getProjectSummary,
      editingEstimation,
      setEditingEstimation,
    }}>
      {children}
    </EstimationContext.Provider>
  );
}

export function useEstimation() {
  const context = useContext(EstimationContext);
  if (context === undefined) {
    throw new Error('useEstimation must be used within an EstimationProvider');
  }
  return context;
}