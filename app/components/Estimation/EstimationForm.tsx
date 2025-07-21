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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import { Add, Delete, Save, Send, Upload, CloudUpload } from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEstimation } from '../../context/EstimationContext';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadSeverity, setUploadSeverity] = useState<'success' | 'error' | 'warning'>('success');

  const { register, control, handleSubmit, watch, setValue, reset, getValues } = useForm<EstimationFormData>({
    defaultValues: {
      projectId: currentProject?.id || '',
      estimatedBy: user?.name || '',
      items: [] // Start with no items
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
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
        items: [] // Reset to no items
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    setUploadMessage('');

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Handle CSV files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processUploadedData(results.data, file.name);
        },
        error: (error) => {
          setUploadProgress(false);
          setUploadMessage(`Error parsing CSV file: ${error.message}`);
          setUploadSeverity('error');
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert array of arrays to array of objects
          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            const objectData = rows.map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            processUploadedData(objectData, file.name);
          } else {
            setUploadProgress(false);
            setUploadMessage('The Excel file appears to be empty.');
            setUploadSeverity('error');
          }
        } catch (error) {
          setUploadProgress(false);
          setUploadMessage(`Error parsing Excel file: ${error}`);
          setUploadSeverity('error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadProgress(false);
      setUploadMessage('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      setUploadSeverity('error');
    }

    // Reset the input
    event.target.value = '';
  };

  const processUploadedData = (data: any[], fileName: string) => {
    try {
      // Define possible column name variations
      const columnMappings = {
        description: ['description', 'item', 'item description', 'particulars', 'details'],
        quantity: ['quantity', 'qty', 'amount', 'number'],
        unit: ['unit', 'uom', 'unit of measurement', 'measure'],
        unitCost: ['unit cost', 'unitcost', 'rate', 'price', 'unit price', 'cost per unit'],
        totalCost: ['total cost', 'totalcost', 'total', 'amount', 'total amount', 'total price']
      };

      // Find matching columns (case-insensitive)
      const findColumn = (possibleNames: string[], headers: string[]) => {
        return headers.find(header => 
          possibleNames.some(name => 
            header.toLowerCase().trim() === name.toLowerCase()
          )
        );
      };

      if (data.length === 0) {
        setUploadProgress(false);
        setUploadMessage('The file appears to be empty.');
        setUploadSeverity('error');
        return;
      }

      const headers = Object.keys(data[0]);
      const descriptionCol = findColumn(columnMappings.description, headers);
      const quantityCol = findColumn(columnMappings.quantity, headers);
      const unitCol = findColumn(columnMappings.unit, headers);
      const unitCostCol = findColumn(columnMappings.unitCost, headers);

      // Validate required columns
      const missingColumns = [];
      if (!descriptionCol) missingColumns.push('Description');
      if (!quantityCol) missingColumns.push('Quantity');
      if (!unitCol) missingColumns.push('Unit');
      if (!unitCostCol) missingColumns.push('Unit Cost');

      if (missingColumns.length > 0) {
        setUploadProgress(false);
        setUploadMessage(`Missing required columns: ${missingColumns.join(', ')}. Available columns: ${headers.join(', ')}`);
        setUploadSeverity('error');
        return;
      }

      // Process and validate data
      const validItems: EstimationItem[] = [];
      const errors: string[] = [];

      data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
        
        // Skip empty rows
        if (!row[descriptionCol!] && !row[quantityCol!] && !row[unitCol!] && !row[unitCostCol!]) {
          return;
        }

        const description = String(row[descriptionCol!] || '').trim();
        const quantity = parseFloat(row[quantityCol!]) || 0;
        const unit = String(row[unitCol!] || '').trim();
        const unitCost = parseFloat(row[unitCostCol!]) || 0;
        const totalCost = quantity * unitCost;

        // Validate required fields
        if (!description) {
          errors.push(`Row ${rowNumber}: Description is required`);
        }
        if (quantity <= 0) {
          errors.push(`Row ${rowNumber}: Quantity must be greater than 0`);
        }
        if (!unit) {
          errors.push(`Row ${rowNumber}: Unit is required`);
        }
        if (unitCost <= 0) {
          errors.push(`Row ${rowNumber}: Unit Cost must be greater than 0`);
        }

        if (description && quantity > 0 && unit && unitCost > 0) {
          validItems.push({
            description,
            quantity,
            unit,
            unitCost,
            totalCost
          });
        }
      });

      setUploadProgress(false);

      if (errors.length > 0) {
        setUploadMessage(`Found ${errors.length} error(s):\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
        setUploadSeverity('warning');
      }

      if (validItems.length > 0) {
        // Add valid items to the form
        const currentItems = getValues('items');
        const newItems = [...currentItems, ...validItems];
        replace(newItems);
        
        setUploadDialog(false);
        setUploadMessage(`Successfully imported ${validItems.length} item(s) from ${fileName}${errors.length > 0 ? ` (${errors.length} rows had errors)` : ''}`);
        setUploadSeverity(errors.length > 0 ? 'warning' : 'success');
      } else if (errors.length > 0) {
        setUploadMessage('No valid items could be imported. Please check your file format and data.');
        setUploadSeverity('error');
      }
    } catch (error) {
      setUploadProgress(false);
      setUploadMessage(`Error processing file: ${error}`);
      setUploadSeverity('error');
    }
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<Upload />}
                  onClick={() => setUploadDialog(true)}
                  variant="outlined"
                  color="secondary"
                >
                  Upload Excel
                </Button>
                <Button
                  startIcon={<Add />}
                  onClick={() => append({ description: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 })}
                  variant="outlined"
                >
                  Add Item
                </Button>
              </Box>
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
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No row found
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => (
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
                    ))
                  )}
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

      {/* Excel Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload color="primary" />
            <Typography variant="h6">Upload Excel/CSV File</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload an Excel (.xlsx, .xls) or CSV file with the following columns:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2"><strong>Inventory Code</strong> - Inventory Code</Typography>
              <Typography component="li" variant="body2"><strong>Description</strong> - Item description</Typography>
              <Typography component="li" variant="body2"><strong>Quantity</strong> - Number of items</Typography>
              <Typography component="li" variant="body2"><strong>Unit</strong> - Unit of measurement</Typography>
              <Typography component="li" variant="body2"><strong>Unit Cost</strong> - Cost per unit</Typography>
              <Typography component="li" variant="body2"><strong>Total Cost </strong> - Will be calculated automatically</Typography>
            </Box>
          </Box>
          
          {uploadProgress && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Processing file...</Typography>
              <LinearProgress />
            </Box>
          )}
          
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: 'grey.50',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.light',
                '& .upload-icon': {
                  color: 'primary.main',
                },
                '& .upload-text': {
                  color: 'primary.main',
                }
              }
            }}
            component="label"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploadProgress}
            />
            <CloudUpload 
              className="upload-icon"
              sx={{ 
                fontSize: 48, 
                mb: 1, 
                color: 'grey.400',
                transition: 'color 0.2s ease-in-out'
              }} 
            />
            <Typography 
              variant="h6" 
              className="upload-text"
              gutterBottom
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
                transition: 'color 0.2s ease-in-out',
                mb: 1
              }}
            >
              Click to select file
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                mb: 0.5
              }}
            >
              Supports .xlsx, .xls, and .csv files
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block'
              }}
            >
              Maximum file size: 10MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pt: 1, pb: 2, px: 3 }}>
          <Button onClick={() => setUploadDialog(false)} disabled={uploadProgress}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar
        open={!!uploadMessage}
        autoHideDuration={8000}
        onClose={() => setUploadMessage('')}
      >
        <Alert onClose={() => setUploadMessage('')} severity={uploadSeverity} sx={{ width: '100%' }}>
          {uploadMessage}
        </Alert>
      </Snackbar>
    </>
  );
}