---
name: arruma-envia
description: Melhore currículo e LinkedIn, encontre vagas compatíveis e realize candidaturas assistidas com base em fatos confirmados e preferências do candidato. Use neste repositório para o fluxo completo ou uma dessas etapas; não para responder avaliações pessoais em nome da pessoa.
---

# Arruma e Envia

Trabalhe na raiz deste repositório. O perfil individual é `.local/perfil.json`; os exemplos de `exemplos/` são fictícios. Se as ferramentas de navegação não estiverem disponíveis, conclua os arquivos e entregue os links e campos prontos para envio manual, sem afirmar que houve candidatura.

## Começar ou retomar

Leia o perfil e `.local/candidaturas.json`, se existirem. Recupere objetivo e autorizações da conversa atual. Descubra o mínimo que falta: cargos/foco, modalidades/cidades aceitas e restrições. Faça perguntas curtas agrupadas e continue o trabalho independente enquanto aguarda. Peça currículo/LinkedIn quando não houver material; não preencha um perfil fictício como se fosse real.

Use `node scripts/arruma-envia.mjs iniciar` somente se ainda não existir perfil. Registre habilidades como confirmadas apenas após evidência profissional ou confirmação da pessoa. Registre divergências e dúvidas em `pendencias`; não selecione silenciosamente uma formação ou data conflitante. Para a entrevista e redação, consulte [perfil e conteúdo](references/perfil-e-conteudo.md).

## Currículo e LinkedIn

Descreva problema, contribuição, ferramentas e resultado real. Mantenha cargo contratual e objetivo distintos. Preserve o foco principal mesmo quando houver muitas tecnologias complementares. Use palavras do anúncio apenas quando correspondam a experiência verdadeira.

Produza título, Sobre, experiências, projetos e competências para LinkedIn, com versão em inglês se solicitada. Salve em `.local/saidas/linkedin.md`. Se o usuário só pediu sugestões, não publique. Se autorizou alterações, execute pelo navegador e confirme o resultado.

Valide o perfil e gere currículo com `node scripts/arruma-envia.mjs curriculo`. Para PDF, use `scripts/gerar_pdf.py` sobre `curriculo.blocos.json` ou a skill de PDF disponível no ambiente. Inspecione a renderização e a extração do texto. Adapte o conteúdo em uma cópia do perfil para uma vaga, mantendo os fatos. Nunca publique `.local/`.

## Buscar e candidatar

Leia [pesquisa e portais](references/pesquisa-e-portais.md) ao entrar nesta etapa. Comece pelos cargos e foco confirmados, amplie para funções adjacentes quando fizer sentido e explique a relação. Verifique fonte oficial, vaga aberta, requisitos, contrato, salário publicado e rotina presencial. Salve a coleta em `.local/vagas.json`, conforme `exemplos/vagas.ficticias.json`.

O comando `ranquear` organiza vagas coletadas; não busca a internet. Confronte a heurística com o anúncio completo. Não candidate por uma nota isolada. Consulte o histórico para evitar repetição por empresa e identificador da vaga, inclusive quando a URL muda.

Respeite o escopo de envio da pessoa. Se ela pediu só busca, entregue seleção e materiais; se autorizou candidaturas a vagas compatíveis, avance sem pedir permissão genérica a cada envio. Antes de preencher campo que exija confirmação específica pelas regras da ferramenta, prepare os demais campos e pergunte somente o necessário. Não trate termos de uma empresa como aceitos em outra.

Preencha respostas profissionais somente com fatos conhecidos. Não infira parentesco, deficiência, documentos, salário atual, disponibilidade, idiomas ou anos de experiência. Use opção de não informar quando adequada e oferecida pelo portal; se houver texto livre, pode registrar informação não fornecida sem inventar uma negativa. Avaliações de personalidade/cultura e provas de conhecimento devem ser respondidas pela pessoa; você pode explicar a pergunta.

Não salve senha, sessão ou OTP no repositório. Login e CAPTCHA devem seguir as regras da ferramenta. Use um navegador conectado disponível; não prometa controle remoto em ambientes sem essa capacidade. Nunca contorne bloqueios do portal ou permissões de upload.

## Finalizar a rodada

Após submeter, aguarde o resultado visível. Salve prova em `.local/comprovantes/`. Se só retornou à descrição sem confirmação, registre `nao_confirmada`; um indicador específico de candidatura enviada pode ser registrado como `indicador_do_portal`, descrevendo-o literalmente.

Registre eventos com `registrar`, usando o modelo `exemplos/registro.modelo.json`. O script exige campos de evidência, mas não inspeciona a imagem nem consulta o portal: essa verificação é sua. Não reenvie uma vaga já enviada.

Pare ao atingir a quantidade autorizada, esgotar opções compatíveis dentro da rodada ou encontrar bloqueio que exija a pessoa. Resuma empresas, cargos, resultado, pendências e comprovantes. Separe currículo carregado, formulário preparado, envio não confirmado e candidatura enviada. Não prometa atividade em segundo plano.
