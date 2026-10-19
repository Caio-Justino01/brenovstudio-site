# Plano aprovado do site de Breno

## Objetivo

Portfólio audiovisual interativo para diferentes contratantes, com identidade underground. O site deve ser minimalista, apresentar trabalhos com destaque e conduzir a leitura por meio das animações.

Entrega aprovada em 19/10/2026: revisar e corrigir problemas, validar instalação limpa e versão compilada, criar commit e enviar a versão atual para https://github.com/Caio-Justino01/brenovstudio-site.git. A autorização inclui commit e push para a branch principal, preservando qualquer histórico remoto. Vercel será conectado pelo usuário. Registrar testes, conferência responsiva e limites em QA-LANCAMENTO.md e PROGRESSO.md; confirmar envio por SHA remoto e workflow, sem inferir deployment do GitHub.

Revisão móvel de 19/10: capturar a intenção da entrada uma vez por documento. Raiz/#inicio em entrada nova ou recarga reinicia no topo; histórico e BFCache conservam posição. Preparar o lease e sincronizar a restauração interna do ScrollTrigger antes de montar o React; devolver a preferência ao concluir ou navegar. Não corrigir posição por loops ou temporizadores. Compartilhar essa decisão com os alinhamentos iniciais do índice e da História.

A implementação será feita por etapas. A primeira entrega de implementação deve ter a entrada animada funcionando e o restante em esqueleto. A preparação técnica é um passo anterior a essa entrega.

## Identidade aprovada

1. Nome principal: Breno. Logo original como assinatura do estúdio.
2. Cores: preto `#050505`, grafite `#191C20`, cinza `#A5ABB2`, azul `#389DD3`, azul gelo `#BCE8FA` e texto claro `#ECEFF1`.
3. Títulos em Anton, aproximando a referência condensada GRANIKA. Textos e controles em Manrope. Na revisão de 16/10, o usuário substituiu a fonte do nome da hero por Barlow Condensed Black 900. Ver `HERO-REVISAO.md`.
4. Composição com espaço vazio, títulos próximos à parte inferior das cenas e mídias em escalas diferentes. Evitar repetir a divisão de imagem e texto em duas metades.
5. Textos curtos, naturais e sem travessões.
6. Cada elemento precisa ter função e relação com o trabalho de Breno. Evitar cards idênticos, selos, gradientes gratuitos, frases genéricas e animações repetidas.
7. A logo e as fotografias comandam a direção visual. Texturas e partículas ficam subordinadas à leitura.

Revisão de títulos em 19/10: reutilizar o reflexo aprovado nos números +200/+5 nas palavras principais dos títulos. Destacar somente Breno, História, Portfólio e Orçamento, preservando a grafia original, fontes, pesos, tamanho, prefixos e sobrenome. Ver/Fazer/Conheça/Estevam continuam com o texto normal. Nome da hero, prévias do índice, legenda/apresentação da História e títulos das seções usam a mesma base GlareText. Passagem de brilho de 1,6 s ao aparecer, sem movimento do texto ou loop; alternativa estática no movimento reduzido. Os números conservam o acabamento anterior, agora com tokens e keyframes compartilhados. A identidade da História recebe o brilho depois de assumir seu quadro final; a hero espera a formação e o índice respeita a prévia ativa. Não reintroduzir Gooey, desfoque das letras ou travessia horizontal.

### Composição inicial da entrada

```text
Breno                                        Índice

                                  Creativity Forge

                partículas / logo


BRENO                           VFX EDIT SHOT ART
                              Iniciar experiência
```

No celular, o nome e os controles ocupam uma faixa inferior com espaço próprio. A logo deve continuar inteira, sem competir com textos ou áreas de toque.

## Estrutura e comportamento

### Entrada

Direção vigente de 18/10/2026 detalhada em `HERO-REVISAO.md`: logo original com líquido localizado ao passar o mouse e espaço escuro em profundidade. A abertura de três segundos reproduz a dissolução aprovada ao contrário: os próprios grãos aparecem dispersos, percorrem as mesmas correntes curvas e recompõem os contornos até a marca ficar nítida. Retirada a nuvem retangular com distribuição aleatória. A marca se forma no enquadramento central da saída e se acomoda na posição da hero antes de revelar a interface em 400 ms. Entrada nova e recarga na raiz ou em #inicio conservam a formação mesmo quando a cena demora mais de três segundos para carregar. A interface pode ser liberada aos três segundos sem cancelar a intenção da formação. Âncoras, salto, movimento reduzido e restauração por histórico dispensam o replay.

