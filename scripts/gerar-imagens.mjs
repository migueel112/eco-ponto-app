// Gera as imagens do app (ícones dos materiais e logo) como arquivos PNG,
// desenhando formas geométricas simples. Não usa nenhuma biblioteca: só o
// zlib do Node para comprimir o PNG.
//
// Uso (na raiz do projeto):  npm run gerar-imagens
// Saída: assets/imagens/materiais/*.png e assets/imagens/logo.png
//
// Cores da coleta seletiva (Resolução CONAMA 275/2001): papel azul,
// plástico vermelho, vidro verde, metal amarelo; eletrônico em laranja.

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const AMOSTRAS = 4; // 4x4 amostras por pixel deixam as bordas suaves

// ---------- formas: cada uma diz se o ponto (x, y), de 0 a 1, está dentro ----------

const circulo = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

const elipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

function retangulo(x0, y0, x1, y1, raio = 0) {
  return (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + raio), x1 - raio);
    const cy = Math.min(Math.max(y, y0 + raio), y1 - raio);
    return (x - cx) ** 2 + (y - cy) ** 2 <= raio * raio;
  };
}

function poligono(pontos) {
  return (x, y) => {
    let dentro = false;
    for (let i = 0, j = pontos.length - 1; i < pontos.length; j = i++) {
      const [xi, yi] = pontos[i];
      const [xj, yj] = pontos[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  };
}

const uniao = (...formas) => (x, y) => formas.some((f) => f(x, y));
const intersecao = (a, b) => (x, y) => a(x, y) && b(x, y);

// ---------- desenho e PNG ----------

function hexParaRgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

// camadas: [{ forma, cor }], desenhadas em ordem (a última fica por cima).
function desenhar(tamanho, camadas) {
  const pixels = new Uint8Array(tamanho * tamanho * 4);
  const cores = camadas.map((c) => hexParaRgba(c.cor));
  for (let py = 0; py < tamanho; py++) {
    for (let px = 0; px < tamanho; px++) {
      const soma = [0, 0, 0, 0];
      for (let sy = 0; sy < AMOSTRAS; sy++) {
        for (let sx = 0; sx < AMOSTRAS; sx++) {
          const x = (px + (sx + 0.5) / AMOSTRAS) / tamanho;
          const y = (py + (sy + 0.5) / AMOSTRAS) / tamanho;
          let cor = null;
          for (let i = camadas.length - 1; i >= 0; i--) {
            if (camadas[i].forma(x, y)) {
              cor = cores[i];
              break;
            }
          }
          if (cor) {
            // cor pré-multiplicada pela opacidade, para a média ficar certa
            soma[0] += cor[0];
            soma[1] += cor[1];
            soma[2] += cor[2];
            soma[3] += 255;
          }
        }
      }
      const total = AMOSTRAS * AMOSTRAS;
      const alfa = soma[3] / total;
      const i = (py * tamanho + px) * 4;
      if (alfa > 0) {
        const cobertura = soma[3] / 255;
        pixels[i] = Math.round(soma[0] / cobertura);
        pixels[i + 1] = Math.round(soma[1] / cobertura);
        pixels[i + 2] = Math.round(soma[2] / cobertura);
        pixels[i + 3] = Math.round(alfa);
      }
    }
  }
  return pixels;
}

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABELA_CRC[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const comprimento = Buffer.alloc(4);
  comprimento.writeUInt32BE(dados.length);
  const tipoEDados = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoEDados));
  return Buffer.concat([comprimento, tipoEDados, crc]);
}

