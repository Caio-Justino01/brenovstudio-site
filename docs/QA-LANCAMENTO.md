# Revisão de entrega, 19/10/2026

## Revisão móvel posterior ao primeiro envio

Relato em iPhone 12 e 15 Pro, Safari e Chrome. Ajustados toque da logo, replay da entrada, fixação das pastas e olhos em altura útil reduzida e respiro entre seções. Conferência no build compilado, sem depender de HMR. Não houve aparelho físico ou Safari neste ambiente.

- 125 testes aprovados, TypeScript, build e check:release; 139 imports locais verificados. Dependências e lockfile preservados. Log output/qa-mobile-animation-final.log.
- Navegador em 390 × 664 e 393 × 658: índice e História permanecem fixos; controles da prévia com pelo menos 48 px. Expansão/recolhimento do painel conserva foco e leitura.
- 320 × 800, 390 × 844, 768 × 1024, 1024 × 768 e 1440 × 900 sem transbordamento ou imagens quebradas. Paisagem 844 × 390 conserva fluxo natural.
- Em aproximadamente 107 px, a primeira pasta e o convite dos olhos permanecem. Avanço maior abre olhos/informações; retorno fecha, sem deslocar o palco de 92 px. As fotos da janela compacta usam svh, sem gatilho por altura variável da barra.
- Recarga em #inicio após End, com posição antiga de 6229,3 px: dois testes compilados voltaram a zero e completaram a formação. Bootstrap antes do React sincroniza a restauração do navegador e do GSAP. Sem resets em loop. Back/Forward não realinha as âncoras iniciais dos filhos.
- Selecionar Captação na prévia reflete no formulário; Continuar orçamento foca Seu nome. Dissolução conclui no índice com foco e margem corretos. A saída iniciada com formação tardia mantém Promise e overlay até o fim.
- Revisão independente encontrou os conflitos de restauração e handoff antes do fechamento; ambos corrigidos e novamente revisados. Console consultado da origem compilada sem erros/avisos.

Evidências na pasta de visualizações: mobile-build-hero-inicio.png, mobile-build-historia-olhos.png, mobile-pastas-orcamento.png e mobile-animation-matriz.json. Toque e cancelamento possuem testes de política, sem simulação física de Safari. Gesto vertical pode passar a rolagem nativa via pointercancel, encerrando o líquido; traço local/horizontal permanece interativo. Validar em aparelho real continua necessário para confirmar performance e gestos iOS. Movimento reduzido e falha gráfica continuam com alternativa estática.

## Versão de apresentação

Plano de envio aprovado pelo usuário: preparar, corrigir, testar, criar commit e atualizar https://github.com/Caio-Justino01/brenovstudio-site.git. A consulta remota confirmou repositório público não arquivado, sem refs, com branch padrão main. O envio deve ser confirmado pelo SHA remoto e pelo GitHub Actions. A conexão e o deployment Vercel ficam com o usuário; nenhum deployment é presumido de um push ou build.

Preservados visual e animações aprovados, fotos, fontes locais, textos, brilho discreto dos olhos e card Sobre o trabalho integrado à biografia. WhatsApp continua desativado. As mídias temporárias mantêm crédito e origem no cadastro tipado.

## Correções finais

- ResizeObservers de pasta, janela, navbar, logo e fundo agendam escritas num RAF coalescido/cancelável, evitando mutação durante a entrega do observer. Medidas iguais não reescrevem escala/offset.
- SceneLoader mantém liberação da interface em três segundos; o prazo GPU conta dez segundos de aba visível. Preparo cooperativo pausa entre lotes em aba oculta, preservando cancelamento e passos da física.
- Nenhum erro foi filtrado globalmente. Logs antigos de múltiplas abas não permitem atribuir cada ocorrência a uma única origem.
- Watcher de desenvolvimento ignora output e .release-check, evitando observar artefatos e arquivos bloqueados da auditoria.
- Mantidas as correções anteriores de foco, histórico, sincronização ScrollTrigger, seleção compartilhada e invalidação da cópia assíncrona do briefing.

## Verificação técnica

Node 24.19.0 e npm 11.10.1. Instalação limpa isolada, com cache novo, executou npm ci e instalou 55 pacotes. Dependências principais e lockfile preservados. Os 113 arquivos essenciais finais coincidiram por hash com a cópia de auditoria.