Flutuação lenta de até 3 px horizontais, 5 px verticais e 0,35 grau, com metade da amplitude no celular. O mouse afasta a marca em até 5 px, ou 3 px no celular. Imagem, partículas e área interativa compartilham transformação; o ponteiro usa sua inversa. Pequena reação amortecida na recomposição, limitada e sem acumulação.

Campo de influência GPU de 128 × 128 conserva os segmentos percorridos. Ao parar, sair ou entrar em controles, novos estímulos cessam e o material se acomoda. Influências se combinam por máximo. Escala física 0,65, entrada de força em aproximadamente 450 ms, direção suavizada e limite progressivo de velocidade e deslocamento. Campo limpo até 3,4 segundos sem passagem. Renderização e fundo mantêm cadência independente.

Poeira discreta em todos os quadrantes, 900 pontos no computador ou 400 no modo compacto. Pool reutilizável de até 1.024 ou 256 grãos que escapam do material efetivamente perturbado, aproximadamente quatro por 100 px de percurso. Capturar posição e movimento de origem, cair e recuar, reduzir e desaparecer entre cinco e oito segundos, sem buracos permanentes.

Logo e botão Iniciar experiência compartilham a dissolução de 2,5 segundos aprovada em 18/10 e a entrega ao índice descritas abaixo. Clique, toque curto e Enter/Espaço na logo iniciam essa saída. Preservar Promise, proteção contra duplicados, foco e respiro de 24 px abaixo do cabeçalho. CTA com vidro escuro translúcido e metal líquido somente no contorno de 2 px, conforme a revisão de controles abaixo. Texto em uma linha e seta preservados.

Preservar cores, fontes, raio do líquido, quantidade principal de partículas e demais seções. Nenhuma biblioteca nova para a física da logo; somente o material dos controles admite a integração Paper descrita abaixo. Revisão móvel de 19/10: contato primário de toque ou caneta na logo alimenta o mesmo líquido localizado. Pan-y e rolagem nativa continuam disponíveis; pointercancel encerra o estímulo quando o navegador assume a rolagem. Arrasto acima de 8 px, cancelamento ou pressão acima de 500 ms impedem a saída por clique residual; toque curto preserva a navegação. Restauração e saída limpam o histórico. Rolagem, âncoras e link de pular não dependem da animação.

Movimento reduzido e falha de WebGL mantêm a imagem estática e os controles de navegação. Aos três segundos de inicialização, liberar a interface e permitir carga em segundo plano até dez segundos; carga tardia assume logo formada. Registrar causas somente em desenvolvimento. Links diretos, posição restaurada e retorno à hero dispensam a espera. Não importar marcas, menus, fontes remotas ou comandos das demonstrações de referência.

### Fundo contínuo

Revisão aprovada em 18/10/2026: uma única atmosfera espacial fixa cobre o site inteiro. Reutiliza shader, paleta e relógio existentes, DPR máximo 1 e cadência máxima de 30 fps, com pausa na aba oculta. Hero, índice e seções principais são transparentes; o canvas da logo preserva alpha transparente também durante a abertura e a dissolução. Movimento reduzido e falha de WebGL usam o cenário estático. Bordas funcionais permanecem.

### Índice

#### Revisão atual: janela de produção no Orçamento, 18/10/2026

Somente a terceira prévia substitui a pasta por uma janela audiovisual. História e Portfólio conservam as pastas e seus links. Orçamento usa contêiner sem link externo envolvendo os seletores; somente Continuar orçamento navega. A coluna de convite contém Fazer orçamento e “Um evento, um lançamento ou uma ideia visual. Conte o que você quer criar.”, sem lista de serviços ou chamada duplicada.

Janela de vidro escuro com contorno azul e reflexos discretos. Barra superior com logo original sem fundo preto e Bemov Studio. Revisão do rodapé remove Novo projeto e usa o nome acessível Orçamento do Bemov Studio. Dops ocupa a imagem principal; Clandestina e Peppnx aparecem menores ao lado. Referências apontam para os projetos locais já cadastrados, conservando descrições, créditos e origens. Nenhum controle fictício de sistema ou vídeo. Pergunta O que você precisa?, seletores Captação, Edição, VFX e Arte visual e CTA Continuar orçamento. Descrição do último serviço selecionado usa o cadastro existente; sem escolhas, mostrar Você pode escolher mais de um serviço. Reservar altura para evitar deslocamento do CTA.

