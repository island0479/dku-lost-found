import axios from 'axios';

function getCsrf() {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1];
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(config => {
  if (!['get', 'head', 'options'].includes(config.method)) {
    config.headers['X-CSRFToken'] = getCsrf();
  }
  return config;
});

export default api;
