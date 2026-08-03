export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: Record<string, any>;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
