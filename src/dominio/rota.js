// Apoio à Rota (distanciaKm, tempoEstimado), que é transitória: só existe
// em memória enquanto a TelaRota está aberta.

// "9 min", "1 h" ou "1 h 05 min".
export function descreverTempo(minutos) {
  if (!Number.isFinite(minutos)) {
    return '';
  }
  const total = Math.max(1, Math.round(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) {
    return `${resto} min`;
  }
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')} min`;
}

// Região do mapa que mostra todo o trajeto, com uma folga nas bordas.
export function regiaoDoTrajeto(coordenadas, folga = 1.4, deltaMinimo = 0.01) {
  const latitudes = coordenadas.map((c) => c.latitude);
  const longitudes = coordenadas.map((c) => c.longitude);
  const [latMin, latMax] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [lonMin, lonMax] = [Math.min(...longitudes), Math.max(...longitudes)];
  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
    latitudeDelta: Math.max((latMax - latMin) * folga, deltaMinimo),
    longitudeDelta: Math.max((lonMax - lonMin) * folga, deltaMinimo),
  };
}

// Endereço que abre o app de navegação do celular já com o destino:
// no iPhone, o Mapas da Apple; no Android, a escolha entre os apps de mapa
// instalados (Google Maps, Waze...).
export function urlNavegacao(destino, plataforma) {
  const { latitude, longitude } = destino;
  if (plataforma === 'ios') {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  const rotulo = encodeURIComponent(destino.nome ?? 'Ponto de coleta');
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${rotulo})`;
}
