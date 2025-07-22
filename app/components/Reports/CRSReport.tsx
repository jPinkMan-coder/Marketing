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
  Divider,
  Grid,
  Alert,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import { 
  Download, 
  Print, 
  Share, 
  TrendingUp, 
  TrendingDown, 
  Refresh,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { useEstimation } from '../../context/EstimationContext';
import { useApp } from '../../context/AppContext';

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '-';
  return amount.toLocaleString();
};

const getVarianceColor = (variance: number | null) => {
  if (variance === null || variance === undefined) return 'default';
  if (variance > 0) return 'error';
  if (variance < 0) return 'success';
  return 'default';
};

const getVarianceIcon = (variance: number | null) => {
  if (variance === null || variance === undefined) return null;
  return variance > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />;
};

interface ProjectData {
  projectId: string;
  projectName: string;
  companyName: string;
  categories: CategoryData[];
  totalEstimate: number;
  totalCommitted: number;
  totalUncommitted: number;
  totalActual: number;
  totalAnticipated: number;
  totalVariance: number;
  totalVariancePercent: number;
}

interface CategoryData {
  category: string;
  estimate: number;
  committed: number;
  uncommitted: number;
  actual: number;
  anticipated: number;
  variance: number;
  variancePercent: number;
  items: any[];
}

