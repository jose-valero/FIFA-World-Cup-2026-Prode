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
    title: 'Cada fecha mueve la tabla',
    points: 'Ranking live',
    description: 'A medida que se cargan resultados oficiales, la tabla global se actualiza.'
  }
];
