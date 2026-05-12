const CONNECTIVITY_MESSAGE = "Nao foi possivel conectar ao servidor. Tente novamente em alguns instantes.";
const LOGIN_MESSAGE = "Nao foi possivel entrar. Verifique seus dados e tente novamente.";
const SESSION_MESSAGE = "Sua sessao expirou. Faca login novamente.";

export function getErrorMessage(error: unknown, fallback = LOGIN_MESSAGE): string {
  if (!(error instanceof Error)) return fallback;

  const source = `${error.name} ${error.message}`.toLowerCase();

  if (
    source.includes("json.parse") ||
    source.includes("unexpected end of data") ||
    source.includes("trpcclienterror") ||
    source.includes("failed to fetch") ||
    source.includes("networkerror") ||
    source.includes("internal server error")
  ) {
    return CONNECTIVITY_MESSAGE;
  }

  if (source.includes("unauthorized") || source.includes("forbidden")) {
    return SESSION_MESSAGE;
  }

  return error.message || fallback;
}

