import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:50051';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  description?: string;
  profileImageURL?: string;
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
  username?: string;
  displayName?: string;
  profileImageURL?: string;
  title?: string;
  text: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  nightmare_rating?: number;
  vividness_rating?: number;
  clarity_rating?: number;
  emotional_intensity_rating?: number;
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
  text: string;
  public: boolean;
  nightmare_rating?: number;
  vividness_rating?: number;
  clarity_rating?: number;
  emotional_intensity_rating?: number;
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

  async deleteDream(id: string): Promise<void> {
    await axios.delete(`${API_URL}/api/dreams/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
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

  async getPublicProfile(username: string): Promise<{ user: User; dreams: any[] }> {
    const response = await axios.get(`${API_URL}/api/users/${username}/public`);
    return response.data;
  },

  async getOwnProfile(): Promise<User> {
    const response = await axios.get(`${API_URL}/api/users/me/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  async updateOwnProfile(profile: { displayName: string; description: string; profileImageURL: string }): Promise<void> {
    await axios.put(`${API_URL}/api/users/me/profile`, profile, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  },

  // Friend system
  async sendFriendRequest(userId: string, friendId: string): Promise<{ status: string }> {
    const response = await axios.post(`${API_URL}/api/friends/request`, { user_id: userId, friend_id: friendId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },
  async acceptFriendRequest(userId: string, friendId: string): Promise<{ status: string }> {
    const response = await axios.post(`${API_URL}/api/friends/accept`, { user_id: userId, friend_id: friendId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },
  async removeFriend(userId: string, friendId: string): Promise<{ status: string }> {
    const response = await axios.post(`${API_URL}/api/friends/remove`, { user_id: userId, friend_id: friendId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },
  async listFriends(userId: string): Promise<{ friends: any[] }> {
    const response = await axios.get(`${API_URL}/api/friends`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      params: { user_id: userId },
    });
    return response.data;
  },
  async listFriendsDreams(userId: string): Promise<{ dreams: any[] }> {
    const response = await axios.get(`${API_URL}/api/friends/dreams`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      params: { user_id: userId },
    });
    return response.data;
  },
  async listPendingFriendRequests(userId: string): Promise<{ requests: any[] }> {
    const response = await axios.get(`${API_URL}/api/friends`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      params: { pending_for: userId },
    });
    return response.data;
  },

  // Comments
  async getComments(dreamId: string): Promise<{ comments: any[] }> {
    const response = await axios.get(`${API_URL}/api/dreams/${dreamId}/comments`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },
  async addComment(dreamId: string, text: string): Promise<any> {
    const response = await axios.post(
      `${API_URL}/api/dreams/${dreamId}/comments`,
      { text },
      { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  },
  async deleteComment(commentId: number): Promise<void> {
    await axios.delete(`${API_URL}/api/comments/${commentId}`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  },

  async updateDreamTags(id: string, tags: string[]): Promise<void> {
    await axios.put(`${API_URL}/api/dreams/${id}/tags`, { tags }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

export default client; 