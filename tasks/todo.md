# Plano de Resolução do Erro de Deploy

- [x] **Passo 1:** Analisar os logs de build do Vercel e identificar a causa raiz. (Causa encontrada: o React Router está tentando compilar a rota catch-all `*?` que gera uma regex inválida `Nothing to repeat` durante o preset do Vercel).
- [x] **Passo 2:** Corrigir a definição de rota em `src/app/routes.ts`, alterando de `route('*?', ...)` para `route('*', ...)`.
- [x] **Passo 3:** Executar `npm run build` localmente para confirmar que o erro foi resolvido em todo o processo de SSR e conversão de rotas pelo preset `@vercel/react-router/vite`.
- [x] **Passo 4:** Finalizar a tarefa e entregar as correções.