Revisão de formato em 19/10: o usuário pediu acompanhar o desenho das pastas. Substituir a moldura retangular por silhueta com aba esquerda elevada contendo logo/nome e descida curva até o topo do corpo. Usar grafite translúcido mais escuro, blur compartilhado e contorno branco/cinza/azul inspirado na frente das pastas. Fotos, pergunta, seletores e CTA ficam no corpo abaixo. O recorte pertence somente ao material decorativo e ao SVG do contorno, mantendo controles e foco sem clipping. Medir o tamanho natural do cartão com ResizeObserver; não aumentar o percurso nem alterar seleção/navegação.

App mantém a seleção compartilhada entre a janela e o formulário. Marcar e desmarcar funciona nos dois lugares, com múltipla escolha e seleção opcional na janela. O formulário conserva sua validação obrigatória e os demais campos digitados. Mudanças dos serviços invalidam o briefing preparado. CTA mantém href #orcamento, alinha o título abaixo do cabeçalho com 24 px de respiro e transfere o foco para Seu nome. Não calcula preço nem envia mensagens.

Texto à esquerda e janela à direita, centralizados verticalmente a partir de 1024 px. Abaixo, convite antes da janela. Seletores em duas colunas, CTA com largura disponível e imagens mais baixas em celular/paisagem. Medir a altura natural da janela, convite e controles do índice; quando exceder o espaço útil, usar as três prévias em fluxo, sem rolagem interna. Movimento reduzido também usa fluxo. Preservar a transição externa; apresentação interna por opacidade de moldura, imagens, seletores e CTA termina em 600 ms, sem repetir ao marcar serviços. Reutilizar o material e o teto de seis contextos dos controles existentes. As descrições históricas da pasta de Orçamento abaixo ficam substituídas por esta revisão.

Revisão vigente de 18/10/2026: uma pasta de vidro escuro por vez, com contorno azul, dobradiça e leque de mídias locais. Na revisão seguinte o usuário pediu duas colunas a partir de 1024 px: texto à esquerda e pasta à direita, alinhados verticalmente. Abaixo disso, pasta acima do texto. Pergunta, pasta e título ocupam áreas próprias, sem sobreposição. Títulos em Barlow Condensed Black 900 e controles Manrope. Revisão seguinte aprovada: retirar os nomes de arquivo e manter somente Abrir em cinza #A5ABB2, clareando em hover e foco. Toda a pasta e o texto mantêm o mesmo link de destino; não há arquivo para baixar. Portfólio usa Mais projetos, sem número não confirmado. O componente fornecido orienta a geometria; não importar adicionar arquivos, menus, tamanhos fictícios ou imagens abstratas. Camadas distintas recebem scroll, apresentação, abertura e inclinação. Mouse e foco ampliam a abertura; celular mantém fotografias expostas.

Scroll nativo com pin abaixo do cabeçalho, percurso adicional de 2,4 alturas de viewport no computador e duas no celular. Scrub 0,45 segundo, com intervalos estáveis de leitura e sem snap automático. A pasta anterior recua e sobe, e a próxima avança. O título permanece parado e nítido, com troca apenas por opacidade acompanhando a prévia. Não recebe travessia horizontal, desfoque ou animação por letra. Os controles apenas escolhem a prévia. Pasta e título são um único link real para a seção correspondente, sem segundo clique nas fotografias. No celular, compactar a prévia de orçamento para preservar o pin com as barras do navegador abertas, sem reduzir os controles abaixo de 48 px. As fotos usam altura baseada em 100svh e a cena mede o mesmo visor estável. O mínimo móvel passa a 440 px úteis, ainda exigindo que a composição real caiba; no computador permanece 560 px. Paisagem baixa, composição que não cabe e movimento reduzido usam fluxo normal.

