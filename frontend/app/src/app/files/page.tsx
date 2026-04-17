'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { fetchFileList } from '@/lib/api';

export default function FilesPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      const fileList = await fetchFileList();
      setFiles(fileList);
      setLoading(false);
    };
    loadFiles();
  }, []);

  const handleOpenModal = (filename: string) => {
    setSelectedFile(filename);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  return (
    <Box sx={{ 
      my: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      px: { xs: 4, sm: 8 },
      width: '100%'
    }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary" textAlign="center">
        HTML資材一覧
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 600 }} textAlign="center">
        outputs フォルダに配置されたHTMLファイルの一覧を表示します。
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 2, width: '100%', maxWidth: 600 }}>
          <Typography variant="h6" color="text.secondary">
            表示HTMLなし
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, maxWidth: 600, width: '100%', mb: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', px: 6, py: 3 }}>ファイル名</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', px: 2, py: 3, width: 120, textAlign: 'center' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ bgcolor: 'white' }}>
              {files.map((filename) => (
                <TableRow key={filename} hover>
                  <TableCell component="th" scope="row" sx={{ px: 6, py: 2.5 }}>
                    {filename}
                  </TableCell>
                  <TableCell sx={{ px: 2, py: 2.5, width: 120, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenModal(filename)}
                      sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                    >
                      表示
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 表示モーダル */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%', fontWeight: 'bold' }}>
            {selectedFile}
          </Typography>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          {selectedFile && (
            <iframe
              src={`/outputs/${selectedFile}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="HTML Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
