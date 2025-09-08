import express from 'express';
import multer from 'multer';
import { check, validationResult } from 'express-validator';
import supabase from '../../config/supabaseClient.js';
import authMiddleware from '../../middleware/auth.js';

const router = express.Router();

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST api/images
// @desc    Upload an image
// @access  Private
router.post('/', [authMiddleware, upload.single('image')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'Please upload a file' });
  }

  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ msg: 'Title is required' });
  }

  const file = req.file;
  const fileName = `${Date.now()}_${file.originalname}`;
  const user_id = req.user.id;

  try {
    // 1. Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('note_images') // Assumes a bucket named 'note_images' exists
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // 2. Get the public URL of the uploaded image
    const { data: urlData } = supabase.storage
      .from('note_images')
      .getPublicUrl(fileName);

    // 3. Save image metadata to the database
    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert([{ title, image_url: urlData.publicUrl, user_id }])
      .select();

    if (dbError) throw dbError;

    res.json(dbData[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/images
// @desc    Get all images for a user (own and shared)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    const user_id = req.user.id;
    try {
        const { data: ownedImages, error: ownedError } = await supabase
            .from('images')
            .select('*')
            .eq('user_id', user_id);
        if (ownedError) throw ownedError;

        const { data: sharedRelations, error: sharedError } = await supabase
            .from('shared_access')
            .select('image_id')
            .eq('shared_with_user_id', user_id);
        if (sharedError) throw sharedError;

        const sharedImageIds = sharedRelations.map(r => r.image_id).filter(id => id);

        let sharedImages = [];
        if (sharedImageIds.length > 0) {
            const { data, error } = await supabase
                .from('images')
                .select('*')
                .in('id', sharedImageIds);
            if (error) throw error;
            sharedImages = data;
        }

        res.json([...ownedImages, ...sharedImages]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    DELETE api/images/:id
// @desc     Delete an image
// @access   Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // First, get the image record to find the file name
        const { data: image, error: selectError } = await supabase
            .from('images')
            .select('image_url')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (selectError || !image) {
             return res.status(404).json({ msg: 'Image not found or user not authorized' });
        }

        const fileName = image.image_url.split('/').pop();

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('note_images')
            .remove([fileName]);

        if (storageError) {
            console.error('Error deleting from storage, but proceeding to delete from DB', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('images')
            .delete()
            .eq('id', req.params.id);

        if (dbError) throw dbError;

        res.json({ msg: 'Image removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    PUT api/images/:id/share
// @desc     Share an image with another user
// @access   Private
router.put(
  '/:id/share',
  [authMiddleware, [check('email', 'Email is required').isEmail()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const image_id = req.params.id;
    const owner_id = req.user.id;
    const { email: shared_with_email } = req.body;

    try {
      // 1. Find the user to share with by their email
      const { data: userToShare, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', shared_with_email)
        .single();

      if (userError || !userToShare) {
        return res.status(404).json({ msg: 'User to share with not found' });
      }
      const shared_with_user_id = userToShare.id;

      // 2. Verify ownership of the image
      const { data: image, error: imageError } = await supabase
        .from('images')
        .select('user_id')
        .eq('id', image_id)
        .single();

      if (imageError || !image) {
        return res.status(404).json({ msg: 'Image not found' });
      }
      if (image.user_id !== owner_id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      // 3. Check if sharing with self
      if (shared_with_user_id === owner_id) {
          return res.status(400).json({ msg: 'You cannot share an image with yourself' });
      }

      // 4. Check if already shared
      const { data: existingShare, error: shareCheckError } = await supabase
        .from('shared_access')
        .select('*')
        .eq('image_id', image_id)
        .eq('shared_with_user_id', shared_with_user_id)
        .single();

      if (shareCheckError && shareCheckError.code !== 'PGRST116') {
          throw shareCheckError;
      }
      if (existingShare) {
        return res.status(400).json({ msg: 'Image already shared with this user' });
      }

      // 5. Insert into shared_access table
      const { data, error: insertError } = await supabase
        .from('shared_access')
        .insert([{ image_id, shared_with_user_id }])
        .select();

      if (insertError) throw insertError;

      res.json(data[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);


export default router;