export default function CRSReport() {
  const { estimations, getTotalsByCategory } = useEstimation();
  const { currentProject, user } = useApp();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group estimations by project and then by category
  const getProjectData = (): ProjectData[] => {
    const projectMap = new Map<string, ProjectData>();
    
    // Mock data for committed/actual values per category
    const MOCK_CATEGORY_DATA: Record<string, { actual: number; committed: number }> = {
      'Materials': { actual: 45000, committed: 42000 },
      'Labor': { actual: 18000, committed: 15000 },
      'Equipment': { actual: 12000, committed: 10000 },
      'Services': { actual: 8000, committed: 7500 },
      'Other': { actual: 5000, committed: 4500 },
    };

    estimations.forEach(estimation => {
      if (estimation.status === 'approved' || estimation.status === 'submitted') {
        const projectId = estimation.projectId;
        
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            projectId,
            projectName: estimation.projectName,
            companyName: estimation.companyName,
            categories: [],
            totalEstimate: 0,
            totalCommitted: 0,
            totalUncommitted: 0,
            totalActual: 0,
            totalAnticipated: 0,
            totalVariance: 0,
            totalVariancePercent: 0,
          });
        }
        
        const project = projectMap.get(projectId)!;
        
        // Group items by category
        const categoryMap = new Map<string, CategoryData>();
        
        estimation.items.forEach(item => {
          if (!categoryMap.has(item.category)) {
            const mock = MOCK_CATEGORY_DATA[item.category] || { actual: 0, committed: 0 };
            categoryMap.set(item.category, {
              category: item.category,
              estimate: 0,
              committed: mock.committed,
              uncommitted: 0,
              actual: mock.actual,
              anticipated: 0,
              variance: 0,
              variancePercent: 0,
              items: [],
            });
          }
          
          const category = categoryMap.get(item.category)!;
          category.estimate += item.totalCost;
          category.items.push(item);
        });
        
        // Calculate category totals
        categoryMap.forEach(category => {
          category.uncommitted = Math.max(0, category.estimate - category.committed);
          category.anticipated = category.actual + category.uncommitted;
          category.variance = category.anticipated - category.estimate;
          category.variancePercent = category.estimate > 0 ? (category.variance / category.estimate) * 100 : 0;
          
          project.categories.push(category);
        });
      }
    });
    
    // Calculate project totals
    projectMap.forEach(project => {
      project.totalEstimate = project.categories.reduce((sum, cat) => sum + cat.estimate, 0);
      project.totalCommitted = project.categories.reduce((sum, cat) => sum + cat.committed, 0);
      project.totalUncommitted = project.categories.reduce((sum, cat) => sum + cat.uncommitted, 0);
      project.totalActual = project.categories.reduce((sum, cat) => sum + cat.actual, 0);
      project.totalAnticipated = project.categories.reduce((sum, cat) => sum + cat.anticipated, 0);
      project.totalVariance = project.categories.reduce((sum, cat) => sum + cat.variance, 0);
      project.totalVariancePercent = project.totalEstimate > 0 ? (project.totalVariance / project.totalEstimate) * 100 : 0;
    });
    
    return Array.from(projectMap.values());
  };

  const projectData = getProjectData();
  const approvedEstimations = estimations.filter(est => est.status === 'approved' || est.status === 'submitted');

  const toggleProjectExpansion = (projectId: string) => {
    const newExpandedProjects = new Set(expandedProjects);
    if (newExpandedProjects.has(projectId)) {
      newExpandedProjects.delete(projectId);
    } else {
      newExpandedProjects.add(projectId);
    }
    setExpandedProjects(newExpandedProjects);
  };

  const toggleCategoryExpansion = (categoryKey: string) => {
    const newExpandedCategories = new Set(expandedCategories);
    if (newExpandedCategories.has(categoryKey)) {
      newExpandedCategories.delete(categoryKey);
    } else {
      newExpandedCategories.add(categoryKey);
    }
    setExpandedCategories(newExpandedCategories);
  };

  const getCategoryBreakdownTooltip = (project: ProjectData) => {
    const breakdown = project.categories.map(cat => 
      `${cat.category}: ₹${cat.estimate.toLocaleString()}`
    ).join('\n');
    return `Category Breakdown:\n${breakdown}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="div" fontWeight={600} gutterBottom>
            Contract Review Sheet (CRS)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive financial analysis and cost tracking report
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Project:</strong> {currentProject?.name || 'No Project Selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Project Code:</strong> {currentProject?.code || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contract Value:</strong> ₹{currentProject?.contractValue?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Report Date:</strong> {new Date().toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Period:</strong> {new Date().toLocaleDateString()} - Current
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> <Chip label={currentProject?.status || 'Unknown'} color="success" size="small" />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Generated By:</strong> {user?.name || 'System'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Estimations:</strong> {approvedEstimations.length}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<Refresh />} size="small">
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<Print />} size="small">
              Print
            </Button>
            <Button variant="outlined" startIcon={<Share />} size="small">
              Share
            </Button>
            <Button variant="contained" startIcon={<Download />} size="small">
              Export PDF
            </Button>
          </Box>
        </Box>

        {projectData.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            No estimation data available. Please create cost estimations first to generate the CRS report.
            Go to the "Cost Estimation" tab to add estimations.
          </Alert>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              This report is automatically updated based on your cost estimations. 
              Data reflects {approvedEstimations.length} approved/submitted estimation(s).
              Click the arrow icons to view detailed items for each project and category.
            </Alert>

            <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
              <Table size="small" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 50 }} />
                    <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 200 }}>Project Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 150 }}>Company Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Estimate<br />₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Committed<br />₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Uncommitted<br />₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Actual<br />₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Anticipated<br />Final Cost ₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 120 }}>Variance<br />₹</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, textAlign: 'right', minWidth: 100 }}>Variance<br />%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectData.map((project) => {
                    const isProjectExpanded = expandedProjects.has(project.projectId);
                    const hasCategories = project.categories.length > 0;
                    
                    return (
                      <React.Fragment key={project.projectId}>
                        {/* Project Row */}
                        <TableRow hover sx={{ bgcolor: 'background.default' }}>
                          <TableCell>
                            {hasCategories && (
                              <IconButton
                                size="small"
                                onClick={() => toggleProjectExpansion(project.projectId)}
                                sx={{ color: 'primary.main' }}
                              >
                                {isProjectExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, pl: hasCategories ? 0 : 2 }}>
                            {project.projectName}
                          </TableCell>
                          <TableCell>{project.companyName}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            <Tooltip 
                              title={
                                <Box sx={{ whiteSpace: 'pre-line', p: 1 }}>
                                  {getCategoryBreakdownTooltip(project)}
                                </Box>
                              }
                              arrow
                              placement="top"
                            >
                              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}>
                                {formatCurrency(project.totalEstimate)}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {formatCurrency(project.totalCommitted)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {formatCurrency(project.totalUncommitted)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {formatCurrency(project.totalActual)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {formatCurrency(project.totalAnticipated)}
                          </TableCell>
                          <TableCell align="right">
                            {project.totalVariance !== null && project.totalVariance !== undefined ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                {getVarianceIcon(project.totalVariance)}
                                <Chip
                                  label={formatCurrency(Math.abs(project.totalVariance))}
                                  color={getVarianceColor(project.totalVariance)}
                                  size="small"
                                  sx={{ fontFamily: 'monospace', minWidth: 80 }}
                                />
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {project.totalVariancePercent !== null && project.totalVariancePercent !== undefined ? (
                              <Typography 
                                color={project.totalVariancePercent > 0 ? 'error.main' : 'success.main'}
                                fontWeight={600}
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {project.totalVariancePercent > 0 ? '+' : ''}{project.totalVariancePercent.toFixed(2)}%
                              </Typography>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {/* Category Rows */}
                        {isProjectExpanded && project.categories.map((category) => {
                          const categoryKey = `${project.projectId}-${category.category}`;
                          const isCategoryExpanded = expandedCategories.has(categoryKey);
                          
                          return (
                            <React.Fragment key={categoryKey}>
                              <TableRow hover sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleCategoryExpansion(categoryKey)}
                                    sx={{ color: 'primary.main', ml: 2 }}
                                  >
                                    {isCategoryExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                                  </IconButton>
                                </TableCell>
                                <TableCell sx={{ pl: 4, fontWeight: 500 }}>
                                  {category.category}
                                </TableCell>
                                <TableCell>{project.companyName}</TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                  {formatCurrency(category.estimate)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                  {formatCurrency(category.committed)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                  {formatCurrency(category.uncommitted)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                  {formatCurrency(category.actual)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                  {formatCurrency(category.anticipated)}
                                </TableCell>
                                <TableCell align="right">
                                  {category.variance !== null && category.variance !== undefined ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                      {getVarianceIcon(category.variance)}
                                      <Chip
                                        label={formatCurrency(Math.abs(category.variance))}
                                        color={getVarianceColor(category.variance)}
                                        size="small"
                                        sx={{ fontFamily: 'monospace', minWidth: 80 }}
                                      />
                                    </Box>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {category.variancePercent !== null && category.variancePercent !== undefined ? (
                                    <Typography 
                                      color={category.variancePercent > 0 ? 'error.main' : 'success.main'}
                                      fontWeight={600}
                                      sx={{ fontFamily: 'monospace' }}
                                    >
                                      {category.variancePercent > 0 ? '+' : ''}{category.variancePercent.toFixed(2)}%
                                    </Typography>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              </TableRow>
                              
                              {/* Expanded Items Row */}
                              {isCategoryExpanded && category.items.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={10} sx={{ p: 0, border: 'none' }}>
                                    <Collapse in={isCategoryExpanded} timeout="auto" unmountOnExit>
                                      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                          Items in {category.category}:
                                        </Typography>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell sx={{ fontWeight: 600 }}>Part Number</TableCell>
                                              <TableCell sx={{ fontWeight: 600 }}>Part Description</TableCell>
                                              <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                                              <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                                              <TableCell sx={{ fontWeight: 600 }}>Unit Cost (₹)</TableCell>
                                              <TableCell sx={{ fontWeight: 600 }}>Total Cost (₹)</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {category.items.map((item, itemIndex) => (
                                              <TableRow key={`${item.id}-${itemIndex}`} hover>
                                                <TableCell>{item.partNumber}</TableCell>
                                                <TableCell>{item.partDescription}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>₹{item.unitCost.toLocaleString()}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{item.totalCost.toLocaleString()}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </Box>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Total Row */}
                  {projectData.length > 0 && (
                    <TableRow sx={{ 
                      bgcolor: 'primary.dark', 
                      '& td': { 
                        fontWeight: 700, 
                        color: 'white',
                        borderTop: '2px solid',
                        borderColor: 'primary.main'
                      } 
                    }}>
                      <TableCell sx={{ color: 'white !important' }}></TableCell>
                      <TableCell sx={{ color: 'white !important' }}>TOTAL</TableCell>
                      <TableCell sx={{ color: 'white !important' }}></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {formatCurrency(projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {formatCurrency(projectData.reduce((sum, p) => sum + (p.totalCommitted || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {formatCurrency(projectData.reduce((sum, p) => sum + (p.totalUncommitted || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {formatCurrency(projectData.reduce((sum, p) => sum + (p.totalActual || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {formatCurrency(projectData.reduce((sum, p) => sum + (p.totalAnticipated || 0), 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white !important' }}>
                        <Chip
                          label={formatCurrency(Math.abs(projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0)))}
                          color={projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0) > 0 ? 'error' : 'success'}
                          size="small"
                          sx={{ 
                            fontFamily: 'monospace', 
                            minWidth: 80,
                            bgcolor: projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0) > 0 ? 'error.light' : 'success.light',
                            color: 'white !important'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'white !important' }}>
                        {(() => {
                          const totalEstimate = projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0);
                          const totalVariance = projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0);
                          const variancePercent = totalEstimate > 0 ? (totalVariance / totalEstimate) * 100 : 0;
                          return `${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(2)}%`;
                        })()}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 4 }} />

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Contract Value
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      ₹{((currentProject?.contractValue || 0) / 100000).toFixed(1)}L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Total Estimate
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      ₹{(projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0) / 1000).toFixed(1)}K
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Total Actual
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      ₹{(projectData.reduce((sum, p) => sum + (p.totalActual || 0), 0) / 1000).toFixed(1)}K
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  bgcolor: projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0) > 0 ? 'error.main' : 'success.main', 
                  color: 'white' 
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      Total Variance
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0) > 0 ? '+' : ''}₹{(projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0) / 1000).toFixed(1)}K
                    </Typography>
                    <Typography variant="body2">
                      {(() => {
                        const totalEstimate = projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0);
                        const totalVariance = projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0);
                        const variancePercent = totalEstimate > 0 ? (totalVariance / totalEstimate) * 100 : 0;
                        return `(${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
                      })()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* Footer Information */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 2
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Prepared By:</strong> {user?.name || 'System'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Updated:</strong> {new Date().toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Data Source:</strong> Live estimation data
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Next Review:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Typography>
            <Chip 
              label={(() => {
                const totalEstimate = projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0);
                const totalVariance = projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0);
                const variancePercent = totalEstimate > 0 ? Math.abs(totalVariance / totalEstimate) * 100 : 0;
                return variancePercent > 5 ? "Requires Attention" : "On Track";
              })()} 
              color={(() => {
                const totalEstimate = projectData.reduce((sum, p) => sum + (p.totalEstimate || 0), 0);
                const totalVariance = projectData.reduce((sum, p) => sum + (p.totalVariance || 0), 0);
                const variancePercent = totalEstimate > 0 ? Math.abs(totalVariance / totalEstimate) * 100 : 0;
                return variancePercent > 5 ? "warning" : "success";
              })()} 
              size="small"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}