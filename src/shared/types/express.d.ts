// Aumenta o tipo Request do Express para incluir "usuario": e onde o middleware de
// autenticacao guarda a identidade resolvida, disponivel para os demais handlers.
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        papel: string;
        status: string;
      };
    }
  }
}

// export vazio: torna o arquivo um modulo para o "declare global" ser aplicado.
export {};
