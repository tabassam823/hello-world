import React, { useState } from 'react';
import ShareForm from './ShareForm';
import noteService from '../services/noteService';

const NoteItem = ({ note, onDelete }) => {
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async (email) => {
    try {
      await noteService.shareNote(note._id, email);
      setShowShare(false);
      // Optionally, you could refresh the note data to show the new shared user
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to share note');
    }
  };

  return (
    <li key={note._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
      <h3>{note.title}</h3>
      <div dangerouslySetInnerHTML={{ __html: note.content }}></div>
      <button onClick={() => onDelete(note._id)}>Delete</button>
      <button onClick={() => setShowShare(!showShare)}>
        {showShare ? 'Cancel' : 'Share'}
      </button>
      {showShare && <ShareForm onShare={handleShare} />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </li>
  );
};

export default NoteItem;
