import express from 'express';
import { check, validationResult } from 'express-validator';
import supabase from '../../config/supabaseClient.js';

const router = express.Router();

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        // This will catch errors like "User already registered"
        return res.status(400).json({ errors: [{ msg: error.message }] });
      }

      // Supabase may send a confirmation email depending on project settings.
      // The user object is in data.user. A session is in data.session.
      // If email confirmation is off, a session is returned immediately.
      res.status(201).json(data);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;
