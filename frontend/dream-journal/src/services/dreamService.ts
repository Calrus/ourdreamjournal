import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:50051';

export interface Dream {
  id: string;
  userId: string;
  text: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDreamRequest {
  userId: string;
  text: string;
  public: boolean;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const dreamService = {
  async createDream(data: CreateDreamRequest): Promise<Dream> {
    const response = await axios.post(`${API_URL}/api/dreams`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async listDreams(userId: string, publicOnly: boolean = false): Promise<Dream[]> {
    const response = await axios.get(`${API_URL}/api/dreams`, {
      params: { userId, public: publicOnly },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async deleteDream(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/dreams/${id}`, {
      headers: getAuthHeader(),
    });
  },
}; 