import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Since we are using ES Modules, __dirname is not available. This is the workaround.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes (I will update these later)
import usersRoutes from './routes/api/users.js';
import authRoutes from './routes/api/auth.js';
import notesRoutes from './routes/api/notes.js';
import imagesRoutes from './routes/api/images.js';

app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/images', imagesRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
