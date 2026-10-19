# História guiada pela rolagem

Plano autorizado e implementado em código em 19/10/2026. Ritmo reajustado após o usuário apontar troca rápida: mais percurso e intervalos maiores de leitura, mantendo scroll nativo. TypeScript, testes e build passaram. A ferramenta do navegador voltou a responder nesta revisão; a conferência executada e seus limites estão registrados abaixo e em PROGRESSO.md.

## Resultado

Olhos e texto permanecem no mesmo enquadramento abaixo da navbar. A distância percorrida controla a transformação. Sem avanço por tempo, carrossel, snap, bloqueio da roda ou captura do gesto de toque.

Preservar dois momentos: primeiro somente “Conheça um pouco da minha história.” com olhos fechados; depois nome, biografia e olhos abertos. Biografia, Fazer orçamento, redes e Sobre o trabalho surgem juntos na identidade, sem antecipar as informações no convite. Seus espaços ficam reservados e controles invisíveis ficam inertes. Sobre o trabalho pertence ao palco fixado, com margem de 24 px abaixo da cena. Resultados e serviços continuam em faixas separadas; Saiba mais abre somente as descrições.

## Entrada de Sobre o trabalho

Revisão mais recente de 19/10 substitui a revelação nos últimos 48 px: o painel fica dentro do palco medido e usa exatamente a opacidade da biografia, entre 57 e 71% do percurso existente. Já está em sua posição definitiva durante toda a revelação, sem esperar scroll adicional, translate, escala ou uma segunda timeline. Removidos storyFactsPresence, factsReveal e os atributos/variáveis da entrada anterior.

Medir a composição completa, incluindo o painel. Retrato e espaçamentos compactos permitem manter o conjunto recolhido fixado nas telas verificadas, incluindo 320 × 800. Os quatro serviços aparecem na mesma linha no celular recolhido; ao expandir, passam a duas colunas com descrições. Se o conteúdo completo ultrapassar a altura útil, liberar fluxo natural com a identidade legível e conservar o topo anterior. Recolher restaura a fixação sem repetir o convite. Desabilitar a ancoragem automática dentro da trilha para não disputar essa conservação. Novo gesto encerra a guarda temporária de navegação; foco e navegação novos continuam invalidando restauração pendente. Fluxo estático e movimento reduzido mostram o painel normalmente.

## Distância e ritmo inicial

Calcular a altura útil como altura do visor menos cabeçalho e 48 px de respiro. O percurso adicional passa a 115% dessa altura, limitado entre 600 e 1.000 px. Exemplos com cabeçalho de 68 px: 901,6 px em 1440 × 900, 837,2 px em 390 × 844 e 786,6 px em 320 × 800. Cerca de 44% mais percurso que a versão anterior, com teto para não alongar excessivamente telas altas.

Usar a posição real da página, não a quantidade de eventos de roda ou a velocidade do dispositivo. Essa distância é adicional à passagem normal da seção. São valores iniciais que precisam passar pelos critérios de navegação abaixo antes da entrega.

| Progresso no percurso | Composição |
| --- | --- |
| 0 a 32% | Convite e olhos fechados estáveis. O convite conserva opacidade total até 40%. |
| 32 a 72% | Abrir os olhos progressivamente. Retirar o convite entre 40 e 53%; apresentar nome, biografia e contatos entre 57 e 71%, sem sobrepor títulos. |
| 72 a 100% | Nome, informações, contatos e olhos abertos estáveis. Ao terminar, liberar a seção seguinte pelo fluxo normal. |

Uma única timeline GSAP com ScrollTrigger e scrub de aproximadamente 0,45 s acompanha o gesto. Parar a rolagem conserva a posição depois dessa acomodação curta. Voltar desfaz a mesma trajetória. Movimento rápido pode atravessar a seção sem fila de animações. Não acrescentar prazo mínimo de espera nem bloquear o visitante: a leitura ganha distância estável, não um temporizador.

