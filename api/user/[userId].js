const { findUserById } = require('../_lib/users');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query || {};

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  const user = findUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      profile: user.profile,
    },
  });
};
