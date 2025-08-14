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
  partNumber: string;
  partDescription: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface EstimationFormData {
  projectId: string;
  projectName: string;
  company: string;
  companyName: string;
  baseCurrency: string;
  status: string;
  items: EstimationItem[];
}

const statusOptions = ["Pending", "Approved", "Rejected"];

const costHeads = [
  'Material Cost',
  'Manpower Cost',
  'Subcontracting Cost',
  'Equipment Cost',
  'Transportation Cost',
  'Miscellaneous Cost',
];

export default function EstimationForm() {
  const { addEstimation } = useEstimation();
  const { currentProject, user } = useApp();
  const { editingEstimation, setEditingEstimation, updateEstimation } = useEstimation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadSeverity, setUploadSeverity] = useState<'success' | 'error' | 'warning'>('success');

  const { register, control, handleSubmit, watch, setValue, reset, getValues } = useForm<EstimationFormData>({
    defaultValues: {
      projectId: '',
      projectName: '',
      company: '',
      companyName: '',
      baseCurrency: '',
      status: '',
      items: []
    }
  });

  // Load editing estimation data when component mounts
  React.useEffect(() => {
    if (editingEstimation) {
      reset({
        projectId: editingEstimation.projectId,
        projectName: editingEstimation.projectName,
        company: editingEstimation.company,
        companyName: editingEstimation.companyName,
        baseCurrency: editingEstimation.baseCurrency,
        status: editingEstimation.status,
        items: editingEstimation.items
      });
    }
  }, [editingEstimation, reset]);

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
      }));

      const estimationData = {
        projectId: data.projectId,
        projectName: data.projectName,
        company: data.company,
        companyName: data.companyName,
        baseCurrency: data.baseCurrency,
        status: isDraft ? "draft" : "submitted",
        items: itemsWithIds,
      };

      if (editingEstimation) {
        // Update existing estimation
        updateEstimation(editingEstimation.id, estimationData);
        setEditingEstimation(null);
      } else {
        // Create new estimation
        addEstimation(estimationData);
      }

      setShowSuccess(true);
      // Reset form after successful submission
      reset({
        projectId: '',
        projectName: '',
        company: '',
        companyName: '',
        baseCurrency: '',
        status: '',
        items: []
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
      console.log('Raw Excel Data:', JSON.stringify(data, null, 2));

      // Define possible column name variations
      const columnMappings = {
        partNumber: ['part number', 'partnumber', 'inventory code', 'code', 'part no', 'part no.', 'partno'],
        partDescription: ['part description', 'description', 'item description', 'details', 'desc', 'part desc'],
        category: ['category', 'cost head', 'cost category', 'type', 'Category'],
        quantity: ['quantity', 'qty', 'amount', 'number', 'nos', 'no.', 'nos.'],
        unit: ['unit', 'uom', 'unit of measurement', 'measure', 'units'],
        unitCost: ['unit cost', 'unitcost', 'rate', 'price', 'unit price', 'cost per unit', 'cost', 'unit rate'],
        totalCost: ['total cost', 'totalcost', 'total', 'amount', 'total amount', 'total price']
      };

      const findColumn = (possibleNames: string[], headers: string[]) => {
        // First try exact match
        let found = headers.find(header => 
          possibleNames.some(name => header.toLowerCase().trim() === name.toLowerCase().trim())
        );

        // If no exact match, try includes
        if (!found) {
          found = headers.find(header => 
            possibleNames.some(name => 
              header.toLowerCase().trim().includes(name.toLowerCase().trim()) ||
              name.toLowerCase().trim().includes(header.toLowerCase().trim())
            )
          );
        }

        console.log(`Column Search:
          Looking for: ${possibleNames.join(', ')}
          Available headers: ${headers.join(', ')}
          Found: ${found || 'NOT FOUND'}`
        );
        return found;
      };

      if (data.length === 0) {
        setUploadProgress(false);
        setUploadMessage('The file appears to be empty.');
        setUploadSeverity('error');
        return;
      }

      const headers = Object.keys(data[0]);
      console.log('Excel Headers:', headers);

      const partNumberCol = findColumn(columnMappings.partNumber, headers);
      const partDescriptionCol = findColumn(columnMappings.partDescription, headers);
      const categoryCol = findColumn(columnMappings.category, headers);
      const quantityCol = findColumn(columnMappings.quantity, headers);
      const unitCol = findColumn(columnMappings.unit, headers);
      const unitCostCol = findColumn(columnMappings.unitCost, headers);

      console.log('Found Columns:', {
        partNumberCol,
        partDescriptionCol,
        categoryCol,
        quantityCol,
        unitCol,
        unitCostCol
      });

      // Validate required columns
      const missingColumns = [];
      if (!partNumberCol) missingColumns.push('Part Number');
      if (!partDescriptionCol) missingColumns.push('Part Description');
      if (!categoryCol) missingColumns.push('Category');
      if (!quantityCol) missingColumns.push('Quantity');
      if (!unitCol) missingColumns.push('Unit');
      if (!unitCostCol) missingColumns.push('Unit Cost');

      if (missingColumns.length > 0) {
        setUploadProgress(false);
        setUploadMessage(`Missing required columns: ${missingColumns.join(', ')}.\nAvailable columns: ${headers.join(', ')}`);
        setUploadSeverity('error');
        return;
      }

      // Process and validate data
      const validItems: EstimationItem[] = [];
      const errors: string[] = [];

      data.forEach((row, index) => {
        const rowNumber = index + 2; // Excel row number (1-based + header row)
        
        // Skip empty rows
        if (!row[partNumberCol!] && !row[partDescriptionCol!] && !row[categoryCol!] && !row[quantityCol!] && !row[unitCol!] && !row[unitCostCol!]) {
          return;
        }

        const partNumber = String(row[partNumberCol!] || '').trim();
        const partDescription = String(row[partDescriptionCol!] || '').trim();
        const rawCategory = String(row[categoryCol!] || '').trim();
        
        console.log(`Processing Row ${rowNumber}:`, {
          partNumber,
          partDescription,
          rawCategory,
          rawCategoryValue: row[categoryCol!],
          fullRow: row
        });

        // Improved category matching
        let category = '';
        
        // First try exact match
        category = costHeads.find(c => c.toLowerCase() === rawCategory.toLowerCase()) || '';
        
        // If no exact match, try partial match
        if (!category) {
          for (const validCategory of costHeads) {
            if (validCategory.toLowerCase().includes(rawCategory.toLowerCase()) || 
                rawCategory.toLowerCase().includes(validCategory.toLowerCase())) {
              category = validCategory;
              break;
            }
          }
        }

        // Try matching just the first word
        if (!category) {
          const firstWord = rawCategory.split(' ')[0].toLowerCase();
          category = costHeads.find(c => c.toLowerCase().startsWith(firstWord)) || '';
        }

        console.log(`Category Matching for Row ${rowNumber}:
          Raw Category: "${rawCategory}"
          Matched Category: "${category}"
          Available Categories: ${costHeads.join(', ')}`
        );

        const quantity = parseFloat(row[quantityCol!]) || 0;
        const unit = String(row[unitCol!] || '').trim();
        const unitCost = parseFloat(row[unitCostCol!]) || 0;
        const totalCost = quantity * unitCost;

        if (!partNumber) errors.push(`Row ${rowNumber}: Part Number is required`);
        if (!partDescription) errors.push(`Row ${rowNumber}: Part Description is required`);
        if (!category) errors.push(`Row ${rowNumber}: Category '${rawCategory}' is invalid. Must be one of: ${costHeads.join(', ')}`);
        if (quantity <= 0) errors.push(`Row ${rowNumber}: Quantity must be greater than 0`);
        if (!unit) errors.push(`Row ${rowNumber}: Unit is required`);
        if (unitCost <= 0) errors.push(`Row ${rowNumber}: Unit Cost must be greater than 0`);

        if (partNumber && partDescription && category && quantity > 0 && unit && unitCost > 0) {
          validItems.push({
            partNumber,
            partDescription,
            category,
            quantity,
            unit,
            unitCost,
            totalCost
          });
        }
      });

      console.log('Processing Results:', {
        validItems,
        errors
      });

      setUploadProgress(false);
      if (errors.length > 0) {
        setUploadMessage(`Found ${errors.length} error(s):\n${errors.join('\n')}`);
        setUploadSeverity('warning');
      }

      if (validItems.length > 0) {
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
      console.error('Error processing file:', error);
      setUploadProgress(false);
      setUploadMessage(`Error processing file: ${error}`);
      setUploadSeverity('error');
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="div" gutterBottom fontWeight={600}>
              {editingEstimation ? 'Edit Cost Estimation' : 'Create New Cost Estimation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingEstimation ? 'Update the estimation details and items' : 'Fill in the project details and add cost items to create a comprehensive estimation'}
            </Typography>
          </Box>
          
          <form>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project ID"
                  {...register('projectId')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  {...register('projectName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  {...register('company')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  {...register('companyName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Base Currency"
                  {...register('baseCurrency')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  select
                  {...register('status', { required: true })}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
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
                  onClick={() => append({ partNumber: '', partDescription: '', category: '', quantity: 1, unit: '', unitCost: 0, totalCost: 0 })}
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
                    <TableCell>Part Number</TableCell>
                    <TableCell>Part Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Unit Cost</TableCell>
                    <TableCell>Total Cost</TableCell>
                    <TableCell width="50">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Please add items to the estimation
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            {...register(`items.${index}.partNumber`)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            {...register(`items.${index}.partDescription`)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                           
                            {...register(`items.${index}.category`)}
                            
                          >
                           
                          </TextField>
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
                  // Remove notes from form
                  // {...register('notes')}
                  disabled
                  value="Notes/Comments field removed as per new requirements."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {editingEstimation && (
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setEditingEstimation(null);
                    reset({
                      projectId: '',
                      projectName: '',
                      company: '',
                      companyName: '',
                      baseCurrency: '',
                      status: '',
                      items: []
                    });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              <Button 
                variant="outlined" 
                startIcon={<Save />}
                onClick={handleSaveDraft}
              >
                {editingEstimation ? 'Update Draft' : 'Save Draft'}
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Send />}
                onClick={handleSubmitEstimation}
              >
                {editingEstimation ? 'Update & Submit' : 'Submit Estimation'}
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
            <Typography component="li" variant="body2"><strong>Part Number</strong> - Inventory Code</Typography>
              <Typography component="li" variant="body2"><strong>Part Description</strong> - Item description</Typography>
              <Typography component="li" variant="body2"><strong>Category</strong> - Category</Typography>
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
          {editingEstimation ? 'Estimation updated successfully!' : 'Estimation saved successfully!'} The report page will now reflect your changes.
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