# Pesquisa e portais

## Selecionar oportunidades

Use fontes atuais e priorize página de carreiras oficial ou anúncio associado à empresa. Resultados de busca e agregadores ajudam a descobrir; confirme a vaga no destino. Datas, disponibilidade e condições podem mudar entre a pesquisa e o envio.

Extraia requisitos obrigatórios e desejáveis separadamente. Traduza para o modelo de vagas somente após ler o anúncio; o CLI compara termos/aliases completos, não interpreta prosa nem infere competências. O campo `areas` expressa a atividade principal, não uma lista de todas as tecnologias mencionadas.

Priorize atividade e nível de experiência, depois ferramentas e condições. Não troque uma carreira de automação/dashboards por pesquisa de modelos só porque ambas usam IA. Uma vaga adjacente pode fazer sentido; explique a ponte de experiência.

Verifique modalidade no corpo do anúncio. Um cabeçalho "remoto" pode divergir de uma exigência presencial. Da mesma forma, "Efetivo" no anúncio pode divergir de uma pergunta sobre contratação PJ. Registre contradições e confirme condições relevantes antes de assumir.

O ranking considera: requisitos confirmados (até 60), área de foco (25), senioridade preferida (15). Modalidade, cidade presencial, contrato e teto salarial incompatíveis levam a descarte. Dados desconhecidos ou antigos exigem revisão. Desejáveis ficam no arquivo para avaliação humana, sem pontuação adicional. Um resultado "priorizar" exige conferência ao vivo, revisão dos requisitos não representados no modelo e autorização de candidatura.

No histórico, use a identificação externa da vaga e empresa sempre que estiver disponível. Remova só parâmetros de rastreamento ao comparar URLs; mantenha identificadores, como `jobId` e `gh_jid`. Não confunda cadastro anterior com novo envio.

## Operar formulários

Use apenas ferramentas suportadas no ambiente e inspecione o estado atual depois das ações. Estes padrões foram observados no fluxo que originou o projeto; não são integrações fixas nem promessa de compatibilidade com versões futuras:

| Portal | O que observar |
| --- | --- |
| Gupy | Dados importados podem estar antigos. Perguntas da empresa podem ser imutáveis depois de salvas. Personalize a apresentação quando disponível. Aguarde “Candidatura finalizada!” ou sinal equivalente. |
| Greenhouse | Anexe currículo, confira idiomas e consentimentos. Pode exigir código de e-mail. Não reutilize códigos de outra sessão. Confirme a página de recebimento. |
| Ashby / InHire | Confira arquivo anexado e perguntas adicionais. Upload concluído não significa candidatura enviada. |
| LinkedIn | Distinga candidatura simplificada de redirecionamento. Rascunho não é envio; confira contato e currículo selecionado. |
| Formulário próprio | Pode exigir CEP mesmo sem asterisco, formato local de telefone, termos ou conta opcional. Resolva a validação visível; não invente dados nem crie conta se houver opção de continuar sem conta. |

Se o upload exigir acesso a arquivos na extensão, explique a necessidade e deixe a pessoa conceder a permissão. Use um arquivo local de currículo aprovado; não envie todo o diretório ou perfil JSON. Não implemente scraping de sessões, endpoints privados ou contorno de proteções como alternativa a uma ferramenta indisponível.

Antes de enviar dados novos sensíveis, explique destino, dado e finalidade quando a política da ferramenta exigir confirmação. Reaproveite autorizações válidas da sessão; não amplie a autorização de uma empresa para outra. Senha nova fica com a pessoa. Não use automação paga sem informar custo e obter autorização.

Quando houver pergunta obrigatória desconhecida, continue os campos independentes e agrupe o que falta. Retome a mesma candidatura após a resposta; não reinicie nem perca dados já preenchidos. Em personalidade/fit cultural, não fabrique preferências para parecer um candidato ideal; explique e deixe a pessoa responder.

## Evidência e relato

Uma mensagem de sucesso é prova mais clara. Se o portal só mostrar um badge como "Candidatura enviada" ou equivalente, registre seu texto e classifique `indicador_do_portal`. Retorno à descrição, timeout, botão clicado e ausência de erro não são, sozinhos, prova de recebimento.

Salve uma captura com contexto suficiente em `.local/comprovantes/` e registre a conclusão literalmente. Evite incluir documentos, salários ou respostas pessoais na captura exibida. Se a ferramenta exigir imagem no relato, mostre a captura correspondente. Sem resultado verificável, use `nao_confirmada` e não reenvie imediatamente, pois pode duplicar a inscrição.
