'use client';
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  ShoppingCart,
  Assessment,
  Settings,
  Person,
  Business,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';

const collapsedWidth = 64;
const expandedWidth = 280;

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, onExpandedChange }: SidebarProps) {
  const { currentProject, user } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'estimation', label: 'Cost Estimation', icon: <Assignment /> },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: <ShoppingCart /> },
    { id: 'reports', label: 'Financial Reports', icon: <Assessment /> },
    { id: 'projects', label: 'Projects', icon: <Business /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ];

  const handleMouseEnter = () => {
    setIsExpanded(true);
    onExpandedChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'fixed',
        left: 0,
        top: '64px', // Below header
        height: 'calc(100vh - 64px)',
        width: isExpanded ? expandedWidth : collapsedWidth,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        zIndex: 1200, // Above content, below header
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <List sx={{ px: 1, py: 2, mt: 1 }}>
        {menuItems.map((item) => (
          <Tooltip
            key={item.id}
            title={!isExpanded ? item.label : ''}
            placement="right"
            arrow
          >
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: isExpanded ? 'initial' : 'center',
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    bgcolor: activeTab === item.id ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isExpanded ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    opacity: isExpanded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      {isExpanded && (
        <Box sx={{ 
          mt: 'auto', 
          p: 2,
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="primary" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}