import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lerJSON, validarPerfil, curriculoHTML, curriculoMarkdown, avaliarVaga, ranquearVagas,
  canonizarURL, aplicarRegistro, registrar, relatorioCandidaturas } from '../scripts/lib.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const perfil = await lerJSON(path.join(raiz, 'exemplos/perfil.ficticio.json'));
const vagas = await lerJSON(path.join(raiz, 'exemplos/vagas.ficticias.json'));
const hoje = new Date('2026-11-03T12:00:00Z');
const clone = (x) => structuredClone(x);
const registro = { empresa: 'Exemplo', cargo: 'Automação Jr', id_externo: 'vaga-1', url: 'https://example.com/jobs/1', status: 'preparada' };
const envio = { ...registro, status: 'enviada', verificacao: 'confirmacao_explicita', evidencia: '.local/comprovantes/exemplo.png', detalhe_confirmacao: 'Página informou recebimento da candidatura.' };

async function limparTemporario(pasta) {
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(pasta).startsWith('arruma-envia-'));
  await rm(pasta, { recursive: true, force: true });
}

test('perfil incompleto não passa como pronto; modelo fictício válido', () => {
  assert.deepEqual(validarPerfil(perfil), []);
  assert.ok(validarPerfil({}).length > 0);
  const p = clone(perfil); p.experiencias[0].fim = '2024-01';
  assert.ok(validarPerfil(p).some(e => e.includes('fim anterior')));
});

test('não inclui competência sem confirmação ou salário no currículo', () => {
  const texto = curriculoMarkdown(perfil);
  assert.ok(texto.includes('Node.js'));
  assert.ok(!texto.includes('Kubernetes'));
  assert.ok(!texto.includes('6000'));
  assert.ok(!texto.includes('evidencia'));
});

test('HTML escapa conteúdo inserido pela pessoa e rejeita links executáveis', () => {
  const p = clone(perfil); p.pessoa.nome = '<script>alert(1)</script>';
  assert.ok(!curriculoHTML(p).includes('<script>'));
  assert.ok(curriculoHTML(p).includes('&lt;script&gt;'));
  p.pessoa.portfolio = 'javascript:alert(1)';
  assert.throws(() => curriculoHTML(p), /URL HTTPS/);
});

test('ranking prioriza foco, competências confirmadas e condições compatíveis', () => {
  const resultado = ranquearVagas(perfil, vagas, { hoje });
  assert.equal(resultado[0].id_externo, 'demo-automacao-001');
  assert.equal(resultado[0].decisao, 'priorizar');
  assert.equal(resultado[0].nota, 100);
  assert.ok(resultado.find(v => v.status === 'encerrada').bloqueios.includes('Vaga encerrada.'));
  assert.ok(resultado.find(v => v.id_externo === 'demo-senior-002').lacunas.includes('Kubernetes'));
});

test('lacunas técnicas e dados desconhecidos exigem revisão mesmo com foco bom', () => {
  const v = clone(vagas[0]); v.requisitos.push('Kubernetes'); v.modelo = ''; v.verificada_em = '';
  const r = avaliarVaga(perfil, v, { hoje });
  assert.equal(r.decisao, 'revisar'); assert.ok(r.revisoes.length >= 3);
  assert.equal(r.nota, 85);
});

test('salário compara CLT e PJ separadamente; anúncio antigo exige revisão', () => {
  const v = { ...vagas[0], contrato: 'PJ', salario_max: 9000 };
  assert.ok(avaliarVaga(perfil, v, { hoje }).bloqueios.some(b => b.includes('Teto')));
  v.contrato = 'CLT';
  assert.equal(avaliarVaga(perfil, v, { hoje }).decisao, 'priorizar');
  v.verificada_em = '2025-01-01';
  assert.equal(avaliarVaga(perfil, v, { hoje }).decisao, 'revisar');
});

