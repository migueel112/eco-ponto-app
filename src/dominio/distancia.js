// Cálculo de distância em linha reta entre dois pontos da Terra (RN06).
// Usa a fórmula de Haversine, que considera a Terra uma esfera.

// Raio médio da Terra em quilômetros.
export const RAIO_DA_TERRA_KM = 6371;

function emRadianos(graus) {
  return (graus * Math.PI) / 180;
}

// Confere se a localização tem latitude e longitude numéricas e dentro dos
// limites (latitude entre -90 e 90, longitude entre -180 e 180).
export function localizacaoValida(localizacao) {
  if (!localizacao) {
    return false;
  }
  const { latitude, longitude } = localizacao;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

// Devolve a distância em km entre origem e destino, cada um no formato
// { latitude, longitude }. Lança erro se alguma localização for inválida.
export function distanciaHaversine(origem, destino) {
  if (!localizacaoValida(origem) || !localizacaoValida(destino)) {
    throw new Error('Localização inválida');
  }

  const diferencaLatitude = emRadianos(destino.latitude - origem.latitude);
  const diferencaLongitude = emRadianos(destino.longitude - origem.longitude);

  const a =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(emRadianos(origem.latitude)) *
      Math.cos(emRadianos(destino.latitude)) *
      Math.sin(diferencaLongitude / 2) ** 2;

  const anguloCentral = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_DA_TERRA_KM * anguloCentral;
}
