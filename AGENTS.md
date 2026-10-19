# Diretrizes do projeto Breno

## Fonte de verdade

Leia `docs/PLANO.md` e `docs/PROGRESSO.md` antes de implementar uma etapa. Atualize o progresso com o que foi feito, o que foi verificado e os limites da entrega.

## Identidade e escrita

1. Textos em português, curtos e diretos. Não use travessões nos textos da interface.
2. Preserve a identidade underground com apresentação clara para contratantes de diferentes áreas.
3. Use a logo fornecida sem redesenhar sua forma ou criar uma marca diferente.
4. Use Anton nos títulos e Manrope na interface. Exceção aprovada pelo usuário: o nome da hero usa Barlow Condensed Black 900, alto e pesado. Siga `docs/HERO-REVISAO.md` para a hero. Preserve os tokens de cor aprovados.
5. Evite cards repetitivos, selos decorativos, gradientes gratuitos, slogans genéricos, ícones sem função e a mesma animação de entrada em todas as seções.
6. Os serviços confirmados são VFX, EDIT, SHOT e ART. Não invente clientes, números, biografia, depoimentos ou serviços.
7. Informações de desenvolvimento pertencem à documentação, sem inserir explicações técnicas no percurso do visitante.

## Implementação

1. Trabalhe na etapa solicitada e mantenha as demais áreas estáveis. A preparação não equivale à entrada animada concluída.
2. Ordem da página: entrada, índice, história, portfólio e orçamento.
3. Rolagem e âncoras devem funcionar sem depender da conclusão da animação.
4. Conteúdo e mídia ficam centralizados no cadastro tipado. Não espalhe projetos e telefones pelos componentes.
5. A primeira cena usará Three.js. GSAP coordena transições e leitura. Não acrescente bibliotecas de efeitos sem necessidade concreta.
6. Mantenha a alternativa estática para movimento reduzido e falhas de WebGL.
7. Toque para interagir não pode impedir a rolagem do celular.
8. Fontes e mídias devem ser locais. Capturas temporárias do Instagram precisam manter origem e participação de Breno identificadas.
9. Não apresente capturas de reels como vídeos disponíveis. Não atribua captação integral a Breno quando o crédito confirmado for apenas edição.

## Verificação

Execute `npm.cmd run check` e `npm.cmd run build`. Inspecione a prévia no navegador nas larguras pertinentes, confira erros de console e rolagem horizontal. A futura etapa de partículas também exige verificação visual do ciclo, interação, fallback e movimento reduzido. Registre qualquer limite de verificação.

Não faça commit, push ou publicação apenas por concluir a preparação.
