'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Divider,
} from '@mui/material';
import {
  Assignment,
  ShoppingCart,
  TrendingUp,
  Warning,
} from '@mui/icons-material';

const activities = [
  {
    id: 1,
    type: 'estimation',
    title: 'New cost estimation submitted',
    description: 'Material costs for Phase 2 - ₹2,45,000',
    time: '2 hours ago',
    icon: <Assignment />,
    color: 'primary',
  },
  {
    id: 2,
    type: 'purchase_order',
    title: 'Purchase order approved',
    description: 'PO#1234 - Equipment hire - ₹48,000',
    time: '4 hours ago',
    icon: <ShoppingCart />,
    color: 'success',
  },
  {
    id: 3,
    type: 'variance',
    title: 'Cost variance detected',
    description: 'Manpower costs exceeded by 12%',
    time: '6 hours ago',
    icon: <Warning />,
    color: 'warning',
  },
  {
    id: 4,
    type: 'report',
    title: 'Monthly report generated',
    description: 'Financial summary for June 2024',
    time: '1 day ago',
    icon: <TrendingUp />,
    color: 'secondary',
  },
];

export default function RecentActivity() {
  return (
    <Card sx={{ height: 400 }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="div" gutterBottom fontWeight={600}>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Latest updates and changes
        </Typography>

        {/* Scrollable List */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          <List sx={{ py: 0 }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${activity.color}.main`,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}
