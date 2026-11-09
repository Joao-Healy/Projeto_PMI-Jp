const { HttpError } = require('./errors.cjs');
const categories = ['Estudos', 'Trabalho', 'Treino', 'Pessoal'];
function invalid(message) { throw new HttpError(400, message, 'VALIDATION_ERROR'); }
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Envie um objeto JSON.');
  return value;
}
function text(value, label, max, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) invalid(`${label} inválido (máximo ${max} caracteres).`);
  return value.trim();
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid('Data inválida: use AAAA-MM-DD.');
  const parsed = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value < '1900-01-01' || value > '9999-12-31') invalid('Data inexistente ou fora do intervalo permitido.');
  return value;
}
function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function id(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid('Identificador inválido.');
  return value;
}
function task(body, previous, importing = false) {
  object(body);
  const nome = text(body.nome, 'Nome', 100);
  if (!categories.includes(body.categoria)) invalid('Categoria inválida.');
  const data = date(body.data);
  if (!importing && data < today() && data !== previous?.data) invalid('Escolha hoje ou uma data futura.');
  const concluida = body.concluida === undefined ? false : body.concluida;
  if (typeof concluida !== 'boolean') invalid('Conclusão deve ser booleana.');
  return { nome, categoria: body.categoria, data, concluida };
}
module.exports = { invalid, object, text, date, today, id, task };
