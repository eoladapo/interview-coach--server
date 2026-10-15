export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  access_token: string;
  user: UserResponse;
}

export interface AuthJwtPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: UserResponse;
}