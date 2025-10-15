const { findUserById, updateUserProfile } = require('../_lib/users');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, name, gender, sportType, trainingFrequency, dietGoal } = req.body || {};

  if (!userId || !name || !gender || !sportType || !trainingFrequency || !dietGoal) {
    return res.status(400).json({
      success: false,
      message: 'Missing required onboarding information',
    });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const updatedUser = updateUserProfile(userId, {
    name,
    gender,
    sportType,
    trainingFrequency,
    dietGoal,
  });

  return res.status(200).json({
    success: true,
    message: 'Onboarding completed successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      profile: updatedUser.profile,
    },
  });
};
