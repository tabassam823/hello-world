import express from 'express';
import { check, validationResult } from 'express-validator';
import supabase from '../../config/supabaseClient.js';
import authMiddleware from '../../middleware/auth.js';

const router = express.Router();

// @route    POST api/notes
// @desc     Create a note
// @access   Private
router.post(
  '/',
  [
    authMiddleware,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;
    const user_id = req.user.id;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ title, content, user_id }])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/notes
// @desc     Get all notes for a user (own and shared)
// @access   Private
router.get('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  try {
    // This uses an RPC function to get both owned and shared notes.
    // This function would need to be created in Supabase.
    // See db_schema.sql for a more advanced RLS-based approach.
    // For simplicity here, we'll just fetch owned notes. The RLS policies
    // defined in the schema will handle fetching shared notes automatically
    // if the client fetches directly. Since we are using a backend,
    // we need to be more explicit.

    // Fetch owned notes
    const { data: ownedNotes, error: ownedError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user_id);

    if (ownedError) throw ownedError;

    // Fetch shared notes
    const { data: sharedRelations, error: sharedError } = await supabase
        .from('shared_access')
        .select('note_id')
        .eq('shared_with_user_id', user_id);

    if (sharedError) throw sharedError;

    const sharedNoteIds = sharedRelations.map(r => r.note_id).filter(id => id);

    let sharedNotes = [];
    if (sharedNoteIds.length > 0) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .in('id', sharedNoteIds);
        if (error) throw error;
        sharedNotes = data;
    }

    res.json([...ownedNotes, ...sharedNotes]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/notes/:id
// @desc     Get note by ID
// @access   Private
router.get('/:id', authMiddleware, async (req, res) => {
    // RLS policies will handle access control.
    // This query will only return a result if the user is the owner
    // or has been granted shared access.
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', req.params.id)
            .single(); // .single() throws an error if more than one row is found

        if (error) throw error;
        if (!data) return res.status(404).json({ msg: 'Note not found or access denied' });

        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/notes/:id
// @desc     Delete a note
// @access   Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // RLS policy ensures only the owner can delete.
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id); // Double-check ownership on the backend

        if (error) throw error;

        res.json({ msg: 'Note removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/notes/:id
// @desc     Update a note
// @access   Private
router.put(
    '/:id',
    [
      authMiddleware,
      [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
      ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content } = req.body;

        try {
            // RLS policy ensures only the owner can update.
            const { data, error } = await supabase
                .from('notes')
                .update({ title, content })
                .eq('id', req.params.id)
                .eq('user_id', req.user.id) // Double-check ownership
                .select();

            if (error) throw error;
            if (!data || data.length === 0) return res.status(404).json({ msg: 'Note not found or user not authorized' });

            res.json(data[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route    PUT api/notes/:id/share
// @desc     Share a note with another user
// @access   Private
router.put(
  '/:id/share',
  [authMiddleware, [check('email', 'Email is required').isEmail()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note_id = req.params.id;
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

      // 2. Verify ownership of the note
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', note_id)
        .single();

      if (noteError || !note) {
        return res.status(404).json({ msg: 'Note not found' });
      }
      if (note.user_id !== owner_id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      // 3. Check if sharing with self
      if (shared_with_user_id === owner_id) {
          return res.status(400).json({ msg: 'You cannot share a note with yourself' });
      }

      // 4. Check if already shared
      const { data: existingShare, error: shareCheckError } = await supabase
        .from('shared_access')
        .select('*')
        .eq('note_id', note_id)
        .eq('shared_with_user_id', shared_with_user_id)
        .single();

      if (shareCheckError && shareCheckError.code !== 'PGRST116') { // Ignore 'not found' error
          throw shareCheckError;
      }
      if (existingShare) {
        return res.status(400).json({ msg: 'Note already shared with this user' });
      }

      // 5. Insert into shared_access table
      const { data, error: insertError } = await supabase
        .from('shared_access')
        .insert([{ note_id, shared_with_user_id }])
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
