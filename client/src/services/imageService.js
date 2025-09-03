import api from '../utils/api';

const getImages = () => {
  return api.get('/images');
};

const uploadImage = (formData) => {
  return api.post('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const deleteImage = (id) => {
  return api.delete(`/images/${id}`);
};

const shareImage = (id, email) => {
    return api.put(`/images/${id}/share`, { email });
};

const imageService = {
  getImages,
  uploadImage,
  deleteImage,
  shareImage,
};

export default imageService;
