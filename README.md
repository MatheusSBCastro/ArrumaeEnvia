# Arruma e Envia

[![Verificar projeto](https://github.com/MatheusSBCastro/ArrumaeEnvia/actions/workflows/ci.yml/badge.svg)](https://github.com/MatheusSBCastro/ArrumaeEnvia/actions/workflows/ci.yml)

Use um agente de IA para revisar seu currículo e LinkedIn, pesquisar vagas compatíveis e preencher candidaturas no navegador. As ferramentas locais ajudam a organizar as oportunidades e acompanhar o que foi enviado. Os materiais estão em português.

O projeto nasceu de um fluxo real: partir de uma descrição informal de experiência, preparar o currículo, selecionar vagas e acompanhar as candidaturas. Você pode repetir esse processo com os prompts e scripts do repositório. Todos os perfis e anúncios usados na demonstração são fictícios.

## Comece pelo caminho mais simples

1. Clone este repositório e abra a pasta no Codex:

   ```sh
   git clone https://github.com/MatheusSBCastro/ArrumaeEnvia.git
   cd ArrumaeEnvia
   ```

2. Cole o [prompt inicial](prompts/comece-aqui.md) no chat. Envie seu currículo ou descreva sua experiência, o cargo que procura e suas preferências de trabalho. Não precisa saber escrever um currículo técnico.

3. Revise o perfil e os textos gerados. Depois, use o [prompt de candidaturas](prompts/candidatar.md) para autorizar uma rodada com quantidade e condições definidas.

A skill está em [`.agents/skills/arruma-envia/SKILL.md`](.agents/skills/arruma-envia/SKILL.md). No Codex, use `$arruma-envia`. Se ela não aparecer, peça ao agente para ler esse arquivo diretamente; confira também as [instruções oficiais de skills](https://learn.chatgpt.com/docs/build-skills). A localização `.agents/skills` é reconhecida no escopo do repositório. Mantenha a pasta do projeto inteira, pois as ferramentas locais ficam em `scripts/`.

Para navegar e enviar candidaturas, o agente precisa das ferramentas e permissões da sua instalação. Conecte o navegador pela opção do seu ambiente e faça login diretamente no portal. Se o agente não puder controlar o navegador, ele ainda pode preparar documentos, selecionar links e escrever os textos para você enviar. O repositório não instala extensão nem um robô universal; o acesso varia conforme o site.

## O que está pronto

| Etapa | Entrega |
| --- | --- |
| Entender seu perfil | Entrevista curta, foco profissional, experiência e competências confirmadas, dúvidas registradas |
| Melhorar currículo | Conteúdo objetivo, experiências e projetos; exportação em Markdown, HTML e PDF de texto selecionável |
| Melhorar LinkedIn | Proposta de título, Sobre, experiências, projetos e competências; inglês quando solicitado |
| Encontrar vagas | Pesquisa pelo agente, verificação no anúncio e seleção por atividade, nível e condições |
| Organizar vagas | Ranking local com critérios visíveis, lacunas e incompatibilidades |
| Candidatar | Preenchimento assistido pelo agente no navegador, dentro da autorização da pessoa |
| Acompanhar | Histórico local, prevenção de repetição e evidência para registrar envio |

O foco pode ser IA aplicada, automação e dashboards, como nos exemplos, ou outra profissão. O agente deve adaptar o conteúdo à sua trajetória. Não é necessário ter o mesmo perfil de quem criou o projeto.

## Exemplo de conversa

> “Hoje faço dashboards em HTML e Node.js e uso IA para me ajudar a desenvolver. Também automatizo a atualização das bases. Quero vagas de automação júnior, remotas ou híbridas na minha cidade.”

O agente deve transformar isso em uma descrição profissional fiel, confirmar detalhes relevantes, mostrar materiais revisáveis e buscar oportunidades correspondentes. Usar várias ferramentas não transforma automaticamente alguém em especialista em todas elas.

> “Pode enviar até cinco candidaturas compatíveis com esse perfil, nas condições que confirmei.”

Com navegação disponível e autorização suficiente, o agente pode preencher e enviar. Perguntas desconhecidas e confirmações específicas exigidas pelo ambiente continuam com a pessoa. Um clique em “Enviar” não basta para contar uma candidatura como recebida.

## Ferramentas locais

Requerem **Node.js 20 ou superior**. Não há dependências JavaScript para instalar nem chave de API para esses comandos. Eles trabalham com arquivos locais e não acessam portais de vagas.

```sh
# Ver uma demonstração sem cadastrar nem enviar nada
npm run demo

# Criar seu perfil em .local/perfil.json; não sobrescreve se já existir
npm run iniciar

# Depois de preencher o perfil com fatos reais
npm run validar
npm run curriculo
```

Abra `.local/demo/curriculo.html` para ver a demonstração. Para seu perfil, abra `.local/saidas/curriculo.html`. Você pode imprimir pelo navegador escolhendo **Salvar como PDF**, papel A4 e sem cabeçalhos/rodapés. Revise o resultado antes de enviar.

O comando `iniciar` cria um modelo intencionalmente incompleto; `validar` vai apontar o que falta. O exemplo preenchido está em [`exemplos/perfil.ficticio.json`](exemplos/perfil.ficticio.json). O agente pode preencher seu perfil durante a conversa. O validador verifica estrutura e formatos, não prova que uma afirmação é verdadeira.

### Gerar PDF diretamente

Requer **Python 3.10+** e ReportLab. Opcional: use um ambiente virtual conforme seu sistema. Os comandos abaixo usam `python`; em algumas instalações o nome é `python3` ou `py`.

```sh
python -m pip install -r requirements-pdf.txt
npm run curriculo
python scripts/gerar_pdf.py .local/saidas/curriculo.blocos.json --saida .local/saidas/curriculo.pdf
```

Para testar com dados fictícios:

```sh
npm run demo
python scripts/gerar_pdf.py .local/demo/curriculo.blocos.json --saida .local/demo/curriculo.pdf
```

O gerador usa fontes locais quando disponíveis. Você pode informar um par de fontes TTF com `--fonte caminho/regular.ttf --fonte-negrito caminho/negrito.ttf`. Ele permite várias páginas; não reduz o texto indefinidamente para caber em uma. Inspecione a aparência e a extração do texto. Um layout legível facilita a leitura, mas não garante aprovação por ATS ou recrutadores.

### Avaliar vagas coletadas

Peça ao agente para pesquisar e salvar `.local/vagas.json` seguindo [`exemplos/vagas.ficticias.json`](exemplos/vagas.ficticias.json). Depois:

```sh
node scripts/arruma-envia.mjs ranquear .local/perfil.json .local/vagas.json
```

Saídas: `.local/saidas/vagas-avaliadas.md` e `.json`. A nota é uma **heurística transparente**, não pontuação de ATS nem previsão de contratação: até 60 pontos de requisitos confirmados, 25 de foco e 15 de senioridade. Condições incompatíveis podem descartar uma vaga mesmo com boa nota técnica. Informação ausente, requisitos sem confirmação e verificação antiga exigem revisão. O agente precisa ler o anúncio completo antes de decidir.

Correspondência de competências usa nomes e aliases equivalentes. O script não interpreta descrições em linguagem natural. A coleta deve separar requisitos obrigatórios, desejáveis e áreas de atividade. Anúncios e datas do exemplo são fictícios, e ficarão antigos com o tempo; isso deve provocar revisão.

### Registrar e acompanhar

Copie [`exemplos/registro.modelo.json`](exemplos/registro.modelo.json) para `.local/registro.json` e preencha o evento. Status possíveis: `encontrada`, `preparada`, `aguardando_usuario`, `enviada`, `nao_confirmada`, `descartada`, `entrevista`, `encerrada`.

Para `enviada`, informe:

- `verificacao`: `confirmacao_explicita`, `indicador_do_portal` ou `usuario_confirmou`;
- `evidencia`: caminho de comprovante ou referência verificável;
- `detalhe_confirmacao`: o que foi realmente observado.

```sh
node scripts/arruma-envia.mjs registrar .local/registro.json
npm run status
```

O histórico guarda eventos em `.local/candidaturas.json` e gera `.local/saidas/candidaturas.md`. Não registra uma nova inscrição para a mesma vaga já enviada. Use empresa e `id_externo` consistentes; quando não houver ID, a comparação usa a URL sem parâmetros comuns de rastreamento, preservando os identificadores de vaga.

O script exige evidência preenchida, mas **não autentica imagens nem consulta o portal**. A verificação deve ser feita pelo agente ou usuário. Retorno à descrição sem sinal claro de recebimento deve ficar como `nao_confirmada`.

Execute somente um processo de registro por base. Em caso de interrupção, um arquivo `.lock` pode permanecer; confira que nenhum processo está usando a base antes de removê-lo e retomar.

## Seus dados ficam fora do Git

Perfil, currículos, salários, respostas, capturas e histórico ficam em `.local/`, ignorada pelo Git. Há proteção adicional para documentos e arquivos comuns de sessão. Exemplos públicos usam personagens e empresas fictícias. `.gitignore` não criptografa arquivos nem remove dados já versionados: revise o que vai publicar.

Não salve senhas, OTPs, cookies, documentos pessoais ou sessões de navegador no projeto. Faça login diretamente no portal. Identificadores, remuneração atual e informações pessoais exigidas por uma empresa devem ser tratados na hora e conforme as regras da ferramenta, sem copiar consentimentos de uma empresa para outra.

A conversa e as ferramentas de IA têm suas próprias condições de processamento. Os scripts locais não enviam dados a serviços externos. O projeto não cobra pelo uso; o acesso ao agente e a ferramentas de terceiros pode depender do plano de cada pessoa. Não é necessário usar automação paga de navegador para seguir o método.

## Limites importantes do fluxo

- Não inventar experiência, métricas, idiomas, diplomas ou respostas pessoais para melhorar a candidatura.
- Não responder avaliações de personalidade ou provas como se fosse a pessoa; o agente pode ajudar a entender as perguntas.
- Não considerar currículo anexado ou formulário preparado como inscrição enviada.
- Não prometer entrevista, emprego, nota de ATS ou funcionamento em todos os portais.
- Não contornar bloqueios, logins, CAPTCHA ou permissões de upload.

Gupy, Greenhouse, LinkedIn, Ashby, InHire e formulários próprios fizeram parte do fluxo que inspirou o projeto. Há [orientações de operação](.agents/skills/arruma-envia/references/pesquisa-e-portais.md), mas não conectores de API específicos para esses portais. Telas e exigências mudam.

## Estrutura

```text
.agents/skills/arruma-envia/   Skill e orientações para o agente
prompts/                     Começar, autorizar rodada e retomar
exemplos/                    Modelos e demonstrações fictícias
scripts/                     CLI local e gerador PDF
tests/                       Verificação de comportamento e PDF
.local/                      Seu perfil, documentos e histórico (ignorado)
AGENTS.md                    Instruções do projeto
```

## Desenvolvimento

```sh
npm test
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -p "test_*.py"
```

Os testes cobrem preservação de arquivos, competências não confirmadas, escape de conteúdo, critérios de seleção, deduplicação, histórico, exigência de evidência e texto extraível do PDF. A CI executa esses testes no GitHub. Eles não enviam candidaturas reais. Para contribuir, veja [`CONTRIBUTING.md`](CONTRIBUTING.md).

Licença [MIT](LICENSE). Projeto independente, sem afiliação com plataformas de recrutamento ou fornecedores de IA.
