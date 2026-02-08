// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface User {
  name: string;
  phone_number: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Token management
export const authService = {
  // Store token in localStorage
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  // Remove token
  removeToken: () => {
    localStorage.removeItem('auth_token');
  },

  // Store user data
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get user data
  getUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Remove user data
  removeUser: () => {
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    if (!token) return false;

    // Decode token to check expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        authService.logout();
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    
    // Store token and user
    authService.setToken(data.token);
    authService.setUser(data.user);
    
    return data;
  },

  // Register
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    
    // Store token and user
    authService.setToken(data.token);
    authService.setUser(data.user);
    
    return data;
  },

  // Logout
  logout: () => {
    authService.removeToken();
    authService.removeUser();
  },

  // Get current user from API
  getCurrentUser: async (): Promise<User> => {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },
};

// API helper with authentication
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = authService.getToken();

  // Normalize headers into a plain object
  const normalizedHeaders: Record<string, string> = {};

  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      normalizedHeaders[key] = value;
    });
  } else if (Array.isArray(options.headers)) {
    for (const [key, value] of options.headers) {
      normalizedHeaders[key] = value;
    }
  } else if (options.headers) {
    Object.assign(normalizedHeaders, options.headers);
  }

  // Add your default and auth headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...normalizedHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    authService.logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  return response;
};
