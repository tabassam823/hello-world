const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Note = require('../../models/Note');
const User = require('../../models/User');

// @route    POST api/notes
// @desc     Create a note
// @access   Private
router.post(
  '/',
  [
    auth,
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

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newNote = new Note({
        title: req.body.title,
        content: req.body.content,
        user: req.user.id,
      });

      const note = await newNote.save();

      res.json(note);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/notes
// @desc     Get all notes for a user (own and shared)
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const ownNotes = await Note.find({ user: req.user.id }).sort({ date: -1 });
    const sharedNotes = await Note.find({ sharedWith: req.user.id }).sort({ date: -1 });
    const notes = [...ownNotes, ...sharedNotes];
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/notes/:id
// @desc     Get note by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    // Check user
    if (note.user.toString() !== req.user.id && !note.sharedWith.includes(req.user.id)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(note);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/notes/:id
// @desc     Delete a note
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    // Check user
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await note.remove();

    res.json({ msg: 'Note removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Note not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/notes/:id
// @desc     Update a note
// @access   Private
router.put(
    '/:id',
    [
      auth,
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
            let note = await Note.findById(req.params.id);

            if (!note) {
                return res.status(404).json({ msg: 'Note not found' });
            }

            // Check user
            if (note.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            note = await Note.findByIdAndUpdate(
                req.params.id,
                { $set: { title, content } },
                { new: true }
            );

            res.json(note);
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
  [auth, [check('email', 'Email is required').isEmail()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).json({ msg: 'Note not found' });
      }

      // Check if the user is the owner of the note
      if (note.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      const userToShareWith = await User.findOne({ email: req.body.email });
      if (!userToShareWith) {
        return res.status(404).json({ msg: 'User to share with not found' });
      }

      // Check if trying to share with self
      if (userToShareWith.id === req.user.id) {
        return res.status(400).json({ msg: 'You cannot share a note with yourself' });
      }

      // Check if already shared with this user
      if (note.sharedWith.includes(userToShareWith.id)) {
        return res.status(400).json({ msg: 'Note already shared with this user' });
      }

      note.sharedWith.push(userToShareWith.id);
      await note.save();

      res.json(note);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
