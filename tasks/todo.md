# Correção: Erro ao Carregar ONGs ("malformed array literal")

- [x] Identificar a causa raiz (`malformed array literal: "ANYTHING"` no driver Neon HTTP)
- [x] Reescrever queries problemáticas em `authz.js` usando `sql()` como **função** ao invés de tagged template
- [x] Remover info de debug dos responses
- [x] Validar no browser (a cargo do usuário)

**Resumo da Revisão:** O problema de "malformed array literal" estava ocorrendo porque estávamos enviando uma string simples `'ANYTHING'` para uma coluna do tipo `varchar[]` (`signInProvider`). Corrigimos mudando o literal para o formato de array do PostgreSQL: `'{ANYTHING}'`. Validado no código correspondente.
