#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerJSON, gravar, exigirPerfil, curriculoHTML, curriculoMarkdown, blocosCurriculo,
  ranquearVagas, relatorioVagas, registrar, relatorioCandidaturas } from './lib.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [comando = 'ajuda', ...args] = process.argv.slice(2);
function opcoes(entrada) {
  const pos = [], opts = {};
  for (let i = 0; i < entrada.length; i++) {
    if (entrada[i].startsWith('--')) {
      const key = entrada[i].slice(2);
      if (!['saida', 'base'].includes(key) || !entrada[i + 1] || entrada[i + 1].startsWith('--')) throw new Error(`Opção inválida ou sem valor: --${key}`);
      opts[key] = entrada[++i];
    } else pos.push(entrada[i]);
  }
  return { pos, opts };
}

async function exportar(p, pasta) {
  await gravar(path.join(pasta, 'curriculo.html'), curriculoHTML(p));
  await gravar(path.join(pasta, 'curriculo.md'), curriculoMarkdown(p));
  await gravar(path.join(pasta, 'curriculo.blocos.json'), JSON.stringify(blocosCurriculo(p), null, 2) + '\n');
  console.log(`Currículo HTML/Markdown e blocos para PDF: ${path.resolve(pasta)}`);
}

async function main() {
  const { pos, opts } = opcoes(args);
  const perfil = pos[0] ?? '.local/perfil.json';
  const saida = opts.saida ?? '.local/saidas';
  switch (comando) {
    case 'iniciar': {
      const modelo = await lerJSON(path.join(raiz, 'exemplos/perfil.modelo.json'));
      await gravar(perfil, JSON.stringify(modelo, null, 2) + '\n', { exclusivo: true });
      console.log(`Perfil criado: ${path.resolve(perfil)}. Complete com fatos reais antes de validar.`);
      break;
    }
    case 'validar': {
      exigirPerfil(await lerJSON(perfil));
      console.log('Estrutura válida. A veracidade dos fatos ainda deve ser confirmada pela pessoa candidata.');
      break;
    }
    case 'curriculo': await exportar(await lerJSON(perfil), saida); break;
    case 'ranquear': {
      const p = exigirPerfil(await lerJSON(perfil));
      const vagas = await lerJSON(pos[1] ?? '.local/vagas.json');
      const ranking = ranquearVagas(p, vagas);
      await gravar(path.join(saida, 'vagas-avaliadas.json'), JSON.stringify(ranking, null, 2) + '\n');
      await gravar(path.join(saida, 'vagas-avaliadas.md'), relatorioVagas(ranking));
      console.log(`${ranking.length} vagas avaliadas. Isso não envia candidaturas. Relatórios: ${path.resolve(saida)}`);
      break;
    }
    case 'registrar': {
      if (!pos[0]) throw new Error('Uso: registrar arquivo-registro.json [--base .local/candidaturas.json]');
      const base = opts.base ?? '.local/candidaturas.json';
      const registros = await registrar(base, await lerJSON(pos[0]));
      await gravar(path.join(saida, 'candidaturas.md'), relatorioCandidaturas(registros));
      console.log('Evento registrado. A evidência deve ter sido verificada no portal pelo agente/usuário.');
      break;
    }
    case 'status': {
      const registros = await lerJSON(opts.base ?? '.local/candidaturas.json');
      const relatorio = relatorioCandidaturas(registros);
      await gravar(path.join(saida, 'candidaturas.md'), relatorio);
      console.log(relatorio);
      break;
    }
    case 'demo': {
      const pasta = opts.saida ?? '.local/demo';
      const p = exigirPerfil(await lerJSON(path.join(raiz, 'exemplos/perfil.ficticio.json')));
      await exportar(p, pasta);
      const vagas = ranquearVagas(p, await lerJSON(path.join(raiz, 'exemplos/vagas.ficticias.json')));
      await gravar(path.join(pasta, 'vagas-avaliadas.md'), relatorioVagas(vagas));
      console.log('Demonstração com dados fictícios. Nenhum site foi acessado e nenhuma candidatura foi enviada.');
      break;
    }
    case 'ajuda': case '--help': case '-h':
      console.log(`Arruma e Envia - ferramentas locais (Node.js 20+)\n
iniciar [perfil.json]                     Cria modelo sem sobrescrever arquivo existente
validar [perfil.json]                     Valida estrutura, não a veracidade dos fatos
curriculo [perfil.json] [--saida pasta]    Gera HTML, Markdown e blocos de PDF
ranquear [perfil.json] [vagas.json]        Avalia vagas já coletadas; não pesquisa a internet
registrar registro.json [--base arquivo]  Registra evento, exige prova para status enviada
status [--base arquivo]                  Exporta acompanhamento em Markdown
demo [--saida pasta]                     Gera demonstração fictícia, sem efeitos externos

Perfil padrão: .local/perfil.json | Base: .local/candidaturas.json
Saída padrão: .local/saidas | PDF: consulte scripts/gerar_pdf.py --help`);
      break;
    default: throw new Error(`Comando desconhecido: ${comando}. Use ajuda.`);
  }
}
main().catch(error => { console.error(`Erro: ${error.message}`); process.exitCode = 1; });
