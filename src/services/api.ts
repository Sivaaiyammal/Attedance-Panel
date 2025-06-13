const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  }

  async getAttendanceRecords() {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get attendance records');
    }

    return response.json();
  }

  async getTodaysRecord() {
    const response = await fetch(`${API_BASE_URL}/attendance/today`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get today\'s record');
    }

    return response.json();
  }

  async addCheckInOut(type: 'check-in' | 'check-out', location: any) {
    const response = await fetch(`${API_BASE_URL}/attendance/checkin-checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ type, location }),
    });

    if (!response.ok) {
      throw new Error('Failed to add check-in/out');
    }

    return response.json();
  }

  async getUserStats(userId?: string) {
    const url = userId 
      ? `${API_BASE_URL}/attendance/stats/${userId}`
      : `${API_BASE_URL}/attendance/stats`;
      
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user stats');
    }

    return response.json();
  }
}

export const apiService = new ApiService();