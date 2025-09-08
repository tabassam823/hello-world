import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageService from '../services/imageService';

const ImageUploader = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);

    try {
      await imageService.uploadImage(formData);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image', error);
    }
  };

  return (
    <div>
      <h1>Upload a New Image</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="image">Image</label>
          <input
            type="file"
            id="image"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Upload Image</button>
      </form>
    </div>
  );
};

export default ImageUploader;
