import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token, user }
};

export const register = async ({ name, email, role, password }) => {
  const { data } = await api.post('/auth/register', { name, email, role, password });
  return data; // { token, user }
};
export const logout = () => Promise.resolve();

