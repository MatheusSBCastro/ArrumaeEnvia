# Arruma e Envia

Este repositório permite a uma pessoa repetir um fluxo de melhoria de currículo e LinkedIn, pesquisa de vagas compatíveis e candidatura assistida por IA. A implementação local cuida de arquivos e acompanhamento; ações em sites dependem das ferramentas do agente e da sessão da pessoa candidata.

## Trabalhando em candidaturas

- Use `.agents/skills/arruma-envia/SKILL.md`. O perfil individual fica em `.local/perfil.json`; não presuma que o exemplo fictício descreve o usuário.
- Priorize o foco profissional confirmado pela pessoa, não somente palavras-chave técnicas. Diferencie especialidade, experiência complementar e interesse de aprendizado.
- Guarde perfis, currículos, respostas, capturas e históricos em `.local/`, ignorada pelo Git. Não copie credenciais, documentos pessoais ou dados de uma pessoa para exemplos públicos.
- Aplique o escopo autorizado na conversa: quantidade, cargos, modalidades, localidades e contratos. Uma autorização desta instalação não serve para outras pessoas.
- Pesquise anúncios atuais e verifique cada vaga no portal antes de candidatar. A nota do CLI é uma heurística; não é nota de ATS e não autoriza envio.
- Não invente formação, datas, métricas, idiomas, experiência, senioridade ou respostas a testes. Uma ferramenta de programação com IA não prova experiência independente com todos os recursos que gerou.
- Prepare tudo o que puder antes de pedir informação faltante. Não repita perguntas já respondidas. Para consentimentos, documentos, remuneração atual, CAPTCHAs e acessos, siga a política das ferramentas e obtenha a confirmação específica que ela exigir.
- Pare antes de criar senha; a pessoa deve concluir essa etapa. Não inicie automação paga sem autorização de custo.
- Só registre `enviada` depois de verificar o resultado no site ou receber confirmação direta da pessoa. Diferencie mensagem explícita de sucesso, indicador do portal e tentativa não confirmada.

## Desenvolvendo o projeto

Node.js 20+, sem dependências JavaScript. PDF opcional com Python 3.10+ e ReportLab. Teste alterações com `npm test`; para o gerador PDF, execute `python -m unittest discover -s tests -p "test_*.py"` com as dependências de desenvolvimento. A CI repete esses comandos. Preserve exemplos fictícios e o funcionamento em Windows, macOS e Linux. Não adicione APIs pagas, coleta de sessões ou envio em massa fora do escopo solicitado.
