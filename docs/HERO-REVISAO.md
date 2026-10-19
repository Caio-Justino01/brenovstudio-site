# Revisão da hero

## Atualização vigente: entrada e dissolução da silhueta, 18/10/2026

Substitui a saída retangular de dois segundos abaixo. A abertura usa agora a mesma dissolução ao contrário, conforme solicitação posterior do usuário. Duração de três segundos, hover localizado, flutuação, poeira e índice preservados. Nenhuma biblioteca nova.

Integração posterior de 18/10: a atmosfera saiu do renderer da logo e passou a uma única camada fixa global. O canvas da marca limpa com alpha zero tanto no host quanto no overlay da dissolução. Física, cache da entrada, partículas, poeira, movimento e controlador público permanecem iguais. O fundo não se retira no handoff ao índice, eliminando a emenda entre seções.

Revisão de controles de 18/10/2026: CTA usa LiquidLink da base de vidro com metal líquido, contorno mascarado de 2 px, centro translúcido e desfoque de 12 px. Integração autorizada de @paper-design/shaders somente para os controles, com limite global de seis instâncias e alternativa estática. A logo continua com o botão nativo, física e controlador anteriores. O mesmo handler e a classe experience-link preservam dissolução, proteção contra duplicados, cancelamento e foco. Navbar de vidro conserva os estados de abertura e saída. Os registros antigos de degradê estático abaixo são históricos.

Revisão tipográfica vigente: H1 com texto normal, nítido e parado. Removidos GooeyMarquee, travessia, filtros, máscaras e cópias visuais. O nome aparece junto da interface em 400 ms após a formação da logo. Barlow Condensed Black 900 e proporção estática do wrapper direto preservadas. Movimento reduzido exibe o mesmo texto sem transição. Física e tempos da marca permanecem iguais.

### Entrada ao contrário

assemblyReplay.ts prepara um histórico temporário na GPU usando o próprio simulationShader da saída, a partir da marca em repouso. São 195 passos físicos e 14 quadros, distribuídos em atlas RGBA16F de 4 × 4 posições. Capturas normalizadas pelo tamanho da logo permitem redimensionar a cena. Não há leitura de pixels pela CPU. A interpolação Hermite entre posições e velocidades mantém o percurso contínuo, sem limitar a renderização à quantidade de quadros guardados.

assemblyMotion.ts conduz três segundos lineares do relógio 2,2 até zero da saída. O início entra na cauda ainda visível dos grãos, evitando repetir a espera vazia do final. Imagem e partículas usam o mesmo releaseTime, vida individual, tamanho e filamentos da dissolução; a direção visual das velocidades é invertida. A nuvem aleatória retangular anterior foi removida. A marca se recompõe no centro e, no trecho final de aproximadamente 480 ms, percorre o foco da saída ao contrário para se acomodar na posição da hero. Textos e controles continuam aparecendo em 400 ms depois da montagem.

O atlas ocupa aproximadamente 12,9 MB no computador ou 4,6 MB no modo compacto e é descartado ao concluir, pular, iniciar saída ou desmontar. A abertura é consultada por getter após image.decode e imediatamente antes de preparar o atlas, sem encerrar essa intenção no prazo de três segundos. O prazo libera somente a interface; carga tardia ainda prepara o histórico enquanto a abertura continuar solicitada. Âncoras, movimento reduzido e abertura dispensada não preparam esse histórico. Durante uma saída iniciada na formação tardia, a mudança dessa intenção não restaura a cena nem corta a dissipação. O controlador público não mudou. A saída continua calculada ao vivo, herdando as interações atuais.

### Saída preservada

Ao clicar na logo ou no CTA, nome, serviços, botão e cabeçalho somem em 350 ms. No mesmo intervalo, o canvas existente centraliza a logo, conserva a transformação de origem e aproxima em até 4%, limitado a 88% do menor lado do visor. Imagem e partículas usam a mesma escala, centro e rotação. O cabeçalho conserva os 400 ms da abertura original.

exitDissolve.ts centraliza tempos e enquadramento e fornece o campo GLSL compartilhado. releaseTime(home) usa ruído espacial suave nas coordenadas originais da marca, entre 350 ms e 1,6 segundo. A imagem se retira e os grãos aparecem pelo mesmo campo, em passagem de 100 ms. Trechos ainda nítidos permanecem reconhecíveis enquanto os anteriores se soltam. Posição, velocidade e campo perturbado não são apagados no acionamento. O campo anterior continua apenas se acomodando.

A simulação abandona destinos retangulares e a divisão em quatro bordas. Grãos já liberados seguem correntes curvas, com pequeno desvio e velocidade individuais, sem mola de retorno. Cada grão encolhe e desaparece pela própria idade em 550–850 ms; não há fade global de toda a marca. Filamentos limitados a 2,5 px durante a saída. Partículas distantes não são criadas para cobrir o visor.