A atmosfera é a camada global fixa descrita acima. A chegada explícita a #indice começa em História; rolagem reversa respeita o progresso. Foco e pergunta ficam 24 px abaixo do cabeçalho. A correção após fontes não pode interromper uma interação já iniciada. História usa a nova fotografia azul de olhos e rosto parcialmente coberto, fornecida pelo usuário, substituindo o retrato branco. Portfólio reúne Dops, Clandestina e Peppnx. Na revisão seguinte, Orçamento passa a reutilizar site.logo, a logo original da hero, inteira e centralizada na área exposta da pasta. Descrição acessível Logo do Bemov Studio, sem créditos ou tratamento associados à fotografia substituída. A imagem anterior fica preservada como arquivo sem uso nessa prévia. O retrato de História mantém o tratamento de resolução com IA, master de 3840 px e versão WebP; ampliação não equivale a detalhe nativo recuperado. Mídias, descrições, créditos e origens ficam no cadastro tipado.

Revisão tipográfica vigente: retirar GooeyMarquee e a travessia horizontal. Nome da hero, três títulos das prévias e títulos destacados de Portfólio e Orçamento usam texto normal, completo e com quebras naturais. Fontes, pesos e cores preservados. O nome aparece com a interface após a formação da logo. Índice usa somente opacidade nas trocas e na sequência de chegada; Portfólio e Orçamento recebem entrada curta por opacidade, sem desfoque ou animação por letra. Movimento reduzido mostra os textos estáticos. Componentes, estilos, cálculo de percurso e testes exclusivos do marquee foram removidos. Abrir permanece cinza e sem nomes .zip; controles de vidro e física da marca preservados.

Saída vigente da hero, aprovada em 18/10: foco inicial de 350 ms, retirando os demais elementos, centralizando a logo e aproximando em até 4%, com limite de 88% do menor lado do visor. Entre 350 ms e 1,6 segundo, um campo espacial contínuo desfaz a própria silhueta em trechos, com posições, cores e velocidades herdadas. Correntes curvas com pequenas diferenças por grão; nenhuma nuvem retangular ou destino nas quatro bordas. Cada grão diminui e desaparece individualmente entre 550 e 850 ms após o desprendimento. Duração total 2,5 segundos. Reusar o canvas em overlay fixo; posicionar o índice por baixo aos 1,9 segundo e revelar pergunta, foto e título em 500 ms após a dissipação. Callback opcional em burst(onCovered?: () => void): Promise<void>, executado uma vez. Rolagem e outra navegação interrompem o efeito sem forçar retorno. Falha ou movimento reduzido ainda concluem a navegação, desde que o usuário não tenha cancelado.

Grãos desprendidos acompanham a velocidade e aceleração do balanço interativo, sem contar a flutuação automática. Entrada de 150 ms, queda de 600 ms, emissão de quatro a dezesseis por 100 px e cauda de até 600 ms na última região perturbada. Teto de 40 grãos por segundo no computador e 20 no modo compacto. Pools e vida útil de cinco a oito segundos preservados.

### História

Revisão autorizada e implementada em código em 19/10: olhos e título acompanham scroll nativo num palco com position: sticky abaixo do cabeçalho. A implementação detalhada está em HISTORIA-SCROLL.md, com ritmo reajustado e conferência posterior no navegador. Uma única timeline GSAP com scrub de 0,45 s controla a composição, sem temporizador de avanço, carrossel, snap ou captura de roda/toque. A fixação nativa e uma trilha de altura medida substituem o pin gerenciado por JavaScript, preservando o espaço no fluxo sem criar pin-spacer ou alterar position/transform do palco.

Correção aprovada em 18/10/2026: usar a limpeza leve da fotografia original enviada novamente pelo usuário. Somente a abertura dos olhos sobre preto, preservando iluminação azul e enquadramento. Descartar do uso as interpretações que acrescentaram contorno de capuz, ombros e textura artificial. A imagem aprovada passa a ser compartilhada pela seção e pela pasta de História. O original permanece salvo sem alterações.

Correção solicitada em 19/10/2026: a pasta permanece com a fotografia de olhos fechados, inclusive em hover e foco. Clique segue imediatamente para História ainda fechada. Retirar a sequência de despertar na pasta e o atraso anterior de 950 ms. O despertar pertence à chegada na seção, por link, âncora direta ou rolagem.

