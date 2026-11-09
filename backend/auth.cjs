const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');
const { hashPassword, verifyPassword } = require('./passwords.cjs');
const { HttpError } = require('./errors.cjs');
const { transaction } = require('./db.cjs');
const v = require('./validation.cjs');
const { production } = require('./config.cjs');
const COOKIE = production ? '__Host-zenith_session' : 'zenith_session';
const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
const digest = value => createHash('sha256').update(value).digest('hex');
let dummyHash;
function credentials(body) {
  v.object(body);
  const email = v.text(body.email,'Email',254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) v.invalid('Email inválido.');
  const senha = body.senha;
  if (typeof senha !== 'string' || senha.length < 10 || senha.length > 128) v.invalid('Use uma senha de 10 a 128 caracteres.');
  return { email, senha };
}
function createAuth(pool, allowedOrigins) {
  function requireOrigin(req,res,next) {
    if (!allowedOrigins.includes(req.get('Origin'))) return next(new HttpError(403,'Origem não autorizada.','ORIGIN_DENIED'));
    next();
  }
  async function user(req,res,next) {
    const cookies = (req.headers.cookie || '').split(';').map(c => c.trim());
    const raw = cookies.find(c => c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) throw new HttpError(401,'Entre na sua conta.','UNAUTHENTICATED');
    const { rows } = await pool.query(`SELECT u.id,u.nome,u.email,s.csrf,s.token_hash FROM sessoes s
      JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=$1 AND s.expira_em>now()`, [digest(raw)]);
    if (!rows[0]) throw new HttpError(401,'Sua sessão expirou. Entre novamente.','UNAUTHENTICATED');
    req.user = { id: rows[0].id, nome: rows[0].nome, email: rows[0].email };
    req.session = { csrf: rows[0].csrf, hash: rows[0].token_hash };
    next();
  }
  function csrf(req,res,next) {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
    if (!allowedOrigins.includes(req.get('Origin'))) return next(new HttpError(403,'Origem não autorizada.','ORIGIN_DENIED'));
    const token=req.get('X-CSRF-Token')||'';
    if (!/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(token),Buffer.from(req.session.csrf))) return next(new HttpError(403,'Sessão desatualizada. Recarregue a página.','CSRF_INVALID'));
    next();
  }
  async function startSession(client, userId) {
    const raw=randomBytes(32).toString('hex'), token=randomBytes(32).toString('hex');
    await client.query('DELETE FROM sessoes WHERE usuario_id=$1 AND expira_em<=now()', [userId]);
    await client.query("INSERT INTO sessoes(token_hash,usuario_id,csrf,expira_em) VALUES ($1,$2,$3,now()+interval '7 days')", [digest(raw),userId,token]);
    return { raw, csrf:token };
  }
  const router=Router();
  const limiter=rateLimit({ windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,
    handler(req,res){res.status(429).json({error:{code:'RATE_LIMIT',message:'Muitas tentativas. Aguarde 15 minutos.'}});} });
  router.post('/register',requireOrigin,limiter,async(req,res)=>{
    const {email,senha}=credentials(req.body);const nome=v.text(req.body.nome,'Nome',100);
    const hash=await hashPassword(senha);
    const result=await transaction(pool,async client=>{
      const {rows}=await client.query('INSERT INTO usuarios(nome,email,senha_hash) VALUES ($1,$2,$3) RETURNING id,nome,email',[nome,email,hash]);
      const session=await startSession(client,rows[0].id);return {user:rows[0],session};
    });
    res.cookie(COOKIE,result.session.raw,{...cookieOptions,maxAge:7*24*60*60*1000});
    res.status(201).json({data:{usuario:result.user,csrf:result.session.csrf}});
  });
  router.post('/login',requireOrigin,limiter,async(req,res)=>{
    const {email,senha}=credentials(req.body);
    const {rows}=await pool.query('SELECT id,nome,email,senha_hash FROM usuarios WHERE email=$1',[email]);
    // Mesmo trabalho criptográfico para email inexistente.
    dummyHash ||= hashPassword(randomBytes(32).toString('hex'));
    const valid=await verifyPassword(senha,rows[0]?.senha_hash||await dummyHash);
    if(!rows[0]||!valid)throw new HttpError(401,'Email ou senha incorretos.','INVALID_CREDENTIALS');
    const session=await transaction(pool,client=>startSession(client,rows[0].id));
    const {senha_hash,...usuario}=rows[0];
    res.cookie(COOKIE,session.raw,{...cookieOptions,maxAge:7*24*60*60*1000});
    res.json({data:{usuario,csrf:session.csrf}});
  });
  router.get('/me',user,(req,res)=>res.json({data:{usuario:req.user,csrf:req.session.csrf}}));
  router.post('/logout',user,csrf,async(req,res)=>{
    await pool.query('DELETE FROM sessoes WHERE token_hash=$1',[req.session.hash]);
    res.clearCookie(COOKIE,cookieOptions);res.status(204).end();
  });
  return { router, guard:[user,csrf] };
}
module.exports={createAuth};
