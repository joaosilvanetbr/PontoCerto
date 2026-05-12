# Deploy Checklist - PontoCerto

Antes do deploy:

- [ ] `npm run verify` passou
- [ ] frontend build passou
- [ ] backend build passou
- [ ] `wrangler.toml` existe na raiz
- [ ] `pages_build_output_dir = "dist/public"`
- [ ] `functions/api/[[trpc]].ts` compila
- [ ] D1 binding `DB` existe no Cloudflare
- [ ] `JWT_SECRET` existe no Cloudflare
- [ ] dominio customizado esta configurado
- [ ] `/api/trpc/ping` responde
- [ ] login invalido mostra erro amigavel
- [ ] login valido funciona
- [ ] `auth.me` funciona apos login
- [ ] logout funciona

