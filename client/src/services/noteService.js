import api from '../utils/api';

const getNotes = () => {
  return api.get('/notes');
};

const createNote = (noteData) => {
  return api.post('/notes', noteData);
};

const deleteNote = (id) => {
  return api.delete(`/notes/${id}`);
};

const shareNote = (id, email) => {
  return api.put(`/notes/${id}/share`, { email });
};

const noteService = {
  getNotes,
  createNote,
  deleteNote,
  shareNote,
};

export default noteService;
