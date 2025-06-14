// const API_BASE_URL = 'http://localhost:3001/api';
// const API_BASE_URL = 'https://attedance-panel.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

  async forgotPassword(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to send reset link');
  }

  return response.json(); // Expecting: { message: "Reset link sent" }
}

async requestOtp(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error('Failed to send OTP');
  return response.json();
}

async verifyOtp(email: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) throw new Error('OTP verification failed');
  return response.json();
}

async resetPassword(email: string, newPassword: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ email, newPassword, otp })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return response.json();
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

  async addCheckInOut(type: 'check-in' | 'check-out', location: any, partyId?: string) {
    const response = await fetch(`${API_BASE_URL}/attendance/checkin-checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ type, location, partyId }),
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

  // Party management methods
  async getParties() {
    const response = await fetch(`${API_BASE_URL}/party`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get parties');
    }

    return response.json();
  }

  async getAllParties() {
    const response = await fetch(`${API_BASE_URL}/party/all`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get all parties');
    }

    return response.json();
  }

  async createParty(name: string, description?: string) {
    const response = await fetch(`${API_BASE_URL}/party`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      throw new Error('Failed to create party');
    }

    return response.json();
  }

  async updateParty(id: string, name: string, description?: string, isActive?: boolean) {
    const response = await fetch(`${API_BASE_URL}/party/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description, isActive }),
    });

    if (!response.ok) {
      throw new Error('Failed to update party');
    }

    return response.json();
  }

  async deleteParty(id: string) {
    const response = await fetch(`${API_BASE_URL}/party/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete party');
    }

    return response.json();
  }
}

export const apiService = new ApiService();