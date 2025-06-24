// Ensures TypeScript knows about the shape of `req.user`
import 'express';

declare module 'express-serve-static-core' {
  interface User {
    id: string;
  }

  interface Request {
    user?: User;
  }
}

export {};;;