## Luz na abertura dos olhos

Revisão mais recente de 19/10: substituir o brilho forte por iluminação difusa e baixa, em azul quase branco acinzentado. A camada passa de opacidade máxima 0,9 para 0,22; núcleo e halo usam transparência gradual, com blur de 2 a 4 px no núcleo e 6 px no halo. Retirados reflexo horizontal, branco sólido e screen da camada de luz. Coordenadas percentuais em about.scene.eyeLights e enquadramento permanecem. A luz não altera o arquivo, a máscara ou a forma do rosto.

O campo light do mesmo cadastro de scroll controla uma única passagem: nasce entre 57 e 72%, permanece no auge até 78% e se dissipa até 98%. Antes disso, o olho já abriu o suficiente para expor a origem da luz. storyEyeLight calcula a intensidade de modo puro, limitado e reversível. A timeline existente atualiza somente uma variável CSS da camada decorativa; sem timer, ciclo, contexto gráfico ou biblioteca adicional. Parar conserva a luz corrente, voltar desfaz a passagem. Fluxo estático, movimento reduzido e falha de imagem omitem o brilho.

## Implementação e prevenção de saltos

1. Retirar StoryPresentation, temporizadores de avanço e controles Pausar/Rever. Substituir o tween independente dos olhos pela timeline do scroll. Uma única origem controla olhos e títulos.
2. Criar um palco interno com legenda, retrato, texto, contatos e Sobre o trabalho. Fixar esse conjunto no respiro de 24 px abaixo do cabeçalho quando couber inteiro.
3. Manter a altura natural do palco e acrescentar somente o percurso adicional num pseudo-elemento da trilha. Assim a expansão altera a geometria no mesmo quadro, sem aguardar uma altura antiga medida por JavaScript. ScrollTrigger controla somente o progresso visual, sem pin-spacer ou estilos de position/transform injetados no palco. Opacidades não alteram medidas.
4. Concentrar distâncias, intervalos e suavização num cadastro tipado. Criar helper puro para geometria/progresso, com clamps e limites válidos. Não mudar o controlador da logo nem o índice.
5. Agrupar medições em RAF e ignorar variações subpixel. Não reconstruir a timeline a cada scroll ou render React. Reaproveitar a estratégia de captura/restauração do índice: resize dentro do trecho conserva progresso e quadro visual; fora dele não força posição.
6. Antes de reaplicar uma posição após resize, conferir se não houve navegação, gesto ou foco que a substitua. Uma ação nova da pessoa vence a restauração.
7. Medir dimensões conhecidas das imagens e fontes. Mídia tardia assume o progresso atual, sem repetir abertura. Falhas conservam a fotografia disponível e texto legível, sem bloquear navegação. Uma mudança de modo deve preservar o ponto de leitura ao retirar o pin.
8. Limpar timeline, ScrollTrigger, opacidades, listeners, observadores e RAF na desmontagem/mudança de modo. A fixação nativa é habilitada somente pelo modo de layout, sem estilos de pin a restaurar. Não deixar duas instâncias nem trilhas com altura antiga.

## Registro da implementação

about.presentation.scroll centraliza distâncias, intervalos, respiro e scrub tipados. storyMotion.ts calcula elegibilidade, composição, geometria estável e captura/restauração; useStoryScroll.ts agrupa a medição natural e mantém uma única timeline. A interpolação dos olhos usa curva suave, com pausas nos extremos. StoryPresentation, seus testes de relógio e os controles Pausar/Rever foram retirados. A respiração automática anterior também foi retirada da História: sem scroll, a composição não continua mudando depois dos 0,45 s de acomodação.

A faixa Sobre o trabalho participa da medida do palco e da revelação da identidade. Títulos visuais não duplicam o heading acessível. Imagens mantêm dimensões declaradas; falha libera fluxo estático e carga tardia usa a posição atual. A navegação explícita usa data-story-start para voltar ao início mesmo quando o heading está colado na tela. No App, a chegada de histórico em História deixa a posição ser restaurada pelo navegador. O tratamento distingue popstate/hashchange conforme a [documentação do evento popstate](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event); a restauração física ainda não foi inspecionada neste ambiente.

