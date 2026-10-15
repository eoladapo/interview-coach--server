import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../interfaces/auth.interface';

export const generateToken = (payload: Omit<AuthJwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    payload as object,
    secret,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): AuthJwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, secret) as AuthJwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const refreshToken = (token: string): string => {
  const decoded = verifyToken(token);
  const { iat, exp, ...payload } = decoded;
  return generateToken(payload);
};