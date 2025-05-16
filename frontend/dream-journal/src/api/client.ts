import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:50051';

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: number;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

export interface Dream {
  id: string;
  userId: string;
  text: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  count?: number;
}

export interface Stats {
  totalDreams: number;
  publicDreams: number;
  privateDreams: number;
  mostCommonTags: Tag[];
  dreamFrequency: number[];
}

export interface CreateDreamRequest {
  title: string;
  content: string;
}

const client = {
  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/login`, { email, password });
    return response.data;
  },

  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/register`, { email, username, password });
    return response.data;
  },

  async me(): Promise<User> {
    const response = await axios.get<User>(`${API_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Dreams
  async getDreams(): Promise<Dream[]> {
    const response = await axios.get(`${API_URL}/api/dreams`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async getDream(id: string): Promise<Dream> {
    const response = await axios.get(`${API_URL}/api/dreams/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async createDream(dream: CreateDreamRequest): Promise<Dream> {
    const response = await axios.post(`${API_URL}/api/dreams`, dream, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Stats
  async getStats(userId: string): Promise<Stats> {
    const response = await axios.get<Stats>(`${API_URL}/api/users/${userId}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  // Tags
  async getTags(userId: string): Promise<Tag[]> {
    const response = await axios.get<Tag[]>(`${API_URL}/api/users/${userId}/tags`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  async summarizeDream(id: string): Promise<string> {
    const response = await axios.post(`${API_URL}/api/dreams/summary`, { id }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.summary;
  },

  async generateProphecy(id: string): Promise<string> {
    const response = await axios.post(`${API_URL}/api/dreams/prophecy`, { id }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.prophecy;
  },

  async getDreamTags(id: string): Promise<string[]> {
    const response = await axios.get(`${API_URL}/api/dreams/${id}/tags`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.tags;
  },
};

export default client; 