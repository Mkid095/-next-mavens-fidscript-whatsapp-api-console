// Uploads API
import { fetchApi } from './api';

export const uploadsApi = {
  uploadImage: (imageData: string) =>
    fetchApi<{ url: string; public_id: string; width: number; height: number }>(
      '/api/uploads/image',
      { method: 'POST', body: JSON.stringify({ image: imageData }) }
    ),

  deleteImage: (publicId: string) =>
    fetchApi<{ result: string }>(`/api/uploads/image/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    }),
};
