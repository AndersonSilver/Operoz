export type ConsultoriaOperation = {
  name: string;
  description: string;
  domain: string;
  /** Dica de parâmetros para o discover */
  params: string[];
  hasBody: boolean;
};

export function cop(
  domain: string,
  name: string,
  description: string,
  params: string[],
  hasBody = false
): ConsultoriaOperation {
  return { domain, name, description, params, hasBody };
}
