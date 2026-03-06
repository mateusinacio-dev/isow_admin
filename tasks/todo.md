# Plano de Implementação: Fase 1 (Upload Próprio)

- [x] Instalar pacote `@vercel/blob`
- [x] Criar nova rota `app/api/upload/route.js`
- [x] Atualizar hook local `src/utils/useUpload.js` para usar a rota nova
- [x] Atualizar função servidor `src/app/api/utils/upload.js` para usar a rota nova
- [x] (Aguardar) Informar usuário para configurar token `BLOB_READ_WRITE_TOKEN` no Vercel
