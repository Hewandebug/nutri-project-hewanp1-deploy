const { createUser, findUserByEmail } = require('../_lib/users');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (!email.endsWith('@college.harvard.edu')) {
    return res.status(400).json({
      success: false,
      message: 'Please use a valid Harvard College email (@college.harvard.edu)',
    });
  }

  if (findUserByEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  const newUser = createUser({ email, password });

  return res.status(200).json({
    success: true,
    message: 'Account created successfully',
    userId: newUser.id,
  });
};
