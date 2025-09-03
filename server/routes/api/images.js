const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Image = require('../../models/Image');
const User = require('../../models/User');

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

// @route   POST api/images
// @desc    Upload an image
// @access  Private
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload a file' });
    }

    const newImage = new Image({
      user: req.user.id,
      title: req.body.title || 'Untitled',
      imageUrl: req.file.path,
    });

    const image = await newImage.save();
    res.json(image);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/images
// @desc    Get all images for a user (own and shared)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
      const ownImages = await Image.find({ user: req.user.id }).sort({ date: -1 });
      const sharedImages = await Image.find({ sharedWith: req.user.id }).sort({ date: -1 });
      const images = [...ownImages, ...sharedImages];
      res.json(images);
    } catch (err)      {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/images/:id
// @desc     Delete an image
// @access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ msg: 'Image not found' });
        }

        // Check user
        if (image.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Delete image from filesystem
        fs.unlink(image.imageUrl, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error deleting file');
            }
        });

        await image.remove();

        res.json({ msg: 'Image removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Image not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route    PUT api/images/:id/share
// @desc     Share an image with another user
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
      const image = await Image.findById(req.params.id);
      if (!image) {
        return res.status(404).json({ msg: 'Image not found' });
      }

      // Check if the user is the owner of the image
      if (image.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }

      const userToShareWith = await User.findOne({ email: req.body.email });
      if (!userToShareWith) {
        return res.status(404).json({ msg: 'User to share with not found' });
      }

      // Check if trying to share with self
      if (userToShareWith.id === req.user.id) {
        return res.status(400).json({ msg: 'You cannot share an image with yourself' });
      }

      // Check if already shared with this user
      if (image.sharedWith.includes(userToShareWith.id)) {
        return res.status(400).json({ msg: 'Image already shared with this user' });
      }

      image.sharedWith.push(userToShareWith.id);
      await image.save();

      res.json(image);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