test('duplicidade remove rastreamento sem perder identificador de vaga', () => {
  assert.equal(canonizarURL('https://example.com/jobs?jobId=1&utm_source=li#apply'), 'https://example.com/jobs?jobId=1');
  assert.notEqual(canonizarURL('https://example.com/jobs?jobId=1'), canonizarURL('https://example.com/jobs?jobId=2'));
  const repetida = { ...vagas[0], url: vagas[0].url + '?utm_source=linkedin' };
  assert.equal(ranquearVagas(perfil, [vagas[0], repetida], { hoje }).length, 1);
});

test('enviada exige prova e modalidade de verificação', () => {
  assert.throws(() => aplicarRegistro([], { ...registro, status: 'enviada' }), /evidencia/);
  assert.throws(() => aplicarRegistro([], { ...envio, verificacao: 'cliquei no botão' }), /verificacao/);
  assert.equal(aplicarRegistro([], envio)[0].status, 'enviada');
});

test('histórico impede reenvio e preserva eventos de avanço', () => {
  let historico = aplicarRegistro([], registro);
  historico = aplicarRegistro(historico, envio);
  assert.throws(() => aplicarRegistro(historico, { ...envio, url: envio.url + '?utm_source=google' }), /já foi enviada/);
  historico = aplicarRegistro(historico, { ...registro, status: 'entrevista' });
  assert.equal(historico.length, 3);
  assert.ok(relatorioCandidaturas(historico).includes('entrevista'));
});

test('encerramento posterior não autoriza reenvio da mesma inscrição', () => {
  let historico = aplicarRegistro([], envio);
  historico = aplicarRegistro(historico, { ...registro, status: 'encerrada' });
  assert.throws(() => aplicarRegistro(historico, registro), /já foi enviada/);
});

test('ID descoberto depois não duplica o relatório e é preservado nas atualizações', () => {
  let historico = aplicarRegistro([], { ...registro, id_externo: '' });
  historico = aplicarRegistro(historico, envio);
  historico = aplicarRegistro(historico, { ...registro, id_externo: '', status: 'entrevista' });
  assert.equal(historico.at(-1).id_externo, registro.id_externo);
  const linhas = relatorioCandidaturas(historico).split('\n').filter(l => l.startsWith('| Exemplo |'));
  assert.equal(linhas.length, 1);
  assert.ok(linhas[0].includes('entrevista'));
});

test('CLI cria perfil sem sobrescrever e demo não usa rede', async () => {
  const pasta = await mkdtemp(path.join(os.tmpdir(), 'arruma-envia-'));
  try {
    const cli = path.join(raiz, 'scripts/arruma-envia.mjs'), arquivo = path.join(pasta, 'perfil.json');
    const primeiro = spawnSync(process.execPath, [cli, 'iniciar', arquivo], { encoding: 'utf8' });
    assert.equal(primeiro.status, 0, primeiro.stderr);
    await writeFile(arquivo, 'NÃO SOBRESCREVER', 'utf8');
    const segundo = spawnSync(process.execPath, [cli, 'iniciar', arquivo], { encoding: 'utf8' });
    assert.equal(segundo.status, 1);
    assert.equal(await readFile(arquivo, 'utf8'), 'NÃO SOBRESCREVER');
    const demo = spawnSync(process.execPath, [cli, 'demo', '--saida', path.join(pasta, 'demo')], { encoding: 'utf8' });
    assert.equal(demo.status, 0, demo.stderr);
    assert.ok((await readFile(path.join(pasta, 'demo/curriculo.html'), 'utf8')).includes('Joana Ribeiro'));
  } finally { await limparTemporario(pasta); }
});

test('registro em disco preserva histórico e impede escrita concorrente', async () => {
  const pasta = await mkdtemp(path.join(os.tmpdir(), 'arruma-envia-'));
  try {
    const base = path.join(pasta, 'candidaturas.json');
    await registrar(base, registro); await registrar(base, envio);
    assert.equal((await lerJSON(base)).length, 2);
    await writeFile(base + '.lock', 'outro-processo');
    await assert.rejects(() => registrar(base, { ...registro, status: 'entrevista' }), /EEXIST/);
    assert.equal((await lerJSON(base)).length, 2);
  } finally { await limparTemporario(pasta); }
});
