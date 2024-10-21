import axios from 'axios';

export const createEmergencyRequest = async (data) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAllEmergencies = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getEmergencyStatus = async (id) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateEmergencyStatus = async (id, status) => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/emergency/${id}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` }}
  );
  return response.data;
};