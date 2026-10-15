import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      ...(message && { message })
    } as ApiResponse<T>);
  }

  static error(res: Response, error: string, statusCode = 500): Response {
    return res.status(statusCode).json({
      success: false,
      error
    } as ApiResponse);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message = 'Operation completed successfully'): Response {
    return res.status(204).json({
      success: true,
      message
    } as ApiResponse);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  static badRequest(res: Response, message = 'Bad request'): Response {
    return this.error(res, message, 400);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static paginated<T>(
    res: Response, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    
    return res.json({
      success: true,
      data,
      ...(message && { message }),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    } as ApiResponse<T[]>);
  }
}