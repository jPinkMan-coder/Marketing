'use client';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
} from '@mui/material';
import { 
  Save, 
  Send, 
  AttachFile, 
  Add, 
  Delete,
  Search,
  Assignment,
} from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';

interface EstimationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  costHead: string;
  estimationId: string;
  estimationRef: string;
}

interface POItem {
  estimationItemId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  costHead: string;
  estimationRef?: string;
}

interface POFormData {
  poNumber: string;
  vendor: string;
  deliveryDate: string;
  terms: string;
  status: string;
  items: POItem[];
  notes: string;
}

// Mock estimation data - in real app, this would come from API
const mockEstimations: EstimationItem[] = [
  {
    id: 'est-001-item-1',
    description: 'Cement - OPC 53 Grade',
    quantity: 100,
    unit: 'Bags',
    unitCost: 450,
    totalCost: 45000,
    costHead: 'OM01 - Material Cost',
    estimationId: 'EST-001',
    estimationRef: 'EST-001/2024',
  },
  {
    id: 'est-001-item-2',
    description: 'Steel Bars - 12mm TMT',
    quantity: 50,
    unit: 'Tons',
    unitCost: 65000,
    totalCost: 3250000,
    costHead: 'OM01 - Material Cost',
    estimationId: 'EST-001',
    estimationRef: 'EST-001/2024',
  },
  {
    id: 'est-002-item-1',
    description: 'Skilled Mason',
    quantity: 10,
    unit: 'Days',
    unitCost: 800,
    totalCost: 8000,
    costHead: 'OM02 - Manpower Cost',
    estimationId: 'EST-002',
    estimationRef: 'EST-002/2024',
  },
  {
    id: 'est-002-item-2',
    description: 'Helper/Laborer',
    quantity: 20,
    unit: 'Days',
    unitCost: 500,
    totalCost: 10000,
    costHead: 'OM02 - Manpower Cost',
    estimationId: 'EST-002',
    estimationRef: 'EST-002/2024',
  },
  {
    id: 'est-003-item-1',
    description: 'Excavator Rental',
    quantity: 5,
    unit: 'Days',
    unitCost: 12000,
    totalCost: 60000,
    costHead: 'OM04 - Equipment Cost',
    estimationId: 'EST-003',
    estimationRef: 'EST-003/2024',
  },
];

const vendors = [
  'ABC Construction Ltd.',
  'XYZ Materials Pvt. Ltd.',
  'Steel Works Inc.',
  'Equipment Rentals Corp.',
  'Transport Solutions Ltd.',
];

