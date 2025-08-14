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
  Visibility,
  Send,
  FileCopy,
} from '@mui/icons-material';
import { useEstimation } from '../../context/EstimationContext';

interface EstimationReportsProps {
  onCreateNew: () => void;
  onEditEstimation: (estimationId: string) => void;
}

export default function EstimationReports({ onCreateNew, onEditEstimation }: EstimationReportsProps) {
  const { estimations, deleteEstimation, updateEstimation } = useEstimation();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEstimation, setSelectedEstimation] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, estimationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedEstimation(estimationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEstimation(null);
  };

  const handleDelete = (id: string) => {
    deleteEstimation(id);
    setDeleteDialog(null);
  };

  const handleSubmit = (id: string) => {
    updateEstimation(id, { status: 'submitted' });
    handleMenuClose();
  };

  const handleDuplicate = (estimation: any) => {
    // Create a copy with new ID and draft status
    const duplicatedEstimation = {
      ...estimation,
      projectName: `${estimation.projectName} (Copy)`,
      status: 'draft' as const,
    };
    delete duplicatedEstimation.id;
    delete duplicatedEstimation.createdAt;
    delete duplicatedEstimation.updatedAt;
    delete duplicatedEstimation.totalAmount;
    
    // Add the duplicated estimation
    // Note: This would need to be implemented in the context
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
                Cost Estimation Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage all cost estimations - drafts, submitted, and approved
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateNew}
              sx={{ height: 'fit-content' }}
            >
              Create New Estimation
            </Button>
          </Box>

          {estimations.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No cost estimations found. Click "Create New Estimation" to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estimation ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Project Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Company</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Items Count</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estimations.map((estimation) => (
                    <TableRow key={estimation.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {estimation.id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {estimation.projectName}
                      </TableCell>
                      <TableCell>{estimation.companyName}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatCurrency(estimation.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={estimation.status.toUpperCase()}
                          color={getStatusColor(estimation.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(estimation.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${estimation.items.length} items`}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Estimation">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEditEstimation(estimation.id)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, estimation.id)}
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
        {selectedEstimation && (
          <>
            <MenuItem onClick={() => onEditEstimation(selectedEstimation)}>
              <Edit sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>
            
            {estimations.find(e => e.id === selectedEstimation)?.status === 'draft' && (
              <MenuItem onClick={() => handleSubmit(selectedEstimation)}>
                <Send sx={{ mr: 1 }} fontSize="small" />
                Submit for Approval
              </MenuItem>
            )}
            
            <MenuItem onClick={() => handleDuplicate(estimations.find(e => e.id === selectedEstimation))}>
              <FileCopy sx={{ mr: 1 }} fontSize="small" />
              Duplicate
            </MenuItem>
            
            <MenuItem 
              onClick={() => {
                setDeleteDialog(selectedEstimation);
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
            Are you sure you want to delete this cost estimation? This action cannot be undone.
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