import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: any, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
