'use client';
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Grid,
  Typography,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  ShoppingCart,
  Assignment,
} from '@mui/icons-material';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import StatsCard from './components/Dashboard/StatsCard';
import RecentActivity from './components/Dashboard/RecentActivity';
import EstimationForm from './components/Estimation/EstimationForm';
import POForm from './components/PurchaseOrders/POForm';
import CRSReport from './components/Reports/CRSReport';
import EstimationReports from './components/Reports/EstimationReports';
import PurchaseOrderReports from './components/Reports/PurchaseOrderReports';
import { useEstimation } from './context/EstimationContext';
import { usePurchaseOrder } from './context/PurchaseOrderContext';

const CostChart = dynamic(() => import('./components/Dashboard/CostChart'), {
  ssr: false
});

const collapsedSidebarWidth = 64;

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('');
  const { getProjectSummary } = useEstimation();
  const { setEditingEstimation } = useEstimation();
  const { setEditingPO } = usePurchaseOrder();
  
  const projectSummary = getProjectSummary();

  const handleCreateNewEstimation = () => {
    setEditingEstimation(null);
    setActiveTab('estimation');
    setActiveSubTab('form');
  };

  const handleEditEstimation = (estimationId: string) => {
    const { getEstimationById } = useEstimation();
    const estimation = getEstimationById(estimationId);
    if (estimation) {
      setEditingEstimation(estimation);
      setActiveTab('estimation');
      setActiveSubTab('form');
    }
  };

  const handleCreateNewPO = () => {
    setEditingPO(null);
    setActiveTab('purchase-orders');
    setActiveSubTab('form');
  };

  const handleEditPO = (poId: string) => {
    const { getPurchaseOrderById } = usePurchaseOrder();
    const po = getPurchaseOrderById(poId);
    if (po) {
      setEditingPO(po);
      setActiveTab('purchase-orders');
      setActiveSubTab('form');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Monitor project costs and financial performance
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Total Contract Value"
                  value={`₹${((projectSummary.totalEstimate || 0) / 100000).toFixed(1)}L`}
                  change={5.2}
                  icon={<AccountBalance />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Committed Costs"
                  value={`₹${((projectSummary.totalCommitted || 0) / 100000).toFixed(1)}L`}
                  change={-2.1}
                  icon={<ShoppingCart />}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Actual Costs"
                  value={`₹${((projectSummary.totalActual || 0) / 100000).toFixed(1)}L`}
                  change={8.3}
                  icon={<TrendingUp />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Active Estimates"
                  value="12"
                  change={15.5}
                  icon={<Assignment />}
                  color="secondary"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <CostChart />
              </Grid>
              <Grid item xs={12} lg={4}>
                <RecentActivity />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 'estimation':
        return (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Cost Estimation
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Create and manage cost estimations for project components
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <Button
                variant={activeSubTab === 'reports' || activeSubTab === '' ? 'contained' : 'outlined'}
                onClick={() => setActiveSubTab('reports')}
              >
                View Reports
              </Button>
              <Button
                variant={activeSubTab === 'form' ? 'contained' : 'outlined'}
                onClick={() => setActiveSubTab('form')}
              >
                {activeSubTab === 'form' ? 'Estimation Form' : 'Create New'}
              </Button>
            </Box>

            {activeSubTab === 'form' ? (
              <EstimationForm />
            ) : (
              <EstimationReports 
                onCreateNew={handleCreateNewEstimation}
                onEditEstimation={handleEditEstimation}
              />
            )}
          </Box>
        );
      
      case 'purchase-orders':
        return (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Purchase Orders
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Manage purchase orders and vendor commitments
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <Button
                variant={activeSubTab === 'reports' || activeSubTab === '' ? 'contained' : 'outlined'}
                onClick={() => setActiveSubTab('reports')}
              >
                View Reports
              </Button>
              <Button
                variant={activeSubTab === 'form' ? 'contained' : 'outlined'}
                onClick={() => setActiveSubTab('form')}
              >
                {activeSubTab === 'form' ? 'PO Form' : 'Create New'}
              </Button>
            </Box>
          </Box>
        );
      
      case 'reports':
        return (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Financial Reports
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Generate comprehensive financial reports and analysis
            </Typography>
            <CRSReport />
          </Box>
        );
      
      default:
        return (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This section is under development.
            </Typography>
          </Box>
        );
    }
  };

  // Reset sub-tab when main tab changes
  React.useEffect(() => {
    setActiveSubTab('');
  }, [activeTab]);

            {activeSubTab === 'form' ? (
              <POForm />
            ) : (
              <PurchaseOrderReports 
                onCreateNew={handleCreateNewPO}
                onEditPO={handleEditPO}
              />
            )}
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Header sidebarExpanded={false} />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100vw',
          pt: '80px', // Header height (64px) + padding (16px)
          pl: '80px', // Space for collapsed sidebar (64px + 16px padding)
          pr: 3,
          pb: 3,
          minHeight: '100vh',
          overflow: 'auto',
          maxWidth: 'calc(100vw - 80px)', // Account for sidebar space
          boxSizing: 'border-box',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}