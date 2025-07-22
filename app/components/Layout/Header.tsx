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
        width: '100vw',
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2, // Above sidebar
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: 64,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box
            component="img"
            src="/assets/LogoIcon.png"
            alt="Logo"
            sx={{ width: 32, height: 32 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Project Financial Dashboard
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cost Management System
            </Typography>
          </Box>
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