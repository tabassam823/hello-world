import React, { useState, useEffect } from 'react';
import noteService from '../services/noteService';
import imageService from '../services/imageService';
import { Link } from 'react-router-dom';
import NoteItem from '../components/NoteItem';
import ImageItem from '../components/ImageItem';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notesRes = await noteService.getNotes();
        setNotes(notesRes.data);
        const imagesRes = await imageService.getImages();
        setImages(imagesRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchData();
  }, []);

  const handleDeleteNote = async (id) => {
    try {
      await noteService.deleteNote(id);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error('Error deleting note', error);
    }
  };

  const handleDeleteImage = async (id) => {
    try {
      await imageService.deleteImage(id);
      setImages(images.filter((image) => image._id !== id));
    } catch (error) {
      console.error('Error deleting image', error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <Link to="/create-note">
          <button>Create Note</button>
        </Link>
        <Link to="/upload-image">
          <button>Upload Image</button>
        </Link>
      </div>
      <div>
        <h2>My Notes</h2>
        <ul>
          {notes.map((note) => (
            <NoteItem key={note._id} note={note} onDelete={handleDeleteNote} />
          ))}
        </ul>
      </div>
      <div>
        <h2>My Images</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {images.map((image) => (
            <ImageItem key={image._id} image={image} onDelete={handleDeleteImage} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
