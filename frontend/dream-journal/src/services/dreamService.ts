import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:50051';

export interface Dream {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  profileImageURL?: string;
  title?: string;
  text: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface CreateDreamRequest {
  title?: string;
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

  async listDreams(publicOnly?: boolean, userId?: string): Promise<Dream[]> {
    const params: any = {};
    if (publicOnly) params.public = true;
    if (userId) params.userId = userId;
    const response = await axios.get(`${API_URL}/api/dreams`, {
      params,
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