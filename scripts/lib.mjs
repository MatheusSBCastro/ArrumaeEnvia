import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const normalizar = (value) => String(value ?? '').normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
export const html = (value) => String(value ?? '').replace(/[&<>"']/g,
  (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const md = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[\\`*_{}\[\]<>|]/g, '\\$&');
const string = (value) => typeof value === 'string' && value.trim().length > 0;
const list = (value) => Array.isArray(value) && value.every(string);
const data = (value) => /^\d{4}-\d{2}$/.test(value ?? '') && Number(value.slice(5)) >= 1 && Number(value.slice(5)) <= 12;

export async function lerJSON(file) {
  try { return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`Não foi possível ler ${file}: ${error.message}`); }
}

export async function gravar(file, content, { exclusivo = false } = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, { encoding: 'utf8', flag: exclusivo ? 'wx' : 'w' });
}

export function urlSegura(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error();
    return parsed;
  } catch { throw new Error('Informe uma URL HTTPS pública, sem credenciais.'); }
}

export function validarPerfil(p) {
  const erros = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return ['Perfil deve ser um objeto JSON.'];
  if (p.versao !== 1) erros.push('versao deve ser 1.');
  if (!string(p.pessoa?.nome)) erros.push('Preencha pessoa.nome.');
  if (!string(p.resumo)) erros.push('Preencha resumo com fatos confirmados.');
  for (const key of ['cargos', 'foco', 'senioridades', 'modelos', 'localidades_presenciais', 'contratos']) {
    if (!list(p.objetivo?.[key])) erros.push(`objetivo.${key} deve ser uma lista de textos.`);
  }
  if (!p.objetivo?.cargos?.length) erros.push('Informe pelo menos um cargo alvo.');
  if (!Number.isInteger(p.objetivo?.limite_candidaturas_por_rodada) || p.objetivo.limite_candidaturas_por_rodada < 1)
    erros.push('Defina um limite inteiro positivo de candidaturas por rodada.');
  for (const tipo of ['CLT', 'PJ']) {
    const valor = p.objetivo?.pretensao?.[tipo];
    if (valor !== null && !(typeof valor === 'number' && Number.isFinite(valor) && valor > 0))
      erros.push(`objetivo.pretensao.${tipo}: use um valor positivo ou null.`);
  }
  for (const key of ['competencias', 'experiencias', 'projetos', 'formacao', 'idiomas', 'pendencias'])
    if (!Array.isArray(p[key])) erros.push(`${key} deve ser uma lista.`);
  for (const [i, c] of (Array.isArray(p.competencias) ? p.competencias : []).entries()) {
    if (!c || !string(c.nome) || typeof c.confirmado !== 'boolean' || !list(c.aliases) || !string(c.evidencia))
      erros.push(`competencias[${i}]: informe nome, confirmado (booleano), aliases e evidencia.`);
  }
  for (const key of ['linkedin', 'portfolio']) {
    if (p.pessoa?.[key]) try { urlSegura(p.pessoa[key]); } catch { erros.push(`pessoa.${key}: URL HTTPS inválida.`); }
  }
  for (const key of ['experiencias', 'formacao']) {
    for (const [i, item] of (Array.isArray(p[key]) ? p[key] : []).entries()) {
      if (!item || !data(item.inicio) || (item.fim && !data(item.fim))) erros.push(`${key}[${i}]: datas devem usar AAAA-MM.`);
      if (item?.inicio && item?.fim && item.fim < item.inicio) erros.push(`${key}[${i}]: fim anterior ao início.`);
      if (key === 'experiencias' && (!string(item?.empresa) || !string(item?.cargo) || !list(item?.realizacoes) || typeof item?.atual !== 'boolean'))
        erros.push(`${key}[${i}]: informe empresa, cargo, atual e realizacoes.`);
      if (key === 'experiencias' && item?.atual && item?.fim) erros.push(`${key}[${i}]: experiência atual deve ter fim vazio.`);
      if (key === 'formacao' && (!string(item?.instituicao) || !string(item?.curso) || !string(item?.situacao)))
        erros.push(`${key}[${i}]: informe instituicao, curso e situacao.`);
    }
  }
  for (const [i, item] of (Array.isArray(p.projetos) ? p.projetos : []).entries()) {
    if (!item || !string(item.nome) || !string(item.descricao) || !list(item.tecnologias)) erros.push(`projetos[${i}]: informe nome, descricao e tecnologias.`);
    if (item?.url) try { urlSegura(item.url); } catch { erros.push(`projetos[${i}]: URL HTTPS inválida.`); }
  }
  for (const [i, item] of (Array.isArray(p.idiomas) ? p.idiomas : []).entries())
    if (!string(item?.idioma) || !string(item?.nivel)) erros.push(`idiomas[${i}]: informe idioma e nivel confirmado.`);
  return erros;
}

export function exigirPerfil(p) {
  const erros = validarPerfil(p);
  if (erros.length) throw new Error(erros.join('\n'));
  return p;
}

const mes = (value) => value ? value.split('-').reverse().join('/') : '';
const periodo = (item) => `${mes(item.inicio)} - ${item.atual ? 'Atual' : mes(item.fim)}`;

export function blocosCurriculo(p) {
  exigirPerfil(p);
  const blocos = [];
  const add = (tipo, texto) => { if (texto) blocos.push({ tipo, texto: String(texto) }); };
  add('nome', p.pessoa.nome);
  add('titulo', p.objetivo.cargos.join(' | '));
  add('contato', [p.pessoa.cidade, p.pessoa.email, p.pessoa.telefone].filter(Boolean).join(' | '));
  for (const key of ['linkedin', 'portfolio']) add('link', p.pessoa[key]);
  add('secao', 'Resumo profissional'); add('texto', p.resumo);
  const skills = p.competencias.filter(c => c.confirmado).map(c => c.nome);
  if (skills.length) { add('secao', 'Competências'); add('texto', skills.join(' | ')); }
  if (p.experiencias.length) add('secao', 'Experiência profissional');
  for (const exp of p.experiencias) {
    add('subtitulo', `${exp.cargo} | ${exp.empresa}`); add('meta', periodo(exp));
    for (const item of exp.realizacoes) add('item', item);
  }
  if (p.projetos.length) add('secao', 'Projetos');
  for (const projeto of p.projetos) {
    add('subtitulo', projeto.nome); add('texto', projeto.descricao);
    add('texto', projeto.resultado); add('meta', projeto.tecnologias.join(' | ')); add('link', projeto.url);
  }
  if (p.formacao.length) add('secao', 'Formação');
  for (const f of p.formacao) {
    add('subtitulo', `${f.curso}${f.grau ? ` (${f.grau})` : ''} | ${f.instituicao}`);
    add('meta', `${periodo(f)} | ${f.situacao}`);
  }
  if (p.idiomas.length) {
    add('secao', 'Idiomas'); add('texto', p.idiomas.map(i => `${i.idioma}: ${i.nivel}`).join(' | '));
  }
  return blocos;
}

export function curriculoMarkdown(p) {
  return blocosCurriculo(p).map(b => {
    const prefixo = { nome: '# ', secao: '## ', subtitulo: '### ', item: '- ' }[b.tipo] ?? '';
    return prefixo + md(b.texto);
  }).join('\n\n') + '\n';
}

export function curriculoHTML(p) {
  const body = blocosCurriculo(p).map(b => {
    const tag = { nome: 'h1', secao: 'h2', subtitulo: 'h3' }[b.tipo] ?? 'p';
    const texto = b.tipo === 'link' ? `<a href="${html(urlSegura(b.texto).href)}">${html(b.texto)}</a>` : html(b.texto);
    return `<${tag} class="${b.tipo}">${b.tipo === 'item' ? '• ' : ''}${texto}</${tag}>`;
  }).join('\n');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Currículo - ${html(p.pessoa.nome)}</title>
<style>
@page{size:A4;margin:17mm 18mm}*{box-sizing:border-box}body{margin:0;background:#edf1f3;color:#1b2734;font:11pt/1.45 Arial,Helvetica,sans-serif}
main{max-width:800px;margin:28px auto;padding:50px 56px;background:white}h1{font-size:25pt;line-height:1.1;margin:0 0 9px;color:#123742}
h2{font-size:11pt;letter-spacing:.07em;text-transform:uppercase;border-bottom:1px solid #a9c5ca;padding-bottom:5px;margin:23px 0 9px;color:#155361;break-after:avoid}
h3{font-size:11pt;margin:13px 0 3px;break-after:avoid}p{margin:5px 0;overflow-wrap:anywhere}.titulo{font-weight:bold}.contato,.meta,.link{font-size:9.5pt;color:#465864}.item{padding-left:12px;text-indent:-12px}
a{color:inherit;text-decoration:none}nav{max-width:800px;margin:20px auto;text-align:center;font-size:10pt}button{background:#155361;color:white;border:0;padding:12px 20px;border-radius:5px;cursor:pointer}
@media print{body{background:white}main{padding:0;margin:0;max-width:none}nav{display:none}}
</style></head><body><nav>Para PDF: use Imprimir no navegador e escolha Salvar como PDF. Desative cabeçalhos e rodapés.</nav><main>${body}</main></body></html>\n`;
}

export function canonizarURL(value) {
  const u = urlSegura(value);
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) {
    if (/^(utm_|gh_src$|source$|jobBoardSource$|ref_$|trk$)/i.test(key)) u.searchParams.delete(key);
  }
  u.searchParams.sort();
  u.pathname = u.pathname.replace(/\/$/, '') || '/';
  return u.href;
}

export function chaveVaga(v) {
  if (string(v.id_externo)) return `${normalizar(v.empresa)}::${String(v.id_externo).trim()}`;
  return canonizarURL(v.url);
}

export function validarVaga(v) {
  if (!v || !string(v.empresa) || !string(v.cargo)) throw new Error('Vaga precisa de empresa e cargo.');
  canonizarURL(v.url);
  for (const key of ['requisitos', 'desejaveis', 'areas'])
    if (!list(v[key])) throw new Error(`Vaga ${v.cargo}: ${key} deve ser uma lista de textos.`);
  if (!['aberta', 'encerrada', 'desconhecida'].includes(v.status)) throw new Error('status da vaga: aberta, encerrada ou desconhecida.');
  if (v.salario_max != null && !(typeof v.salario_max === 'number' && Number.isFinite(v.salario_max) && v.salario_max > 0))
    throw new Error('salario_max deve ser positivo ou null.');
}

export function avaliarVaga(p, v, { hoje = new Date(), validadeDias = 7 } = {}) {
  exigirPerfil(p); validarVaga(v);
  const termos = new Set(p.competencias.filter(c => c.confirmado).flatMap(c => [c.nome, ...c.aliases]).map(normalizar));
  const atendidos = v.requisitos.filter(r => termos.has(normalizar(r)));
  const lacunas = v.requisitos.filter(r => !termos.has(normalizar(r)));
  const bloqueios = [], revisoes = [];
  if (v.status === 'encerrada') bloqueios.push('Vaga encerrada.');
  if (v.status === 'desconhecida') revisoes.push('Confirmar se a vaga está aberta.');
  const verificada = /^\d{4}-\d{2}-\d{2}$/.test(v.verificada_em ?? '') ? new Date(`${v.verificada_em}T00:00:00Z`) : new Date(NaN);
  const idade = (hoje.getTime() - verificada.getTime()) / 86400000;
  if (!Number.isFinite(idade) || idade < 0 || idade > validadeDias) revisoes.push('Conferir anúncio ao vivo; verificação ausente, futura ou antiga.');
  const modelo = normalizar(v.modelo), contrato = normalizar(v.contrato), nivel = normalizar(v.senioridade);
  if (!modelo) revisoes.push('Modelo de trabalho não informado.');
  else if (p.objetivo.modelos.length && !p.objetivo.modelos.map(normalizar).includes(modelo)) bloqueios.push('Modelo fora das preferências.');
  if (modelo && modelo !== 'remoto') {
    if (!v.localidade || !p.objetivo.localidades_presenciais.length) revisoes.push('Confirmar cidade e disponibilidade presencial.');
    else if (!p.objetivo.localidades_presenciais.map(normalizar).includes(normalizar(v.localidade))) bloqueios.push('Localidade presencial fora das preferências.');
  }
  if (!contrato) revisoes.push('Contrato não informado.');
  else if (p.objetivo.contratos.length && !p.objetivo.contratos.map(normalizar).includes(contrato)) bloqueios.push('Contrato fora das preferências.');
  const nivelOk = p.objetivo.senioridades.map(normalizar).includes(nivel);
  if (!nivel) revisoes.push('Senioridade não informada.');
  else if (p.objetivo.senioridades.length && !nivelOk) revisoes.push('Senioridade diferente da preferência; avaliar exigências reais.');
  const alvo = p.objetivo.pretensao[String(v.contrato ?? '').toUpperCase()];
  if (alvo && v.salario_max != null && v.salario_max < alvo) bloqueios.push('Teto publicado abaixo da pretensão para este contrato.');
  if (lacunas.length) revisoes.push('Requisitos sem experiência confirmada; não afirmar domínio no formulário.');
  if (!v.requisitos.length) revisoes.push('Requisitos não extraídos do anúncio.');
  const focoOk = v.areas.some(a => p.objetivo.foco.map(normalizar).includes(normalizar(a)));
  const nota = Math.round((v.requisitos.length ? atendidos.length / v.requisitos.length * 60 : 0) + (focoOk ? 25 : 0) + (nivelOk ? 15 : 0));
  return { ...v, nota, atendidos, lacunas, bloqueios, revisoes,
    decisao: bloqueios.length ? 'descartar' : revisoes.length ? 'revisar' : 'priorizar' };
}

export function ranquearVagas(p, vagas, options) {
  if (!Array.isArray(vagas)) throw new Error('O arquivo de vagas deve conter uma lista.');
  const vistos = new Set(), unicas = [];
  for (const v of vagas) {
    validarVaga(v); const key = chaveVaga(v), url = canonizarURL(v.url);
    if (vistos.has(key) || vistos.has(url)) continue;
    vistos.add(key); vistos.add(url); unicas.push(avaliarVaga(p, v, options));
  }
  const ordem = { priorizar: 0, revisar: 1, descartar: 2 };
  return unicas.sort((a, b) => ordem[a.decisao] - ordem[b.decisao] || b.nota - a.nota);
}

export function relatorioVagas(vagas) {
  const linhas = ['# Vagas avaliadas', '', 'A nota é uma heurística local (60 pontos requisitos, 25 foco, 15 senioridade). Não é nota de ATS, probabilidade de contratação ou autorização de envio.', '',
    '| Empresa / vaga | Nota | Decisão | Pendências e motivos |', '| --- | --- | --- | --- |'];
  for (const v of vagas) linhas.push(`| ${md(v.empresa)} / ${md(v.cargo)} | ${v.nota}/100 | ${v.decisao} | ${md([...v.bloqueios, ...v.revisoes, v.lacunas.length ? `Sem confirmação: ${v.lacunas.join(', ')}` : ''].filter(Boolean).join(' '))} |`);
  for (const v of vagas) linhas.push('', `## ${md(v.empresa)} — ${md(v.cargo)}`, '', canonizarURL(v.url), '', `Requisitos confirmados: ${md(v.atendidos.join(', ') || 'nenhum')}.`);
  return linhas.join('\n') + '\n';
}

export const STATUS = ['encontrada', 'preparada', 'aguardando_usuario', 'enviada', 'nao_confirmada', 'descartada', 'entrevista', 'encerrada'];
export function prepararRegistro(input, agora = new Date()) {
  if (!input || !string(input.empresa) || !string(input.cargo)) throw new Error('Registro precisa de empresa e cargo.');
  const url = canonizarURL(input.url);
  if (!STATUS.includes(input.status)) throw new Error(`Status permitido: ${STATUS.join(', ')}.`);
  if (input.status === 'enviada' && (!string(input.evidencia) || !string(input.detalhe_confirmacao) || !['confirmacao_explicita', 'indicador_do_portal', 'usuario_confirmou'].includes(input.verificacao)))
    throw new Error('Para enviada, informe evidencia, detalhe_confirmacao e verificacao válida. Sem prova, use nao_confirmada.');
  return { id_externo: input.id_externo ?? '', empresa: input.empresa, cargo: input.cargo, url, status: input.status,
    observacao: input.observacao ?? '', verificacao: input.verificacao ?? '', evidencia: input.evidencia ?? '',
    detalhe_confirmacao: input.detalhe_confirmacao ?? '', atualizado_em: agora.toISOString() };
}

export function aplicarRegistro(registros, input) {
  const novo = prepararRegistro(input);
  if (!Array.isArray(registros)) throw new Error('Base de candidaturas inválida: esperada uma lista.');
  const existentes = registros.filter(r => chaveVaga(r) === chaveVaga(novo) || canonizarURL(r.url) === novo.url);
  const anterior = existentes.at(-1);
  if (existentes.some(r => ['enviada', 'entrevista'].includes(r.status)) && ['encontrada', 'preparada', 'aguardando_usuario', 'enviada', 'nao_confirmada'].includes(novo.status))
    throw new Error('Esta candidatura já foi enviada. Não duplicar nem rebaixar seu status.');
  if (!novo.id_externo && anterior?.id_externo) novo.id_externo = anterior.id_externo;
  return [...registros, novo];
}

export async function registrar(base, input) {
  // Um processo por base. Falhar diante de concorrência preserva o histórico.
  await mkdir(path.dirname(base), { recursive: true });
  const lock = `${base}.lock`;
  await writeFile(lock, String(process.pid), { flag: 'wx' });
  const { unlink } = await import('node:fs/promises');
  try {
    let registros;
    try { registros = JSON.parse(await readFile(base, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') registros = []; else throw error; }
    const atualizados = aplicarRegistro(registros, input);
    const temp = `${base}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(atualizados, null, 2) + '\n', { flag: 'wx' });
    await rename(temp, base);
    return atualizados;
  } finally { await unlink(lock); }
}

export function relatorioCandidaturas(registros) {
  const atuais = new Map();
  for (const r of registros) {
    // Um evento pode descobrir o ID depois do primeiro registro por URL.
    const anterior = [...atuais.entries()].find(([key, value]) => key === chaveVaga(r) || canonizarURL(value.url) === canonizarURL(r.url));
    if (anterior) atuais.delete(anterior[0]);
    atuais.set(chaveVaga(r), r);
  }
  const linhas = ['# Acompanhamento de candidaturas', '', 'Registro local preenchido pelo agente/usuário; o script não consulta o portal nem valida o conteúdo da prova.', '',
    '| Empresa | Vaga | Status | Verificação | Observação |', '| --- | --- | --- | --- | --- |'];
  for (const r of atuais.values()) linhas.push(`| ${md(r.empresa)} | ${md(r.cargo)} | ${md(r.status)} | ${md([r.verificacao, r.detalhe_confirmacao, r.evidencia].filter(Boolean).join(' / '))} | ${md(r.observacao)} |`);
  return linhas.join('\n') + '\n';
}
