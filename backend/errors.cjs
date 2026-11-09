class HttpError extends Error {
  constructor(status, message, code = 'INVALID_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error instanceof HttpError ? error.status : 500;
  let message = error instanceof HttpError ? error.message : 'Não foi possível concluir a operação.';
  let code = error instanceof HttpError ? error.code : 'INTERNAL_ERROR';
  if (error.type === 'entity.parse.failed') { status = 400; message = 'JSON inválido.'; code = 'INVALID_JSON'; }
  if (error.type === 'entity.too.large') { status = 413; message = 'Requisição muito grande.'; code = 'PAYLOAD_TOO_LARGE'; }
  if (error.code === '23505') { status = 409; message = 'Registro já existente.'; code = 'CONFLICT'; }
  if (error.code === '23503' || error.code === '23514' || error.code === '22007' || error.code === '22008') {
    status = 400; message = 'Dados incompatíveis com as regras do banco.'; code = 'INVALID_DATA';
  }
  res.status(status).json({ error: { code, message } });
}
module.exports = { HttpError, errorHandler };
