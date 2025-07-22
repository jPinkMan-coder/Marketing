'use client';
import React from 'react';
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

const drawerWidth = 280;

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { currentProject, user } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'estimation', label: 'Cost Estimation', icon: <Assignment /> },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: <ShoppingCart /> },
    { id: 'reports', label: 'Financial Reports', icon: <Assessment /> },
    { id: 'projects', label: 'Projects', icon: <Business /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-root': {
          position: 'relative',
        },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'fixed',
          height: '100vh',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          component="img"
          src="/assets/LogoIcon.png"
          alt="Logo"
          sx={{ width: 200, height: 60 ,mr:5,}}
        />
        <Typography variant="body2" color="text.secondary" sx={{ml:5,}}
        >
          Cost Management System
        </Typography>
      </Box>

      <Divider />

      {/* {currentProject && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Current Project
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {currentProject.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentProject.code}
            </Typography>
          </Box>
          <Chip 
            label={currentProject.status} 
            size="small" 
            color={currentProject.status === 'active' ? 'success' : 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      )} */}

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              sx={{
                borderRadius: 2,
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
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
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
    </Drawer>
  );
}