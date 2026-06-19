# JN Invest — API de fundamentos

O "ajudante" do servidor. Busca P/VP, Dividend Yield, ROE, P/L etc. na
Fundamentus e devolve em JSON. O navegador não consegue fazer isso direto
(CORS + HTML), então esse servidorzinho faz a ponte. Roda no Railway.

## Testar no seu PC

```bash
npm install
npm start
```

Abra: http://localhost:3000/api/fundamentos/WEGE3

## Subir no Railway

1. Suba esta pasta (`jn-invest-api`) para um repositório no **GitHub**.
2. No Railway: **New Project → Deploy from GitHub repo** → escolha esse repo.
3. O Railway detecta Node sozinho e roda `npm start`. Pronto, no ar.
4. Em **Settings → Networking**, gere o domínio público
   (ex: `jn-invest-api-production.up.railway.app`).

### Domínio próprio
Em **Settings → Networking → Custom Domain**, adicione `api.jninvest.com.br`
(ou similar) e aponte o DNS conforme o Railway indicar.

### Atualizações futuras
É automático: toda vez que você der `git push` no repositório, o Railway
**publica a nova versão sozinho**. Não precisa fazer mais nada.

## Como o frontend usa

```js
const r = await fetch('https://SEU-APP.up.railway.app/api/fundamentos/WEGE3');
const dados = await r.json();
// dados.pvp, dados.dy, dados.roe, dados.pl ...
```

## Rotas
- `GET /api/fundamentos/:ticker` → fundamentos do ativo (ex: `WEGE3`, `ITSA4`)
- `GET /` → teste de saúde

Tem cache de 6h na memória para ser rápido e gentil com a fonte.