Preservada a revisão compacta de 19/10: títulos de 28 a 48 px, sem quebra forçada do nome. Primeiro aparece somente Conheça um pouco da minha história. Biografia curta, CTA e redes surgem depois, com o nome e a abertura dos olhos. O espaço continua reservado e os contatos não recebem foco enquanto invisíveis. Serviços retirados dessa apresentação e concentrados em Sobre o trabalho. Fazer orçamento leva ao formulário e foca Seu nome. Instagram pessoal e do estúdio são links textuais próximos. O percurso adicional mede 115% da altura útil, limitado entre 600 e 1.000 px. Até 32%, convite e olhos fechados permanecem estáveis; olhos abrem entre 32 e 72%; convite sai entre 40 e 53% e nome/informações entram entre 57 e 71%, sem sobreposição. De 72 a 100%, identidade estável antes de liberar a passagem normal. Voltar desfaz a sequência; parar conserva o quadro após a acomodação curta. Removidos Pausar/Retomar/Rever e o controlador automático anterior.

Retrato permanece à direita no computador, em cena de 400 px, e acima do texto abaixo de 1024 px, em área de 120 a 180 px. Paisagem baixa a partir de 640 px usa retrato lateral para reduzir altura. O quadro fechado fica restrito às pálpebras sobre a fotografia aprovada. Dimensões conhecidas reservam espaço durante a carga; as imagens assumem o progresso corrente ao carregar, sem reiniciar a apresentação. Falha ou espera de cinco segundos conserva a fotografia disponível e libera texto estático. O único prazo remanescente pertence à carga da mídia. Retirada a respiração automática da História para que a composição dependa só do scroll. Movimento reduzido ou palco maior que a altura útil entrega identidade final em fluxo, sem percurso extra. Máscara integra o preto ao cenário.

Luz dos olhos revisada em 19/10: iluminação difusa e muito discreta em azul quase branco acinzentado. Opacidade máxima da camada reduzida de 0,9 para 0,22, com cores semitransparentes, núcleo desfocado e halo de degradê suave. Removidos reflexo horizontal, branco sólido e mistura screen adicional. As posições medidas na foto e a timeline permanecem: surge entre 57 e 72%, auge até 78%, desaparece até 98%. Fluxo estático, falha de mídia e movimento reduzido conservam a fotografia sem luz. Nenhuma edição dos pixels, alteração de rosto, novo relógio ou biblioteca. Detalhes em HISTORIA-SCROLL.md.

Revisão mais recente de 19/10: Sobre o trabalho passa para dentro do palco fixado, com margem de 24 px abaixo da cena. Aparece exatamente com a biografia, usando a mesma opacidade entre 57 e 71% do percurso, sem scroll extra. Remover a entrada anterior dos últimos 48 px. Medir o conjunto completo e um núcleo de leitura móvel: olhos, biografia, contatos e cabeçalho de Sobre o trabalho. No celular recolhido, fixar esse núcleo quando couber, mesmo que os resultados terminem abaixo do visor; o restante do painel segue anexado e aparece naturalmente ao liberar o sticky. Não retirar os olhos animados apenas porque o painel completo ultrapassa a altura útil. O estado inicial pendente conserva olhos fechados até a primeira medição, sem capturar esse quadro como leitura já concluída. Expandir volta a considerar a altura completa e usa duas colunas de descrições; se ultrapassar a altura útil, liberar fluxo preservando o ponto de leitura. A trilha usa altura natural e um pseudo-elemento com o percurso adicional, com ancoragem automática desativada para não disputar a restauração. Fluxo estático/movimento reduzido mostram tudo. Medições agrupadas em RAF ignoram variações inferiores a 1 px; mudança de tamanho captura progresso e quadro visual, ou marcador de leitura. Gesto, foco ou navegação novos invalidam restauração pendente. Um heading acessível permanece estável durante a troca visual. Links explícitos de História sincronizam o início; histórico respeita a posição restaurada. Limpar listeners, observer, timeline, ScrollTrigger, RAF, opacidades, visibility e inert na desmontagem/mudança de modo.

Serviços confirmados: VFX, EDIT, SHOT e ART. Indicadores fornecidos em 18/10: +200 projetos, +5 anos e atuação nacional com sede em Belo Horizonte, MG. Sobre o trabalho conserva local/alcance e botão Saiba mais, com duas faixas: resultados e serviços. Números de 32 a 40 px com reflexo e quatro serviços visíveis sem expansão, sem repetição junto ao nome. Somente as descrições se expandem; Mostrar menos recolhe sem perder foco. No celular, duas colunas são usadas quando expandido. Preservar contorno oficial LiquidPanel, divisórias sutis e Manrope. Nenhum novo dado biográfico. Manter origens das imagens. Não usar WhatsApp, inclusive número provisório/Em breve; whatsappNumber continua null até orientação posterior.

