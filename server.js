// ============================================================
//  JN Invest — API de fundamentos (o "ajudante" do servidor)
//  Busca P/VP, DY, ROE etc. na Fundamentus e devolve em JSON.
//  Roda no Railway. O navegador não consegue fazer isso direto
//  (CORS + HTML) — por isso esse servidor existe.
// ============================================================

const express = require('express');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
app.use((req, res, next) => {            // libera o frontend a chamar essa API
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// converte "10,84" -> 10.84 ; "4,7%" -> 4.7 ; "192.279.000.000" -> 192279000000
function num(s) {
  if (!s) return null;
  s = String(s).replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// cache simples na memória (6h) — rápido e gentil com a fonte
const cache = new Map();
const TTL = 6 * 60 * 60 * 1000;

async function buscarFundamentos(ticker) {
  ticker = ticker.toUpperCase().trim();
  const hit = cache.get(ticker);
  if (hit && Date.now() - hit.t < TTL) return hit.dados;

  const url = 'https://www.fundamentus.com.br/detalhes.php?papel=' + encodeURIComponent(ticker);
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = await resp.arrayBuffer();
  const html = new TextDecoder('latin1').decode(buf); // Fundamentus é latin1
  const $ = cheerio.load(html);

  const m = {};
  $('td.label').each((i, el) => {
    const label = $(el).find('span.txt').first().text().trim();
    const valor = $(el).next('td.data').find('span.txt').first().text().trim();
    if (label) m[label] = valor;
  });

  const dados = {
    ticker,
    empresa: m['Empresa'] || null,
    setor: m['Setor'] || null,
    cotacao: num(m['Cotação']),
    pl: num(m['P/L']),
    pvp: num(m['P/VP']),
    dy: num(m['Div. Yield']),
    lpa: num(m['LPA']),
    vpa: num(m['VPA']),
    roe: num(m['ROE']),
    roic: num(m['ROIC']),
    margemLiquida: num(m['Marg. Líquida']),
    evEbitda: num(m['EV / EBITDA']),
    liquidezCorrente: num(m['Liquidez Corr']),
    valorMercado: num(m['Valor de mercado']),
    atualizadoEm: new Date().toISOString(),
  };

  cache.set(ticker, { t: Date.now(), dados });
  return dados;
}

// rota principal: /api/fundamentos/WEGE3
app.get('/api/fundamentos/:ticker', async (req, res) => {
  try {
    const dados = await buscarFundamentos(req.params.ticker);
    if (dados.pl == null && dados.pvp == null) {
      return res.status(404).json({ erro: 'Ativo não encontrado na Fundamentus' });
    }
    res.json(dados);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// serve o site (landing + cadastro + dashboard) na raiz
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'index.html'))
);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('JN Invest API rodando na porta ' + port));
