'use client';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  MoreVert,
  Send,
  FileCopy,
  Print,
} from '@mui/icons-material';
import { usePurchaseOrder } from '../../context/PurchaseOrderContext';

interface PurchaseOrderReportsProps {
  onCreateNew: () => void;
  onEditPO: (poId: string) => void;
}

export default function PurchaseOrderReports({ onCreateNew, onEditPO }: PurchaseOrderReportsProps) {
  const { purchaseOrders, deletePurchaseOrder, updatePurchaseOrder } = usePurchaseOrder();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, poId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPO(poId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPO(null);
  };

  const handleDelete = (id: string) => {
    deletePurchaseOrder(id);
    setDeleteDialog(null);
  };

  const handleSubmit = (id: string) => {
    updatePurchaseOrder(id, { status: 'submitted' });
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'submitted': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" component="div" fontWeight={600} gutterBottom>
                Purchase Order Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage all purchase orders - drafts, submitted, and approved
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateNew}
              sx={{ height: 'fit-content' }}
            >
              Create New Purchase Order
            </Button>
          </Box>

          {purchaseOrders.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No purchase orders found. Click "Create New Purchase Order" to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>PO Number</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vendor</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Delivery Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Items Count</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {po.poNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {po.vendor}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatCurrency(po.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={po.status.toUpperCase()}
                          color={getStatusColor(po.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(po.deliveryDate)}</TableCell>
                      <TableCell>{formatDate(po.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${po.items.length} items`}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Purchase Order">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEditPO(po.id)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, po.id)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedPO && (
          <>
            <MenuItem onClick={() => onEditPO(selectedPO)}>
              <Edit sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>
            
            {purchaseOrders.find(po => po.id === selectedPO)?.status === 'draft' && (
              <MenuItem onClick={() => handleSubmit(selectedPO)}>
                <Send sx={{ mr: 1 }} fontSize="small" />
                Submit for Approval
              </MenuItem>
            )}
            
            <MenuItem onClick={handleMenuClose}>
              <Print sx={{ mr: 1 }} fontSize="small" />
              Print PO
            </MenuItem>
            
            <MenuItem 
              onClick={() => {
                setDeleteDialog(selectedPO);
                handleMenuClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Delete sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this purchase order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            onClick={() => deleteDialog && handleDelete(deleteDialog)} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}