npm run verify aprovado na raiz e na cópia limpa:

- 106 testes, zero falhas.
- TypeScript e build Vite aprovados.
- 13 mídias, 132 imports relativos, quatro referências HTML e nove recursos CSS/fontes conferidos, com caixa exata para Linux.
- Workflow e vercel.json alinhados a Node 24, npm ci, npm run verify e dist.

Logs locais ignorados pelo Git: output/qa-release-final.log, output/qa-release-clean-node24-install-network.log e output/qa-release-clean-node24-final-verify.log. A rede restrita falhou inicialmente na resolução do registry; a instalação autorizada com rede funcionou. Esse bloqueio antigo não permanece como falha da instalação limpa.

Mantido aviso de tamanho do chunk lazy liquidShaders: aproximadamente 536 kB bruto e 134 kB gzip. Não equivale a falha de build nem a uma medição de desempenho.

## Conferência no navegador

A versão compilada foi servida na porta 5174, separada da prévia de desenvolvimento. Conferidas hero, índice, História, Portfólio, formulário e rodapé:

| Dimensão emulada | Resultado observado |
| --- | --- |
| 320 × 800 | Sem transbordamento/imagem quebrada; índice em fluxo; História recolhida cabe fixada |
| 390 × 844 | Sem transbordamento/imagem quebrada; controles e prévias acessíveis |
| 768 × 1024 | Sem transbordamento/imagem quebrada; composição de tablet preservada |
| 1024 × 768 | Sem transbordamento/imagem quebrada; âncoras sob o cabeçalho |
| 1366 × 768 | Sem transbordamento/imagem quebrada; índice pode usar fluxo para caber inteiro |
| 1440 × 900 | Sem transbordamento/imagem quebrada; composição de computador preservada |
| 844 × 390 | Sem transbordamento/imagem quebrada; fluxo natural nas cenas que não cabem |

Hero ready nas sete dimensões, CTA com mínimo de 48 px. Em paisagem baixa a hero mantém altura natural, podendo ultrapassar o visor sem rolagem interna.

Percursos conferidos: saída pelo CTA e pela logo com Enter, cancelamento por rolagem sem overlay residual, chegada e foco no índice a 24 px abaixo do cabeçalho; pequeno avanço mantém a primeira prévia. Seleção múltipla na prévia sincroniza formulário; Continuar orçamento foca Seu nome. Geração do briefing inclui os serviços; alteração posterior invalida resultado e conserva campos. Nenhum link WhatsApp. Galeria abre, avança por seta, fecha com Escape e devolve foco; menu fecha com Escape e mantém estado correto.

Consulta do console da aba de produção sem erros/avisos. Evidências qa-release-matriz.json e capturas qa-release-320-portfolio.png, qa-release-320-orcamento.png e qa-release-1440-hero.png na pasta de visualizações desta conversa.

Revisores independentes conferiram formulário/navegação/galeria e as correções gráficas sem novo bloqueante. Testes e inspeção localizada não substituem aparelhos reais: sem Safari, Android/iPhone físicos, toque/trackpad físicos, medição de FPS, alternância real de movimento reduzido ou WebGL forçado a falhar no navegador. Fallbacks, pausas e cancelamentos possuem cobertura de código/testes; não afirmar compatibilidade universal.

## GitHub e importação Vercel

Enviar somente fontes, mídias necessárias, lockfile, configuração, testes e documentação. .gitignore exclui node_modules, dist, output, .release-check, .vercel, logs e arquivos de ambiente. Nenhuma credencial ou dependência instalada faz parte da entrega.

Repositório Vercel: Caio-Justino01/brenovstudio-site, branch main, raiz do projeto. Framework Vite; instalação npm ci; build npm run verify; saída dist; Node 24.x. O site não requer banco, função de servidor nem variável secreta. URLs absolutas de compartilhamento/canonical devem usar o domínio escolhido após o deployment.

Conferir o workflow Linux pelo commit enviado, e conferir separadamente o deployment e sua URL quando o usuário conectar a Vercel. A URL pública só é considerada funcionando após carregar o site e testar suas navegações.
