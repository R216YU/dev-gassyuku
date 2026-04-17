import axios from 'axios';
import { env } from '@/config/env';

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
});

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name);

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
