import { Container, Typography, Box } from '@mui/material';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <Container maxWidth="md">
      <Box sx={{ 
        my: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        textAlign: 'center' 
      }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
          ファイルアップロード
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          画像・動画ファイルを選択、またはドラッグ＆ドロップしてアップロードしてください。
        </Typography>
        
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          <FileUpload />
        </Box>
      </Box>
    </Container>
  );
}