Testes de geometria contemplam 320 × 800, 390 × 844, 768 × 1024, 1024 × 768, notebook 1366 × 768 e 1440 × 900 com alturas de conteúdo fornecidas às funções puras, além de cenário baixo/falha/movimento reduzido. Isso não equivale a renderização dessas larguras. Confirmados: 120 px iniciais não completam a transformação, títulos não aparecem juntos, curvas contínuas e reversíveis, distância limitada, descarte do avanço por tempo, restauração proporcional e invalidação por nova ação. A suíte inclui teste da âncora fixada e retorno ao início com notificação após o scroll.

Conferência posterior em navegador nesta revisão: 320 × 800, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 e paisagem 844 × 390. Sem transbordamento horizontal; paisagem usa fluxo. Em 1440, 160 px mantiveram convite/olhos fechados; 426,7 px ficaram no trecho intermediário e 693,3 px na identidade estável, com topo do palco a 92 px. O retorno ao mesmo ponto produziu as mesmas opacidades. Mouse abriu descrições e Enter recolheu preservando foco. Registradas capturas da seção e do painel; sem aparelhos físicos, Safari, trackpad real, toque físico ou medição de FPS. Preferência reduzida permanece coberta pelo fallback e testes puros, sem emulação de sistema nesta rodada.

## Telas pequenas, navegação e acessibilidade

O pin só será ativado quando o palco completo couber na altura útil, medido com fotos, texto, contatos e painel. Se não couber, especialmente com descrições expandidas ou em paisagem baixa, entregar a identidade final em fluxo normal. Movimento reduzido também usa texto, retrato e painel estáticos, sem percurso extra.

O link História chega ao primeiro quadro e ao título abaixo da navbar. Rolagem de volta acompanha a sequência inversa, sem reinício automático. Histórico/restauração preserva a posição quando possível. Fazer orçamento continua chegando ao campo de nome; links externos e teclado funcionam durante o pin. Tab pode sair da região, sem aprisionamento ou correção forçada do foco. Cabeçalhos visuais em troca não duplicam a leitura assistiva. Não adicionar anúncios automáticos a cada fração do scroll.

## Etapas de execução e aprovação técnica

1. Implementar geometria/progresso e validar limites e reversão em testes antes do acabamento visual.
2. Integrar palco, timeline única e navegação. Conferir primeiro computador, depois celular e mudança de tamanho.
3. Ajustar ritmo somente após passagens curtas, longas e reversas em escala normal. Registrar quadro inicial, intermediário e final.

Critérios que impedem concluir a entrega:

- Um avanço inicial de 120 px não pode completar a transformação em nenhuma altura elegível.
- O percurso completo deve terminar no limite definido, sem precisar de uma nova rolagem invisível para liberar a página.
- Voltar aos mesmos pontos produz o mesmo enquadramento; pausar não avança a apresentação sozinho.
- Não pode haver salto, seção sobreposta, área vazia residual ou foco escondido no resize, na saída do pin ou no retorno.
- Testar clique/teclado, âncora direta, histórico, imagem lenta/falha, preferência reduzida, aba oculta, pin para fluxo e fluxo para pin.
- Conferir 320, 390, 768, 1024 e 1440 px, notebook e paisagem. Testar mouse comum, trackpad e toque emulado se a ferramenta permitir; registrar aparelhos não testados.
- Executar TypeScript, testes e build. Registrar capturas e limites em PROGRESSO.md. Sem bibliotecas novas, commit ou publicação.

Os critérios reduzem o risco e dão uma condição objetiva para corrigir falhas encontradas. Não equivalem a garantir ausência de bugs em todo dispositivo sem testá-lo.
