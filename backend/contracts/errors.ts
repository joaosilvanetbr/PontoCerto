export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(message: string): AppError {
  return new AppError(message, 400, "BAD_REQUEST");
}

export function unauthorized(message: string = "Nao autorizado"): AppError {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message: string = "Acesso negado"): AppError {
  return new AppError(message, 403, "FORBIDDEN");
}

export function notFound(message: string = "Nao encontrado"): AppError {
  return new AppError(message, 404, "NOT_FOUND");
}

export function internal(message: string = "Erro interno do servidor"): AppError {
  return new AppError(message, 500, "INTERNAL_ERROR");
}

export function rateLimited(message: string = "Muitas tentativas. Aguarde um momento."): AppError {
  return new AppError(message, 429, "RATE_LIMITED");
}
