import express from 'express';
import { check, validationResult } from 'express-validator';
import supabase from '../../config/supabaseClient.js';

const router = express.Router();

// @route   POST api/auth
// @desc    Authenticate user & get session (Login)
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ errors: [{ msg: error.message }] });
      }

      res.json(data); // Returns user and session object (with access_token)

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'http://localhost:5173' // The page where user is redirected after login
        }
    });

    if (error) {
        return res.status(500).json({ msg: 'Error initiating Google login', error: error.message });
    }

    // Redirect the user to the URL provided by Supabase for the OAuth flow
    res.redirect(data.url);
});

// The OAuth callback is handled on the frontend by the Supabase client library.
// When the user is redirected back to the app from Google, the Supabase client
// in the browser will detect the session information in the URL and complete
// the authentication flow. No backend callback endpoint is needed.

export default router;