burst(onCovered?: () => void): Promise<void> mantém sua interface e unicidade. O callback ocorre aos 1,9 segundo, já durante a dissipação, posicionando o fundo do índice sob o canvas transparente. O ciclo termina aos 2,5 segundos; o último tempo de vida possível termina aos 2,45 segundos. A revelação do índice continua em 500 ms, com foco no final. Cancelamento restaura escala 1, centro, campo, controles e canvas no host. Interrupção, falha, descarte e movimento reduzido mantêm os caminhos existentes.

## Registro anterior: índice e transição líquida, 17/10/2026

Esta revisão substitui a saída lateral de 1,3 segundo e a taxa fixa de quatro grãos descritas nos registros anteriores deste arquivo. A formação de três segundos, líquido localizado, flutuação, cores, tipografia da hero e botão de vidro permanecem.

Saída com dois segundos, calculada no estado GPU de posição e velocidade. A influência se propaga por toda a marca em aproximadamente 350 ms. Os grãos atravessam um campo de destinos distribuídos pelo visor e depois seguem, por correntes curvas, para destinos além das quatro bordas. A velocidade anterior é herdada. Durante a saída, a mola e o limite localizado deixam de atuar e o teto de velocidade cresce progressivamente. O vertex shader não soma mais uma trajetória lateral analítica nem aplica fade global. Filamentos de saída limitados a 6 px evitam a trama excessiva observada na primeira inspeção.

O mesmo canvas passa para overlay fixo no body, com renderer transparente. Na metade da animação, burst(onCovered?: () => void): Promise<void> posiciona o índice por baixo; o fundo antigo é retirado enquanto aparece a mesma atmosfera da próxima cena. A simulação continua mesmo depois que a hero deixa a tela. Após a saída, o canvas volta ao host, o overlay é removido e pergunta, foto e título aparecem em 500 ms. O foco chega ao índice no final. Interrupção por wheel, touchmove, teclas de navegação, histórico ou outro link resolve o ciclo, limpa o overlay e respeita o usuário. Falha de contexto ou movimento reduzido antes do callback ainda entrega o índice após a resolução, sem repetir a passagem.

shakeDust.ts mede velocidade e aceleração do movimento interativo, subtraindo a flutuação automática. Suavização de 150 ms na entrada e 600 ms na queda. Taxa entre quatro e dezesseis grãos por 100 px, com breve cauda na última região perturbada. Teto em janela móvel de um segundo: 40 no computador ou 20 no modo compacto. Origem, velocidade GPU, pool fixo, profundidade e vida de cinco a oito segundos são mantidos.

Contents.tsx mantém a cena separada da hero. Scroll nativo com scrub 0,3, três encaixes e pin curto; fluxo normal em movimento reduzido ou menos de 520 px úteis. Entrada e scroll animam wrappers distintos para não sobrescrever visibilidade. Somente a prévia ativa participa da navegação por teclado no modo fixado. Os links reais e as seções completas continuam acessíveis. Fundo indexado no mesmo relógio e shader, com DPR até 1, 30 fps e pausa fora da tela. O enquadramento móvel aproxima foto e título; legendas identificam o trabalho, sem confundir Dops com Breno.

A revisão independente encontrou e confirmou correções para visibilidade das descrições, resolução antecipada da saída e alinhamento após fontes respeitando interação. Evidências e limites atuais estão na primeira entrada do PROGRESSO.md. As seções seguintes registram a implementação anterior.

## Direção atual, 17/10/2026

A direção aprovada combina líquido localizado, marca flutuante e espaço escuro em profundidade. Os registros anteriores no PROGRESSO.md são históricos. Não usar lente de olho de peixe nem deformação de UV.

1. Formar a logo em três segundos. A nuvem inicial ocupa 150% da largura e altura da hero, passando pelas quatro bordas. Cabeçalho, nome, serviços e botão aparecem em 400 ms após a formação. Rolagem e âncoras continuam disponíveis.
2. A imagem original permanece nítida em repouso. Passar o mouse ativa líquido somente no percurso, com memória curta e combinação por máximo. Parar, sair ou entrar em outro controle interrompe os estímulos.
3. A marca flutua lentamente: até 3 px horizontais, 5 px verticais e 0,35 grau, em ciclos de 14 e 10 segundos. Metade da amplitude no celular. O mouse afasta a marca, com limite de 5 px no computador e 3 px no celular.
4. Quando começa a recomposição, uma reação amortecida se acomoda em dois segundos. Sua amplitude fica limitada a 3 px, ou 1,5 px no celular, sem somar impulsos.
5. O fundo conserva névoa azul muito escura, vazio central e três profundidades de estrelas. Poeira ambiente baixa ocupa todos os quadrantes. Poucos grãos escapam das regiões perturbadas, recuam, caem e desaparecem, sem deixar buracos permanentes.
6. Clique, toque curto e Enter/Espaço na logo agora iniciam a mesma saída de Iniciar experiência. Repulsão predominantemente lateral, com curvas e velocidades herdadas, durante 1,3 segundo. Ao concluir, navegar para #indice, focar a seção e manter 24 px abaixo do cabeçalho.
7. O CTA conserva vidro transparente, texto em uma linha e seta. O degradê pertence somente ao contorno e ao reflexo interno, com distribuição aproximada de 45% branco, 25% cinza e 30% azul, usando os tokens existentes.
8. Preservar Barlow Condensed Black 900, serviços do cadastro, logo original, cores e todas as demais seções.

