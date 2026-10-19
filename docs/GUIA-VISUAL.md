# Guia visual do Bemov Studio

Revisão de 19/10/2026. Este guia registra a padronização pedida pelo usuário durante a auditoria geral.

## Tipografia e composição

Anton nos títulos das seções e nomes destacados. Manrope na interface, formulários e informações. Exceções já aprovadas: Barlow Condensed Black 900 na hero e nos títulos do índice. Preservar fontes locais.

Usar os mesmos gutters e a mesma paleta: preto #050505, grafite #191C20, cinza #A5ABB2, azul #389DD3, gelo #BCE8FA e branco #ECEFF1. Fotografias conservam suas próprias cores. Textos curtos em português, sem travessões, sem selos ou estatísticas inventadas.

Reflexo dos títulos aprovado em 19/10: GlareText aplica o mesmo material de +200/+5 somente às palavras Breno, História, Portfólio e Orçamento. Prefixos e sobrenome permanecem normais. Não mudar fontes, pesos, tamanhos ou posição para criar o efeito. Os tokens text-glare de materials.css e o keyframe compartilhado concentram degradê e halo. Uma passagem curta de brilho ao aparecer; sem loop, cópia visual de texto ou novo shader. Movimento reduzido e falta de background-clip text têm apresentação estática legível.

## Uma família de materiais

Os tokens de src/styles/materials.css são a fonte do material. Superfícies de conteúdo usam studio-glass: preto translúcido a 58%, blur de 12 px, contorno azul de 1 px, raio de 20 px e reflexo interno fino. Menu e galeria usam a variante mais escura para leitura sobre imagens. A navbar conserva vidro e linha inferior, sem moldura externa.

Pastas mantêm sua geometria de arquivo e dobradiça, compartilhando fundo, blur, cor do contorno e reflexo com a janela de produção e o briefing. Não criar outro vidro local com tonalidade, desfoque e sombra diferentes.

Botões e seletores reutilizam LiquidButton, LiquidLink ou LiquidSurface: contorno líquido de 2 px, raio de 14 px, centro translúcido e mínimo de 48 px para toque. Campos usam o mesmo azul, raio interno de 12 px e foco gelo. Bordas mais leves nos campos distinguem edição de uma ação principal. As camadas decorativas não capturam eventos.

Faixa informativa Sobre o trabalho: LiquidPanel reutiliza contorno líquido de 2 px e raio de superfície de 20 px, sem comportamento de botão. Duas faixas separam resultados de serviços, com divisórias discretas e Manrope. +200 e +5 ficam visíveis em 32 a 40 px, com o reflexo aprovado; VFX/EDIT/SHOT/ART aparecem somente aqui na História. Saiba mais expande apenas as descrições, conservando foco e números. No celular, quatro rótulos na mesma linha recolhida e duas colunas quando expandido. O painel respeita o teto de seis shaders e o fallback estático.

Entrada do painel: já encaixado dentro do palco, 24 px abaixo da cena, aparece com a mesma opacidade da biografia. Nenhum trecho extra de scroll para sua chegada. Medir o conjunto completo e liberar fluxo se não couber, preservando o ponto de leitura. No celular recolhido, quatro serviços na mesma linha; expandido, descrições em duas colunas. Controles ocultos ficam inertes. Fluxo estático e movimento reduzido mostram tudo imediatamente.

Fotografias e textos editoriais não recebem moldura de botão. A seleção do portfólio usa uma única faixa de vidro compartilhado por linha, envolvendo nome, formato e Ver projeto, com texto claro e contorno azul. Links editoriais continuam textuais. O rodapé é estático e aberto, sem imitar a faixa da navbar.

## Movimento que responde à leitura

Não animar letras, embaralhar textos ou mover títulos durante a leitura. O reflexo autorizado muda somente a iluminação das palavras. Fotografias podem trocar por mistura contínua, conservando uma base opaca. A História tem dois momentos, convite e identidade, sincronizados ao scroll nativo num palco sticky quando cabe. Não há paginação nem avanço por tempo. Percurso de 115% da altura útil entre 600 e 1.000 px, com convite totalmente nítido até 40% e identidade pronta em 72%; scrub de 0,45 s. Títulos contidos entre 28 e 48 px, nome sem quebra forçada e retrato menor. O convite mostra apenas Conheça um pouco da minha história; biografia, orçamento e Instagram surgem junto da identidade final. Reservar seu espaço e impedir foco nos contatos invisíveis. Não capturar a rolagem. Descrições adicionais dos serviços ficam recolhidas em Saiba mais. Não exibir WhatsApp por enquanto, conforme orientação do usuário.

Iniciar ciclos somente com uma parte útil da seção visível. Pausar quando a aba fica oculta, a seção sai da tela, uma galeria/menu cobre o conteúdo ou a pessoa assume a seleção. Não recuperar quadros ou textos perdidos enquanto ninguém via. Respeitar movimento reduzido, cancelar timers/RAF/animações e conservar a alternativa estática.

Exceção de luz autorizada para os olhos: núcleo branco/azul gelo com halo azul e reflexo horizontal curto, sobre a própria fotografia. Cresce com a abertura e se dissipa no fim do percurso, sem piscar ou repetir por tempo. A camada é decorativa, não captura eventos nem adiciona shader; oculta em fluxo estático e movimento reduzido. Evitar iluminar o rosto inteiro ou cobrir os textos.

O índice só fica fixo quando todo o conteúdo cabe. Ao voltar para fluxo, remover altura e transformações antigas. Mudanças pequenas de medida não devem reconstruir a animação. Nova navegação tem prioridade sobre restauração automática de progresso.

## Conferência de cada alteração

Verificar 320, 390, 768, 1024, 1280 e 1440 px e paisagem. Conferir largura CSS real, pois zoom e escala da ferramenta podem diferir do tamanho pedido. Checar encaixe das mídias, foco, teclado, campos preservados, estados selecionados e ausência de transbordamento.

Capturas são evidência visual, não prova de fluidez ou compatibilidade física. Registrar testes, limitações e resultados em PROGRESSO.md. Sem commit ou publicação ao terminar uma revisão local.
