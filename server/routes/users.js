const express = require('express');
const router = express.Router();
const supabase = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { authenticateUser } = require('../middleware/auth');

// Add default admin user
const createDefaultAdmin = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', process.env.ADMIN_EMAIL);

  if (data && data.length === 0) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await supabase.from('users').insert([{
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      password: hashedPassword,
      role: process.env.ADMIN_ROLE,
      position: process.env.ADMIN_POSITION,
      start_date: new Date(process.env.ADMIN_START_DATE)
    }]);
  }
};

createDefaultAdmin();

// Get current user data
router.get('/me', authenticateUser, async (req, res) => {
  try {
    // Exclude password from response
    const { password, ...userData } = req.user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new user
router.post('/add', async (req, res) => {
  const { name, email, phone, password, role, position, start_date } = req.body;
  
  // Validation
  if (!name || !email || !phone || !password || !role || !position || !start_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (phone.length !== 10 || isNaN(phone)) {
    return res.status(400).json({ error: 'Phone number must be 10 digits' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        position,
        start_date: new Date(start_date)
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const user = users[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google authentication
router.post('/google-auth', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Google token is required' });
  }

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) throw error;

    let user;
    
    if (users && users.length > 0) {
      // User exists - log them in
      user = users[0];
    } else {
      // Create new user (optional - depends on your requirements)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          role: 'User', // Default role
          position: 'Google User',
          start_date: new Date()
        }])
        .select();

      if (createError) throw createError;
      user = newUser[0];
    }

    // Create JWT token
    const authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token: authToken, role: user.role });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Get all users (for admin)
router.get('/', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { id } = req.params;
    const { name, email, phone, role, position, start_date } = req.body;

    // Validation
    if (!name || !email || !phone || !role || !position || !start_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (phone.length !== 10 || isNaN(phone)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    const { error } = await supabase
      .from('users')
      .update({
        name,
        email,
        phone,
        role,
        position,
        start_date: new Date(start_date)
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (newPassword.length < 6 || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters with at least 1 letter and 1 number'
    });
  }

  try {
    // Check if user exists
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Invalid email id to reset password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);

    if (updateError) throw updateError;

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;