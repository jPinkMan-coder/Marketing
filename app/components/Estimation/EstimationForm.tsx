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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add, Delete, Save, Send } from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEstimation } from '../../context/EstimationContext';
import { useApp } from '../../context/AppContext';

interface EstimationItem {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface EstimationFormData {
  projectId: string;
  costHead: string;
  category: string;
  vendor: string;
  estimatedBy: string;
  items: EstimationItem[];
  notes: string;
}

const costHeads = [
  'OM01 - Material Cost',
  'OM02 - Manpower Cost',
  'OM03 - Subcontracting Cost',
  'OM04 - Equipment Cost',
  'OM05 - Transportation Cost',
  'OM06 - Miscellaneous Cost',
];

const categories = ['Materials', 'Labor', 'Equipment', 'Services', 'Other'];

export default function EstimationForm() {
  const { addEstimation } = useEstimation();
  const { currentProject, user } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<EstimationFormData>({
    defaultValues: {
      projectId: currentProject?.id || '',
      estimatedBy: user?.name || '',
      items: [{ description: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  const calculateTotal = (quantity: number, unitCost: number) => {
    return quantity * unitCost;
  };

  const getTotalEstimation = () => {
    return watchedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  const onSubmit = (data: EstimationFormData, isDraft = false) => {
    try {
      // Generate unique IDs for items
      const itemsWithIds = data.items.map((item, index) => ({
        ...item,
        id: `${Date.now()}-${index}`,
        costHead: data.costHead,
      }));

      addEstimation({
        projectId: data.projectId,
        costHead: data.costHead,
        category: data.category,
        vendor: data.vendor,
        estimatedBy: data.estimatedBy,
        items: itemsWithIds,
        notes: data.notes,
        status: isDraft ? 'draft' : 'submitted',
      });

      setShowSuccess(true);
      
      // Reset form after successful submission
      reset({
        projectId: currentProject?.id || '',
        estimatedBy: user?.name || '',
        costHead: '',
        category: '',
        vendor: '',
        notes: '',
        items: [{ description: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 }]
      });
    } catch (error) {
      console.error('Error saving estimation:', error);
      setShowError(true);
    }
  };

  const handleSaveDraft = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handleSubmitEstimation = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom fontWeight={600}>
            Create New Cost Estimation
          </Typography>
          
          <form>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project ID"
                  value={currentProject?.code || ''}
                  InputProps={{ readOnly: true }}
                  {...register('projectId')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cost Head"
                  select
                  {...register('costHead', { required: true })}
                >
                  {costHeads.map((head) => (
                    <MenuItem key={head} value={head}>
                      {head}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  select
                  {...register('category', { required: true })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor/Supplier"
                  {...register('vendor')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated By"
                  value={user?.name || ''}
                  InputProps={{ readOnly: true }}
                  {...register('estimatedBy', { required: true })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Cost Items
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={() => append({ description: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 })}
                variant="outlined"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
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
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const quantity = parseFloat(e.target.value) || 0;
                              const unitCost = watchedItems[index]?.unitCost || 0;
                              setValue(`items.${index}.totalCost`, calculateTotal(quantity, unitCost));
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          {...register(`items.${index}.unit`)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          {...register(`items.${index}.unitCost`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const unitCost = parseFloat(e.target.value) || 0;
                              const quantity = watchedItems[index]?.quantity || 0;
                              setValue(`items.${index}.totalCost`, calculateTotal(quantity, unitCost));
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          InputProps={{ readOnly: true }}
                          value={watchedItems[index]?.totalCost || 0}
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
                          disabled={fields.length === 1}
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

            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Total Estimation: ₹{getTotalEstimation().toLocaleString()}
              </Typography>
            </Box>

            <Grid container spacing={3}>
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

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<Save />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Send />}
                onClick={handleSubmitEstimation}
              >
                Submit Estimation
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Estimation saved successfully! The report page will now reflect your changes.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          Error saving estimation. Please try again.
        </Alert>
      </Snackbar>
    </>
  );
}