import React, { useState } from 'react';
import ShareForm from './ShareForm';
import imageService from '../services/imageService';

const ImageItem = ({ image, onDelete }) => {
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async (email) => {
    try {
      await imageService.shareImage(image._id, email);
      setShowShare(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to share image');
    }
  };

  return (
    <div key={image._id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
      <h3>{image.title}</h3>
      <img src={image.image_url} alt={image.title} width="200" />
      <div>
        <button onClick={() => onDelete(image._id)}>Delete</button>
        <button onClick={() => setShowShare(!showShare)}>
          {showShare ? 'Cancel' : 'Share'}
        </button>
      </div>
      {showShare && <ShareForm onShare={handleShare} />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ImageItem;
