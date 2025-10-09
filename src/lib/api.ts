import axios from 'axios';

const API_BASE_URL = 'http://192.168.8.163:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const usersAPI = {
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  },

  getMeterReaders: async () => {
    try {
      const response = await api.get('/users?role=meter_reader');
      return response.data;
    } catch (error: any) {
      console.error('Get meter readers error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get meter readers');
    }
  },

  getMeterUsers: async () => {
    try {
      const response = await api.get('/users/meter');
      return response.data;
    } catch (error: any) {
      console.error('Get meter users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get meter users');
    }
  },

  createUser: async (userData: any) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  updateUser: async (id: string, userData: any) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },
};

export const housesAPI = {
  getHouses: async (params?: any) => {
    try {
      const response = await api.get('/houses', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get houses error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get houses');
    }
  },

  createHouse: async (houseData: any) => {
    try {
      const response = await api.post('/houses', houseData);
      return response.data;
    } catch (error: any) {
      console.error('Create house error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create house');
    }
  },

  updateHouse: async (id: string, houseData: any) => {
    try {
      const response = await api.put(`/houses/${id}`, houseData);
      return response.data;
    } catch (error: any) {
      console.error('Update house error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update house');
    }
  },

  deleteHouse: async (id: string) => {
    try {
      const response = await api.delete(`/houses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete house error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete house');
    }
  },
};

export const jobsAPI = {
  getJobs: async (params?: any) => {
    try {
      const response = await api.get('/jobs', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get jobs');
    }
  },

  getAssignedJobs: async (params?: any) => {
    try {
      const response = await api.get('/jobs/assigned', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get assigned jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get assigned jobs');
    }
  },

  getJob: async (id: string) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get job');
    }
  },

  createJob: async (jobData: any) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error: any) {
      console.error('Create job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create job');
    }
  },

  updateJob: async (id: string, jobData: any) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error: any) {
      console.error('Update job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update job');
    }
  },

  deleteJob: async (id: string) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete job');
    }
  },

  getUserJobCount: async (userId: string, params?: any) => {
    try {
      const response = await api.get(`/jobs/user/${userId}/count`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Get user job count error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user job count');
    }
  },

  getMileageReport: async (params?: any) => {
    try {
      const response = await api.get('/jobs/mileage-report', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get mileage report error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get mileage report');
    }
  },

  getWageReport: async (params?: any) => {
    try {
      const response = await api.get('/jobs/wage-report', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get wage report error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get wage report');
    }
  },
};

export default api;