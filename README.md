# Bemov Studio

Portfólio audiovisual de Breno Estevam. React, TypeScript, Vite, Three.js e GSAP, com fontes e mídias locais.

## Desenvolvimento e verificação

Use Node.js 24, definido em `.nvmrc` e `package.json`.

```sh
npm ci
npm run dev
```

No PowerShell, use `npm.cmd` se a política de execução bloquear `npm.ps1`. O Vite informa a porta realmente usada; o endereço de desenvolvimento é local.

```sh
npm run verify
npm run preview
```

`verify` executa os testes, TypeScript, build e a conferência dos arquivos de entrega. Esta última verifica mídias, imports e caixa dos caminhos para evitar falhas no Linux, além dos arquivos referenciados pelo HTML. Não substitui a inspeção visual ou testes em aparelhos reais. Os resultados e pendências estão em `docs/QA-LANCAMENTO.md` e `docs/PROGRESSO.md`.

## Experiência atual

1. Logo original formada em três segundos, líquido localizado pelo mouse, flutuação e poeira. Logo e botão iniciam a dissolução e levam ao índice.
2. Fundo espacial contínuo, índice com pastas de História e Portfólio e janela interativa de orçamento.
3. História com palco fixo, olhos e título acompanhando a rolagem. Telas onde o palco não cabe e movimento reduzido usam a apresentação estática.
4. Portfólio imersivo com Clandestina, Dops e Peppnx, destaque de linha inteira e galerias com créditos.
5. Briefing com seleção compartilhada de serviços, validação, preservação dos campos e cópia do texto para contato pelo Instagram.

Rolagem, navegação e contatos funcionam independentemente da conclusão da entrada. Falha gráfica e movimento reduzido conservam alternativas estáticas. WhatsApp permanece desativado por solicitação do usuário.

## GitHub e Vercel

Repositório indicado: [Caio-Justino01/brenovstudio-site](https://github.com/Caio-Justino01/brenovstudio-site).

Ao importar esse repositório no Vercel, use a raiz do projeto. `vercel.json` define:

| Opção | Valor |
| --- | --- |
| Framework | Vite |
| Node.js | 24.x pelo `package.json` |
| Instalação | `npm ci` |
| Build | `npm run verify` |
| Saída | `dist` |

O site não exige banco de dados, funções de servidor ou variáveis secretas. A navegação usa âncoras na mesma página, sem rotas que exijam rewrite. O workflow em `.github/workflows/verify.yml` faz a mesma verificação em Linux a cada push e pull request. Sua execução remota só poderá ser confirmada após o envio ao GitHub.

Antes da primeira publicação, concluir a conferência visual indicada no relatório de QA. Após escolher o domínio definitivo, configurar a URL absoluta da imagem Open Graph e a URL canônica. Não inferir publicação por um build local ou push bem-sucedido; conferir o deployment e sua URL no Vercel.

## Conteúdo e continuidade

`src/config/site.ts` centraliza textos, serviços, contatos, projetos e origens das imagens. Mídias usadas estão em `public/media/`. As capturas temporárias de Instagram mantêm créditos e podem ser substituídas por arquivos finais. Capas de reels não são vídeos disponíveis dentro da galeria; seus registros ficam preservados fora da seleção principal.

`output/` guarda exportações locais de trabalho e fica fora do Git. Também são ignorados dependências, build, arquivos de ambiente, cache e metadados locais do Vercel. Não apagar os originais ao substituir mídias.

Leia `docs/PLANO.md`, `docs/PROGRESSO.md` e `AGENTS.md` antes de alterar a experiência. Esta preparação não autoriza afirmar que a entrega foi validada em todos os dispositivos; consulte os limites registrados.
