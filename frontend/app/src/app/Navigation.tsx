'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListAltIcon from '@mui/icons-material/ListAlt';

export default function Navigation() {
  return (
    <Box 
      component="header" 
      sx={{ 
        bgcolor: 'white', 
        color: 'primary.main', 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        py: 1
      }}
    >
      <Box sx={{ px: 4 }}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            <MuiLink 
              component={Link} 
              href="/" 
              underline="none" 
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              S3 File Manager
            </MuiLink>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              component={Link} 
              href="/" 
              startIcon={<CloudUploadIcon />}
              variant="text"
              sx={{ fontWeight: 'bold' }}
            >
              アップロード
            </Button>
            <Button 
              component={Link} 
              href="/files" 
              startIcon={<ListAltIcon />}
              variant="text"
              sx={{ fontWeight: 'bold' }}
            >
              HTML一覧
            </Button>
          </Box>
        </Toolbar>
      </Box>
    </Box>
  );
}