export default function POForm() {
  const [showEstimationDialog, setShowEstimationDialog] = useState(false);
  const [selectedEstimationItems, setSelectedEstimationItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, control, handleSubmit, watch, setValue, getValues } = useForm<POFormData>({
    defaultValues: {
      status: 'draft',
      items: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  const filteredEstimations = mockEstimations.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.costHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estimationRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEstimationItemToggle = (itemId: string) => {
    setSelectedEstimationItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const addEstimationItems = () => {
    const itemsToAdd = mockEstimations
      .filter(item => selectedEstimationItems.includes(item.id))
      .map(item => ({
        estimationItemId: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        costHead: item.costHead,
        estimationRef: item.estimationRef,
      }));

    const currentItems = getValues('items');
    replace([...currentItems, ...itemsToAdd]);
    
    setSelectedEstimationItems([]);
    setShowEstimationDialog(false);
  };

  const addCustomItem = () => {
    append({
      description: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      totalCost: 0,
      costHead: '',
    });
  };

  const calculateItemTotal = (index: number, field: 'quantity' | 'unitCost', value: number) => {
    const currentItems = getValues('items');
    const item = currentItems[index];
    const quantity = field === 'quantity' ? value : item.quantity;
    const unitCost = field === 'unitCost' ? value : item.unitCost;
    const total = quantity * unitCost;
    setValue(`items.${index}.totalCost`, total);
    return total;
  };

  const getTotalPOValue = () => {
    return watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  const onSubmit = (data: POFormData) => {
    console.log('PO submitted:', data);
    // Handle form submission
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="div" gutterBottom fontWeight={600}>
              Create Purchase Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate purchase orders from cost estimations or create custom orders
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Chip label="Draft" color="warning" />
          </Box>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PO Number"
                  {...register('poNumber', { required: true })}
                  placeholder="Auto-generated"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor"
                  select
                  {...register('vendor', { required: true })}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor} value={vendor}>
                      {vendor}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expected Delivery Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('deliveryDate', { required: true })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, height: '56px', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<Assignment />}
                    onClick={() => setShowEstimationDialog(true)}
                    sx={{ height: '100%' }}
                  >
                    Add from Estimations
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={addCustomItem}
                    sx={{ height: '100%' }}
                  >
                    Add Custom Item
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={600} gutterBottom>
              Purchase Order Items
            </Typography>

            {fields.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No items added yet. Use "Add from Estimations" to select items from cost estimations or "Add Custom Item" to create new items.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Cost Head</TableCell>
                      <TableCell>Estimation Ref</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Unit Cost (₹)</TableCell>
                      <TableCell>Total Cost (₹)</TableCell>
                      <TableCell width="50">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            {...register(`items.${index}.description`)}
                            disabled={!!watchedItems[index]?.estimationItemId}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            {...register(`items.${index}.costHead`)}
                            disabled={!!watchedItems[index]?.estimationItemId}
                          />
                        </TableCell>
                        <TableCell>
                          {watchedItems[index]?.estimationRef ? (
                            <Chip 
                              label={watchedItems[index].estimationRef} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Custom Item
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            {...register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                              onChange: (e) => calculateItemTotal(index, 'quantity', parseFloat(e.target.value) || 0)
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            {...register(`items.${index}.unit`)}
                            disabled={!!watchedItems[index]?.estimationItemId}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            {...register(`items.${index}.unitCost`, {
                              valueAsNumber: true,
                              onChange: (e) => calculateItemTotal(index, 'unitCost', parseFloat(e.target.value) || 0)
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={watchedItems[index]?.totalCost || 0}
                            InputProps={{ readOnly: true }}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                bgcolor: 'background.default',
                                fontWeight: 600,
                              } 
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => remove(index)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {fields.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Total PO Value: ₹{getTotalPOValue().toLocaleString()}
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Terms & Conditions"
                  multiline
                  rows={4}
                  {...register('terms')}
                  placeholder="Payment terms, delivery conditions, warranties, etc."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes/Comments"
                  multiline
                  rows={3}
                  {...register('notes')}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="outlined" startIcon={<AttachFile />}>
                Attach Files
              </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<Save />}>
                  Save Draft
                </Button>
                <Button 
                  variant="contained" 
                  type="submit" 
                  startIcon={<Send />}
                  disabled={fields.length === 0}
                >
                  Submit for Approval
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Estimation Items Selection Dialog */}
      <Dialog 
        open={showEstimationDialog} 
        onClose={() => setShowEstimationDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Select Items from Cost Estimations</Typography>
            <TextField
              size="small"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ width: 300 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Select</TableCell>
                  <TableCell>Estimation Ref</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Cost Head</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Unit Cost (₹)</TableCell>
                  <TableCell>Total Cost (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEstimations.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedEstimationItems.includes(item.id)}
                        onChange={() => handleEstimationItemToggle(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.estimationRef} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.costHead}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>₹{item.unitCost.toLocaleString()}</TableCell>
                    <TableCell>₹{item.totalCost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedEstimationItems.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="body2" color="primary.dark">
                {selectedEstimationItems.length} item(s) selected
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEstimationDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={addEstimationItems}
            disabled={selectedEstimationItems.length === 0}
          >
            Add Selected Items ({selectedEstimationItems.length})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}