import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api', // Твій порт бекенду
});

// Додаємо інтерцептор, який прикріплює токен до КОЖНОГО запиту
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;