### Portfólio

Revisão da seleção em 19/10: nome, formato e Ver projeto recebem uma única faixa retangular de vidro por linha, cobrindo toda a largura do botão. Remover os três acabamentos isolados. Preservar material azul translúcido, seleção sincronizada com a fotografia, foco visível e abertura da galeria pelo botão inteiro. No celular, a faixa também envolve a miniatura e as duas linhas de informação.

Revisão aprovada em 19/10/2026: palco imersivo inspirado no Music Portfolio e nos prints enviados. Fotografias grandes com lista sobreposta, sem copiar textos, fontes, relógio, coordenadas ou navegação da referência. Título Portfólio permanece acima do palco, estático e em Anton; lista e controles em Manrope. Correção posterior durante a auditoria: substituir as faixas azuis sólidas por vidro escuro translúcido com contorno azul e reflexo dos tokens comuns. Texto claro, foco gelo e contraste sobre a fotografia. Fundo espacial preservado, granulação fina estática e escurecimento suave nas bordas. Fotografias conservam suas cores e tratamentos originais.

Curadoria inicial em portfolioShowcase no cadastro tipado: Clandestina, Dops e Peppnx, com enquadramentos específicos no computador e celular. Começar com Clandestina. São três capas e cinco mídias nas galerias existentes, com origem, créditos e participação preservados. Os registros e arquivos de reels continuam no cadastro, fora da seleção do palco. A inspeção pública dos perfis nesta conversa não disponibilizou novos trabalhos utilizáveis; esta versão usa as mídias locais temporárias já registradas, sem nova captura, geração ou promessa de resolução superior. Arquivos finais poderão substituir os temporários no mesmo cadastro.

Alternar projetos a cada cinco segundos em repouso. Mouse e foco escolhem uma prévia e suspendem o ciclo até quatro segundos após deixarem a lista. Troca de fotografia por opacidade em 650 ms e acomodação de escala de 1,025 para 1, sincronizada com revelação horizontal curta das faixas azuis. Textos não se movem, embaralham ou desfocam. Escolha mais recente substitui as anteriores, sem fila; imagem pendente conserva a prévia anterior até carregar ou falhar. Controle Pausar prévias permite manter o destaque parado; Retomar prévias libera o ciclo.

Pausar fora da tela, com aba oculta, durante galeria, por interação e em pausa manual, mantendo bloqueios independentes. Movimento reduzido usa seleção manual, sem ciclo ou transições. Um único temporizador é descartado com os observadores e listeners ao desmontar. Clique, toque e Enter abrem diretamente o projeto, sem segundo clique obrigatório. Galeria mantém imagens completas, setas, botões, créditos, origem, Escape e retorno do foco ao acionador sem reposicionar a página. Falha de prévia não impede abertura do projeto.

Palco com altura mínima de aproximadamente 80svh no desktop; abaixo de 1024 px, miniaturas e duas linhas de informação identificam os projetos sem hover. Nomes podem quebrar. Telas estreitas e paisagem mantêm altura natural e fluxo normal, sem rolagem interna, pin ou interceptação da roda/toque. Reutilizar React, GSAP e a galeria, sem novas bibliotecas ou shaders. Hero, índice, História, orçamento, navbar e rodapé ficam fora desta revisão.
### Orçamento

Briefing curto com nome, serviço, data, local e ideia. Nome, serviço e ideia obrigatórios. Data pode estar a definir. Local pode indicar trabalho remoto. Seleção de um ou mais serviços. Na revisão geral, uma superfície compartilhada de vidro reúne seleção e detalhes em duas colunas, com campos e foco consistentes com a janela do índice. Abaixo de 1024 px, empilhar; campos em uma coluna no celular, texto de entrada de 16 px e CTA disponível sem scroll interno. Preservar valores ao navegar e invalidar o briefing preparado quando o conteúdo muda.

Preparar briefing gera o texto localmente para revisão. O destino de WhatsApp só é habilitado quando existir número real no cadastro. Enquanto whatsappNumber estiver vazio, conservar o destino atual do Instagram e cópia do texto. Não há envio automático nem confirmação fictícia de entrega. A primeira versão não depende de backend ou banco de dados.

