import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// simple axios instance with auth header injection
const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigem_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// helpful logging when the API cannot be reached (e.g. server not running or CORS failure)
api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    // err.response is undefined when network error / CORS block occurs
    if (!err.response) {
      console.error(
        "[SIGEM-DASH] network error talking to API at",
        baseURL,
        "– make sure the SIGEM-API server is running and CORS allows",
        "your origin (http://localhost:8080)."
      );
    }
    return Promise.reject(err);
  }
);

export default api;
