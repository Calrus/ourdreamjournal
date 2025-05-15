export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues extends LoginFormValues {
  username: string;
} 