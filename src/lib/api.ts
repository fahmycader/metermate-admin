import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

  getUserProgress: async (id: string, startDate?: string, endDate?: string) => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get(`/users/${id}/progress`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Get user progress error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user progress');
    }
  },

  getUserLocation: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}/location`);
      return response.data;
    } catch (error: any) {
      console.error('Get user location error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user location');
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

  deleteJobsBulk: async (jobIds: string[]) => {
    try {
      const response = await api.delete('/jobs/bulk', { data: { jobIds } });
      return response.data;
    } catch (error: any) {
      console.error('Bulk delete jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete jobs');
    }
  },

  deleteUserJobs: async (userId: string) => {
    try {
      const response = await api.delete(`/jobs/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete user jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user jobs');
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

  getCompletedJobsByOperator: async (operatorId: string) => {
    try {
      const response = await api.get('/jobs', {
        params: {
          status: 'completed',
          assignedTo: operatorId,
          limit: 1000, // Get all completed jobs
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get completed jobs by operator error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get completed jobs');
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

  uploadExcel: async (file: File, assignedTo: string, scheduledDate: string, priority: string = 'medium') => {
    try {
      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('assignedTo', assignedTo);
      formData.append('scheduledDate', scheduledDate);
      formData.append('priority', priority);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/jobs/upload-excel`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload Excel error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload Excel file');
    }
  },
};

export const messagesAPI = {
  getMessages: async () => {
    try {
      const response = await api.get('/messages/admin/list');
      return response.data;
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get messages');
    }
  },

  sendMessage: async (messageData: any) => {
    try {
      const response = await api.post('/messages', messageData);
      return response.data;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Mark message as read error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark message as read');
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      // Admin can delete any message using the admin endpoint
      const response = await api.delete(`/messages/admin/${messageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  },
};

export const vehicleCheckAPI = {
  getVehicleChecks: async (params?: any) => {
    try {
      const response = await api.get('/vehicle-checks', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get vehicle checks error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get vehicle checks');
    }
  },

  getVehicleCheck: async (id: string) => {
    try {
      const response = await api.get(`/vehicle-checks/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get vehicle check error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get vehicle check');
    }
  },

  getVehicleChecksByOperative: async (operativeId: string) => {
    try {
      const response = await api.get(`/vehicle-checks/operative/${operativeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get vehicle checks by operative error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get vehicle checks');
    }
  },
};

export default api;