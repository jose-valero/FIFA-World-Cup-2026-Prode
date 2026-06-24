export const scoringRules = [
  {
    title: 'Aciertas ganador o empate',
    points: '+3 pts',
    description: 'Sumas puntos cuando aciertas el signo del partido.'
  },
  {
    title: 'Aciertas el marcador exacto',
    points: '5 pts',
    description: 'Si pegas el resultado completo, te llevas el máximo puntaje.'
  },
  {
    title: 'Bonus eliminatoria: método',
    points: '+2 pts',
    description:
      'En partidos de fase eliminatoria, si pronosticás empate en los 90 minutos y acertás si se define por prórroga o penales.'
  },
  {
    title: 'Bonus eliminatoria: ganador',
    points: '+1 pt',
    description:
      'Si además acertás qué equipo gana el cruce (aplica solo cuando también acertaste el método).'
  },
  {
    title: 'Cada fecha mueve la tabla',
    points: 'Ranking live',
    description: 'A medida que se cargan resultados oficiales, la tabla global se actualiza.'
  }
];
