const getStore = () => {
  if (!globalThis.__crimsonFuelUsers) {
    globalThis.__crimsonFuelUsers = [];
  }
  return globalThis.__crimsonFuelUsers;
};

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const findUserByEmail = (email) => {
  return getStore().find((user) => user.email === email);
};

const findUserById = (id) => {
  return getStore().find((user) => user.id === id);
};

const createUser = ({ email, password }) => {
  const store = getStore();
  const newUser = {
    id: generateId(),
    email,
    password,
    createdAt: new Date().toISOString(),
  };
  store.push(newUser);
  return newUser;
};

const updateUserProfile = (userId, profile) => {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  user.profile = {
    ...profile,
    completedAt: new Date().toISOString(),
  };

  return user;
};

module.exports = {
  getStore,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
};