## Controles de vidro e metal líquido

Revisão aprovada em 18/10/2026. Base reutilizável em src/components/ui para botão nativo, link real e acabamento visual sem interação própria. Integrar somente @paper-design/shaders, usando a API atual do Liquid Metal. Contorno mascarado de 2 px com reflexos em branco, cinza, azul e azul gelo; centro preto translúcido com backdrop-filter de 12 px e reflexo interno fino. Manrope, largura conforme conteúdo e altura mínima de 48 px. Hover/foco realçam o material; pressionar comprime discretamente; clique cria onda de 600 ms, com origem central no teclado. Preservar propriedades, eventos, estados selecionados, desabilitados e ocupados. O indicador Abrir é somente visual no link único da pasta. Logo, fotografias e links editoriais conservam sua apresentação.

Navbar de largura total no topo, com vidro escuro translúcido e uma linha clara de 1 px na base. Sem moldura externa, cantos arredondados ou contorno lateral. Breno é link textual à esquerda; Índice conserva o acabamento de botão à direita. Links rápidos no computador e menu escurecido nas telas menores. Preservar Escape, foco, desaparecimento durante formação/dissolução e respiro de 24 px nas âncoras.

Shader em import separado, inicializado somente para controles visíveis. Reservas incluem carregamentos pendentes, com limite de seis contextos adicionais simultâneos. Excedentes e caminhos de falha, carregamento ou movimento reduzido usam o contorno estático. Descartar instâncias fora da tela e atrás de diálogo modal; pausar com aba oculta. Camadas decorativas não recebem eventos; descartar animações, observadores e recursos ao desmontar. Interface do controlador da logo, títulos, pastas e conteúdo permanecem estáveis.

## Rodapé estático e navbar discreta, revisão de 18/10/2026

A animação do rodapé foi descartada a pedido do usuário. Remover canvas, ciclos, partículas, halo e área decorativa reservada. Rodapé compacto em três colunas no computador, marca acima das outras duas no tablet e áreas empilhadas no celular. Transição discreta para o preto, sem painel arredondado ou moldura. Logo original pequena, título Bemov Studio em Anton e informações em Manrope, reutilizando as fontes locais do site.

Conservar Creativity Forge, Belo Horizonte, destinos compartilhados com a navbar e perfis reais de Instagram. Localização permanece texto sem link. Na última orientação de 19/10, o usuário pediu não usar WhatsApp: retirar número provisório e Em breve da interface; whatsappNumber permanece null. Crédito Desenvolvido por Roupla, com link https://roupla.com.br/. Contatos e crédito centralizados no cadastro tipado.

StudioMark conserva a máscara SVG que remove o preto sem substituir o arquivo original. A janela de orçamento continua sem Novo projeto. Preservar hero, fundo espacial global, formulário, seleção de serviços, links, menu e controladores existentes. Apenas os botões conservam os contornos de vidro e metal líquido. Sem bibliotecas novas, commit ou publicação.
## Base técnica

React, Vite, TypeScript, Tailwind CSS, Three.js, GSAP e ScrollTrigger. Fontes locais. Um componente isolado será responsável pelo WebGL. Configurações responsivas e movimento reduzido serão tratados explicitamente.

Usar rolagem nativa. Trechos fixos devem ser curtos no computador e mais compactos no celular. Pausar a renderização de partículas fora da tela ou com a aba oculta. Ajustar a quantidade de partículas conforme o desempenho observado.

Textos, serviços, contatos e projetos ficam em `src/config/site.ts`. Mídias ficam em `public/media/`. O cadastro deve carregar dimensões, descrição, proporção e origem, sem depender do Instagram em tempo de execução.

## Revisão geral e padronização de 19/10/2026

Rodada de preparação para o repositório informado pelo usuário: https://github.com/Caio-Justino01/brenovstudio-site.git. Auditar animações, navegação, formulários e responsividade antes do envio. Runtime de entrega Node 24.x, verificação única npm run verify, checagem de caminhos/mídias para Linux, workflow GitHub e configuração Vercel na raiz. Preservar arquivos anteriores fora de public quando não tiverem uso. Registrar testes e pendências em QA-LANCAMENTO.md. A configuração não equivale a push/deploy ou aprovação visual; o usuário fará a conexão no Vercel. A autorização atual de preparação substitui as restrições históricas de escopo das etapas, sem presumir que o remoto esteja vazio ou alterar outro projeto.

