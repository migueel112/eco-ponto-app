// Tempo estimado, região do mapa e link para o app de navegação (RF07).
import { descreverTempo, regiaoDoTrajeto, urlNavegacao } from '../rota';

describe('descreverTempo', () => {
  test('minutos e horas', () => {
    expect(descreverTempo(9)).toBe('9 min');
    expect(descreverTempo(60)).toBe('1 h');
    expect(descreverTempo(65)).toBe('1 h 05 min');
    expect(descreverTempo(0.2)).toBe('1 min');
  });

  test('sem tempo, texto vazio', () => {
    expect(descreverTempo(undefined)).toBe('');
  });
});

describe('regiaoDoTrajeto', () => {
  test('centraliza e mostra todo o trajeto com folga', () => {
    const regiao = regiaoDoTrajeto([
      { latitude: -23.5, longitude: -46.6 },
      { latitude: -23.6, longitude: -46.8 },
    ]);
    expect(regiao.latitude).toBeCloseTo(-23.55);
    expect(regiao.longitude).toBeCloseTo(-46.7);
    expect(regiao.latitudeDelta).toBeCloseTo(0.14);
    expect(regiao.longitudeDelta).toBeCloseTo(0.28);
  });

  test('trajeto de um ponto só usa o zoom mínimo', () => {
    const regiao = regiaoDoTrajeto([{ latitude: -23.5, longitude: -46.6 }]);
    expect(regiao.latitudeDelta).toBe(0.01);
    expect(regiao.longitudeDelta).toBe(0.01);
  });
});

describe('urlNavegacao', () => {
  const destino = { latitude: -23.5614, longitude: -46.6559, nome: 'Ecoponto Teste' };

  test('iPhone abre o Mapas da Apple com o destino', () => {
    expect(urlNavegacao(destino, 'ios')).toBe('http://maps.apple.com/?daddr=-23.5614,-46.6559');
  });

  test('Android usa geo: com o nome do ponto', () => {
    expect(urlNavegacao(destino, 'android')).toBe(
      'geo:-23.5614,-46.6559?q=-23.5614,-46.6559(Ecoponto%20Teste)'
    );
    expect(urlNavegacao({ latitude: 1, longitude: 2 }, 'android')).toBe('geo:1,2?q=1,2(Ponto%20de%20coleta)');
  });
});
