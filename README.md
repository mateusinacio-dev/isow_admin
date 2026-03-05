# ISOW Admin

Sistema administrativo construído com tecnologias modernas do ecossistema React, focado em alta performance, usabilidade e integração contínua. 

## 🚀 Tecnologias e Arquitetura

Este projeto utiliza um stack extremamente moderno, alavancando os novos recursos do **React Router v7** aliado à velocidade do **Vite**. As principais tecnologias incluem:

### Frontend & UI
- **React 18** + **React Router v7**: Framework completo para roteamento no lado do cliente e do servidor.
- **Tailwind CSS v3**: Estilização baseada em utilitários, rápida e altamente customizável.
- **Chakra UI** & **@lshay/ui**: Sistemas de design e de componentes maduros e responsivos.
- **Zustand**: Gerenciamento de estado global leve e flexível.
- **React Hook Form** + **Yup**: Gerenciamento integrado e validação de formulários.
- **Lucide React**: Biblioteca moderna de ícones.
- **Motion**: Animações fluidas e transitions de alto nível.
- **Recharts**: Suporte à visualização de dados e gráficos interativos.
- **React Google Maps (@vis.gl/react-google-maps)**: Mapas e geolocalização.

### Backend, Dados e Autenticação
- **React Query (@tanstack/react-query)**: Gerenciamento de estado assíncrono, cache e sincronização de requests.
- **Hono (react-router-hono-server)**: Servidor web ultra-rápido para suportar o backend e o SSR no edge/serverless.
- **Auth.js (@auth/core & @hono/auth-js)**: Solução completa e segura para autenticação.
- **Neon Database (@neondatabase/serverless)**: Driver otimizado para acesso ao banco de dados serverless.
- **Stripe**: Preparado para integração de assinaturas e pagamentos corporativos.

### Ferramentas, Build e Testes
- **TypeScript**: Tipagem estática em toda a aplicação.
- **Vite**: Bundler de desenvolvimento ultrarrápido com Hot Module Replacement (HMR).
- **Vitest** + **React Testing Library**: Suíte de testes unitários e de interface projetada para velocidade.

## 📦 Estrutura Principal

Apesar das customizações internas, o ambiente segue um padrão claro e otimizado:
- `src/` - Contém todo o código da aplicação (rotas, componentes, hooks e utils).
- `build/` - Saída do processo de build para deploy.
- `react-router.config.ts`, `vite.config.ts`, `tailwind.config.js` - Configurações-chave de Roteamento, Dev Server e Estilização.
- `.env` - Variáveis de ambiente secretas (chaves de API, tokens de acesso, DB connection string).

## 🛠 Comandos e Execução Local

Como o projeto faz uso do arquivo `bun.lock`, é fortemente recomendado o uso do [Bun](https://bun.sh/) como gerenciador de pacotes principal, garantindo alta performance na instalação.

### Instalação

```bash
bun install
```

### Desenvolvimento

Inicia o servidor em modo de desenvolvimento, já aplicando reload rápido para o frontend e o servidor Hono subjacente.

```bash
bun run dev
```

### Build para Produção

Gera os artefatos de build tanto para o cliente quanto para os arquivos do servidor, preparando para a infraestrutura de deploy.

```bash
bun run build
```

### Checagem de Tipos

Verifica se todo o projeto obedece as regras rígidas estipuladas no `tsconfig.json`.

```bash
bun run typecheck
```

## 🤝 Como Contribuir

1. Siga os padrões do código e mantenha o rigor do TypeScript;
2. Se criar novos componentes, isole-os e adicione testes simples via Vitest se necessário;
3. Respeite as validações configuradas via `Yup` sempre que lidar com formulários/entradas de dados;
4. Dúvidas com Auth ou Servidor, confira as documentações oficiais do _React Router v7_ e do _Hono_.