O usuário autorizou auditar e corrigir a página inteira, com revisão independente e prioridade para responsividade, navegação, falhas de movimento e unidade visual. As restrições de escopo das etapas históricas acima não impedem as correções desta revisão. Preservar física e identidade aprovadas da hero e não acrescentar dependências.

GUIA-VISUAL.md e src/styles/materials.css registram a família comum: superfícies com vidro preto translúcido, blur de 12 px, contorno azul fino e reflexo interno. Pastas conservam sua geometria; janela de produção, briefing, menu e galeria compartilham o material. Controles reutilizam LiquidButton/LiquidLink/LiquidSurface; campos usam o mesmo raio e foco. O rodapé é editorial e estático, sem faixa de navbar, com logo, informações, Instagram e crédito Roupla. WhatsApp permanece desativado, sem placeholder. Retirar Índice somente dos links do rodapé; manter os destinos úteis nas duas navegações.

O índice deve limpar alturas e transformações ao sair do pin. Medições são agrupadas, mudanças mínimas não reiniciam a cena e resize conserva o progresso quando possível. Âncoras alinhadas com 24 px abaixo do cabeçalho, inclusive acesso direto, fontes prontas e repetição do mesmo destino. Galeria/menu mantêm posição fixa, scroll da página bloqueado apenas enquanto o diálogo está aberto e retorno correto de foco.

Preparação da abertura em lotes canceláveis, liberação explícita de contextos e relógio da dissolução compartilhado com a física para evitar saltos em quadros lentos. Fotografias do Portfólio conservam uma base opaca durante a mistura e priorizam a última escolha. Ciclos pausam fora da tela, em aba oculta e durante interação/modal. Controles só pedem shader após visibilidade estável, respeitando o teto existente de seis. Registrar limites de hardware e inspeção sem prometer FPS universal.

## Etapas

| Etapa | Entrega |
| --- | --- |
| Preparação | Dependências, estrutura, logo, fontes, documentação e base estática verificadas. |
| 1 | Partículas, ciclo automático, interação, botão, fallback e esqueleto das demais áreas. |
| 2 | Composição final do índice, acesso persistente, âncoras e transições responsivas. |
| 3 | História, espaços de bastidores, serviços e animações de leitura próprias. |
| 4 | Projetos temporários, galerias, créditos e substituição de mídia. |
| 5 | Briefing, mensagem de WhatsApp, acabamento, compartilhamento e revisão completa. |

Cada etapa termina com prévia local e verificação do comportamento acrescentado. O progresso deve permitir retomar o trabalho em outra conversa sem reinventar decisões.

## Critérios de verificação

1. Larguras de 320, 390, 768, 1024 e 1440 px, orientação horizontal e redimensionamento.
2. Ciclo sem interação, mouse, toque, botão durante a formação e rolagem imediata.
3. Logo inteira, texto legível, sem sobreposição e sem rolagem horizontal.
4. Teclado, foco, Escape, movimento reduzido e falhas de mídia ou WebGL.
5. Carregamento progressivo e desempenho da cena, sem prometer resultado em aparelhos não testados.
6. Validação e geração de mensagem do orçamento, sem enviar uma conversa real nos testes.
7. Checagem de tipos e build ao concluir cada etapa.

## Referências e evidências

1. Marca: `public/media/brand/studio-logo.jpeg`, cópia do arquivo original enviado pelo usuário.
2. Identidade e portfólio: https://www.instagram.com/brenobe.mov/
3. Estúdio e serviços: https://www.instagram.com/bemovstudio/
4. Candidato fotográfico: https://www.instagram.com/brenobe.mov/p/DceenYRG_hj/
5. Candidato com crédito de edição: https://www.instagram.com/demarco_tv/reel/DcjUCjqRKaZ/
6. Referência de experiência: https://landonorris.com/
7. Referência de textura de pontos e azul: https://www.aura.build/component/A392B4D

As referências visuais orientam a linguagem, sem copiar páginas ou depender de código pago. Os serviços confirmados pelo usuário são VFX, EDIT, SHOT e ART. A interface fica em português e o áudio só começa por ação da pessoa.
