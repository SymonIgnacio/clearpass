import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Pagination,
} from '@mui/material';
import { Campaign as CampaignIcon } from '@mui/icons-material';
import { apiRequest } from '../utils/api';

const ResidentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page]);

  const fetchAnnouncements = async () => {
    try {
      const response = await apiRequest('/system-admin/announcements/public', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'important':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CampaignIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant='h4'>Barangay Announcements</Typography>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {announcements.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant='h6' color='text.secondary'>
              No announcements available
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Check back later for updates from the barangay office.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {announcements.map(announcement => (
            <Card key={announcement.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant='h6' sx={{ flexGrow: 1, mr: 2 }}>
                    {announcement.title}
                  </Typography>
                  <Chip
                    label={announcement.priority.toUpperCase()}
                    color={getPriorityColor(announcement.priority)}
                    size='small'
                  />
                </Box>

                <Typography variant='body1' paragraph>
                  {announcement.content}
                </Typography>

                <Typography variant='caption' color='text.secondary'>
                  Posted on {formatDate(announcement.created_at)}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {Math.ceil(pagination.total / pagination.limit) > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={pagination.page}
                onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                color='primary'
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ResidentAnnouncements;
