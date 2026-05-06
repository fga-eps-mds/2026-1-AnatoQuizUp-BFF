declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        perfil: string;
        status: string;
      };
    }
  }
}

export {};
