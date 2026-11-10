// CT04 – cálculo da distância pela fórmula de Haversine (RN06).
import { distanciaHaversine, localizacaoValida } from '../distancia';

const PRACA_DA_SE = { latitude: -23.5505, longitude: -46.6333 };
const MASP = { latitude: -23.5614, longitude: -46.6559 };
const RIO_DE_JANEIRO = { latitude: -22.9068, longitude: -43.1729 };

describe('distanciaHaversine', () => {
  test('Praça da Sé até o MASP dá cerca de 2,6 km', () => {
    expect(distanciaHaversine(PRACA_DA_SE, MASP)).toBeCloseTo(2.6, 1);
  });

  test('São Paulo até o Rio de Janeiro dá cerca de 360,7 km', () => {
    const distancia = distanciaHaversine(PRACA_DA_SE, RIO_DE_JANEIRO);
    expect(distancia).toBeGreaterThan(360);
    expect(distancia).toBeLessThan(361.5);
  });

  test('pontos iguais dão 0 km', () => {
    expect(distanciaHaversine(MASP, MASP)).toBe(0);
  });

  test('a distância é a mesma nos dois sentidos', () => {
    expect(distanciaHaversine(MASP, PRACA_DA_SE)).toBeCloseTo(
      distanciaHaversine(PRACA_DA_SE, MASP),
      10
    );
  });

  test('lança erro com localização inválida', () => {
    expect(() => distanciaHaversine(null, MASP)).toThrow('Localização inválida');
    expect(() =>
      distanciaHaversine(PRACA_DA_SE, { latitude: 91, longitude: 0 })
    ).toThrow('Localização inválida');
  });
});

describe('localizacaoValida', () => {
  test('aceita coordenadas dentro dos limites', () => {
    expect(localizacaoValida(MASP)).toBe(true);
    expect(localizacaoValida({ latitude: -90, longitude: 180 })).toBe(true);
  });

  test('recusa valores ausentes, não numéricos ou fora dos limites', () => {
    expect(localizacaoValida(undefined)).toBe(false);
    expect(localizacaoValida({ latitude: '10', longitude: 20 })).toBe(false);
    expect(localizacaoValida({ latitude: NaN, longitude: 20 })).toBe(false);
    expect(localizacaoValida({ latitude: 10, longitude: 181 })).toBe(false);
    expect(localizacaoValida({ latitude: -90.1, longitude: 0 })).toBe(false);
  });
});