function paraPng(tamanho, pixels) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(tamanho, 0);
  cabecalho.writeUInt32BE(tamanho, 4);
  cabecalho[8] = 8; // 8 bits por canal
  cabecalho[9] = 6; // RGBA
  const linhas = Buffer.alloc(tamanho * (tamanho * 4 + 1));
  for (let y = 0; y < tamanho; y++) {
    linhas[y * (tamanho * 4 + 1)] = 0; // sem filtro
    Buffer.from(pixels.buffer, y * tamanho * 4, tamanho * 4).copy(linhas, y * (tamanho * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', cabecalho),
    bloco('IDAT', deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- os desenhos ----------

const BRANCO = '#FFFFFF';
const fundo = (cor) => ({ forma: circulo(0.5, 0.5, 0.5), cor });

const IMAGENS = {
  // Papel: folha com o canto dobrado e linhas de texto.
  'materiais/papel': [
    fundo('#1565C0'),
    { forma: poligono([[0.3, 0.22], [0.6, 0.22], [0.72, 0.34], [0.72, 0.8], [0.3, 0.8]]), cor: BRANCO },
    { forma: poligono([[0.6, 0.22], [0.6, 0.34], [0.72, 0.34]]), cor: '#90CAF9' },
    { forma: retangulo(0.37, 0.44, 0.65, 0.48, 0.02), cor: '#1565C0' },
    { forma: retangulo(0.37, 0.54, 0.65, 0.58, 0.02), cor: '#1565C0' },
    { forma: retangulo(0.37, 0.64, 0.56, 0.68, 0.02), cor: '#1565C0' },
  ],
  // Plástico: garrafa PET com tampa.
  'materiais/plastico': [
    fundo('#C62828'),
    { forma: retangulo(0.44, 0.15, 0.56, 0.23, 0.02), cor: BRANCO },
    {
      forma: uniao(
        retangulo(0.46, 0.22, 0.54, 0.32),
        poligono([[0.46, 0.3], [0.54, 0.3], [0.64, 0.42], [0.36, 0.42]]),
        retangulo(0.36, 0.4, 0.64, 0.84, 0.06)
      ),
      cor: BRANCO,
    },
    { forma: retangulo(0.36, 0.52, 0.64, 0.6), cor: '#EF9A9A' },
  ],
  // Vidro: pote com tampa.
  'materiais/vidro': [
    fundo('#2E7D32'),
    { forma: retangulo(0.33, 0.2, 0.67, 0.3, 0.03), cor: BRANCO },
    { forma: retangulo(0.3, 0.33, 0.7, 0.82, 0.1), cor: BRANCO },
    { forma: retangulo(0.38, 0.42, 0.44, 0.7, 0.03), cor: '#A5D6A7' },
  ],
  // Metal: lata (o desenho é escuro porque o fundo amarelo é claro).
  'materiais/metal': [
    fundo('#F9A825'),
    { forma: uniao(retangulo(0.32, 0.27, 0.68, 0.75), elipse(0.5, 0.75, 0.18, 0.06)), cor: '#263238' },
    { forma: elipse(0.5, 0.27, 0.18, 0.06), cor: '#546E7A' },
    { forma: retangulo(0.32, 0.45, 0.68, 0.58), cor: '#90A4AE' },
  ],
  // Eletrônico: celular com tela e botão.
  'materiais/eletronico': [
    fundo('#E65100'),
    { forma: retangulo(0.33, 0.17, 0.67, 0.83, 0.07), cor: BRANCO },
    { forma: retangulo(0.38, 0.25, 0.62, 0.68, 0.02), cor: '#FFCC80' },
    { forma: circulo(0.5, 0.755, 0.035), cor: '#E65100' },
  ],
  // Logo: marcador de mapa branco sobre fundo verde, com uma folha dentro.
  logo: [
    { forma: retangulo(0, 0, 1, 1, 0.22), cor: '#2E7D32' },
    {
      // A ponta encosta no círculo nos pontos de tangência (sem degrau):
      // vértice em (0,5; 0,88), círculo de centro (0,5; 0,42) e raio 0,25.
      forma: uniao(circulo(0.5, 0.42, 0.25), poligono([[0.2901, 0.5558], [0.7099, 0.5558], [0.5, 0.88]])),
      cor: BRANCO,
    },
    // Folha verde: a parte comum de dois círculos, com a nervura branca.
    { forma: intersecao(circulo(0.4, 0.5, 0.2), circulo(0.6, 0.32, 0.2)), cor: '#2E7D32' },
    { forma: poligono([[0.43, 0.32], [0.445, 0.31], [0.585, 0.475], [0.57, 0.485]]), cor: BRANCO },
  ],
};

const TAMANHOS = { logo: 512 };

mkdirSync('assets/imagens/materiais', { recursive: true });
for (const [nome, camadas] of Object.entries(IMAGENS)) {
  const tamanho = TAMANHOS[nome] ?? 192;
  const arquivo = `assets/imagens/${nome}.png`;
  writeFileSync(arquivo, paraPng(tamanho, desenhar(tamanho, camadas)));
  console.log(`+ ${arquivo} (${tamanho}x${tamanho})`);
}
