export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
export const notFound = (what: string): AppError =>
  new AppError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (msg: string): AppError => new AppError(409, 'CONFLICT', msg);
export const unauthorized = (): AppError =>
  new AppError(401, 'UNAUTHORIZED', 'Missing or invalid author token');
export class UpstreamError extends Error {
  constructor(message = 'Upstream content service unavailable') {
    super(message);
    this.name = 'UpstreamError';
  }
}
