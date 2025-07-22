'use client';
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
} from '@mui/icons-material';
import Image from 'next/image';

const collapsedSidebarWidth = 64;

interface HeaderProps {
  sidebarExpanded: boolean;
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  return (
    <AppBar
      position="fixed"
      sx={{
        width: '100%',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box
            component="img"
            src="/assets/LogoIcon.png"
            alt="Logo"
            sx={{ 
              width: 40, 
              height: 40,
              objectFit: 'contain'
            }}
          />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Cost Management System
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="large" color="inherit">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton size="large" color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}