## Implementação

`particleScene.ts` mantém Three.js e GPUComputationRenderer. A logo é amostrada em até 100 mil partículas no computador e 36 mil no modo compacto. O modo é escolhido na inicialização pela largura do host ou ponteiro coarse. Redimensionamentos ajustam geometria, DPR e raio, sem reconstruir o orçamento de partículas; recarregar na nova largura seleciona o orçamento correspondente.

`logoMotion.ts` calcula flutuação, afastamento inverso e reação limitada. Imagem, partículas e botão nativo recebem a mesma translação e rotação. A imagem invisível continua sendo a referência geométrica sem transformação, evitando realimentar a medição. O ponteiro é convertido pela transformação inversa antes de alimentar a simulação. A direção do gesto é suavizada em aproximadamente 180 ms.

`liquidHover.ts` mantém o campo de 128 × 128 e uma fila de até 16 segmentos, sem conectar saída a reentrada. A força entra em aproximadamente 450 ms; seu alvo se esgota em um segundo sem movimento. A exposição do material se desfaz entre 1,7 e 3 segundos. Até 3,4 segundos sem estímulo, o campo e a simulação são limpos. Restauração e saída também limpam o histórico. As posições originais dos grãos delimitam a influência, sem recrutar regiões distantes por advecção.

O relógio líquido usa escala 0,65 e passos físicos fixos de 1/120 s, com acumulador. Renderização, campo de interação e fundo permanecem independentes. O limite suave de velocidade é 5 unidades por passo de referência a 60 Hz no computador e 3 no modo compacto, seguido de resistência progressiva antes do limite de deslocamento de 65% do raio. O corte rígido é proteção final. O curl secundário permanece em 0,30 e os filamentos conservam a redução de 15% aprovada.

`spaceDust.ts` acrescenta 900 pontos ambiente no computador ou 400 no modo compacto. Um pool fixo de 32 × 32 ou 16 × 16 guarda os grãos desprendidos em dois estados GPU com ping-pong. A taxa é aproximadamente quatro por 100 px de percurso, condicionada à presença de material claro. Cada spawn consulta posição e velocidade atuais da simulação, transformação da logo e campo perturbado. Grãos recuam, caem, encolhem e desaparecem entre cinco e oito segundos. Slots são reciclados, com versões inteiras compatíveis com RGBA16F. Nenhum objeto novo é alocado por grão e nenhum buraco fica na imagem.

A saída mantém `burst(): Promise<void>`, reutiliza a Promise pendente em acionamentos duplicados e preserva o estado atual do líquido para herdar seu movimento. O deslocamento lateral e as curvas são calculados por grão, com início suave. Logo e CTA passam pelo mesmo handler de navegação, inclusive no caminho estático. O botão nativo tem nome acessível Iniciar experiência pela logo. Toque conserva pan-y, sem captura de ponteiro ou bloqueio de pointermove.

O pulso interno de `liquidMotion.ts` e `disturb()` permanecem por compatibilidade da interface do controlador; os controles da página usam a saída compartilhada. A alternativa de pulso não é mais a função do clique na logo.

O contorno do CTA usa pseudoelementos mascarados, sem pintar o centro. Fontes, mídias, quantidade principal de partículas e restante do site foram preservados. Nenhuma biblioteca acrescentada.

Pausa fora da tela e com aba oculta, descarte, cancelamento e alternativa estática permanecem. Aos três segundos de inicialização, liberar a interface; carga tardia até dez segundos assume a marca formada. Movimento reduzido não cria WebGL. Motivos de falha são registrados somente em desenvolvimento. `data-pointer-input` e `data-liquid-debug` são diagnósticos de desenvolvimento, ausentes da produção.

## Verificação

Ver PROGRESSO.md para evidências e limites desta entrega. Testes unitários verificam relógio físico, inversa do ponteiro, amplitudes, emissão por distância, reciclagem, trilha, abertura, navegação e carregador. Eles não executam os framebuffers. A aparência e a emissão efetiva exigem inspeção visual no navegador.

## Referências

Sculpture Hero, fornecido pelo usuário e atribuído a https://guglielmogiannattasio.it, e Halftone Nebula. A atribuição permanece no comentário dos shaders. Textos, menus, marcas, fontes remotas e comandos de instalação das demonstrações não substituem o projeto.
