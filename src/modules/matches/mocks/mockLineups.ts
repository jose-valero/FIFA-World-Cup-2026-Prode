// MOCK TEMPORAL — solo para iterar UI de alineaciones.
// Para desactivar: poner USE_MOCK_LINEUPS = false en MatchDetailPage.tsx
// Para eliminar: borrar este archivo y las referencias en MatchDetailPage.tsx.

import type { MatchLineups } from '../types/matchDetail.types';

function player(
  id: string,
  name: string,
  shortName: string,
  jersey: string,
  formationPlace: number,
  starter: boolean,
  subbedOutMin?: string,
  subbedInMin?: string
) {
  return {
    playerId: id,
    name,
    shortName,
    jersey,
    position: null,
    starter,
    formationPlace: starter ? formationPlace : null,
    active: true,
    subbedIn: { didSub: !!subbedInMin, minute: subbedInMin ?? null },
    subbedOut: { didSub: !!subbedOutMin, minute: subbedOutMin ?? null }
  };
}

// ── Home: Argentina 4-3-3 ─────────────────────────────────────────────────────

const homeStarters = [
  // GK (formationPlace=1)
  player('h1', 'Emiliano Martínez', 'E. Martínez', '23', 1, true),
  // Defenders (4)
  player('h2', 'Gonzalo Montiel', 'Montiel', '2', 2, true),
  player('h3', 'Cristian Romero', 'Romero', '13', 3, true),
  player('h4', 'Lisandro Martínez', 'L. Martínez', '14', 4, true),
  player('h5', 'Marcos Acuña', 'Acuña', '8', 5, true, "68'"),
  // Midfielders (3)
  player('h6', 'Rodrigo De Paul', 'De Paul', '7', 6, true),
  player('h7', 'Enzo Fernández', 'E. Fernández', '24', 7, true),
  player('h8', 'Alexis Mac Allister', 'Mac Allister', '20', 8, true),
  // Forwards (3)
  player('h9', 'Lautaro Martínez', 'L. Martínez', '22', 9, true, "78'"),
  player('h10', 'Lionel Messi', 'Messi', '10', 10, true),
  player('h11', 'Julián Álvarez', 'J. Álvarez', '9', 11, true)
];

const homeBench = [
  player('h12', 'Franco Armani', 'Armani', '1', 0, false),
  player('h13', 'Gerónimo Rulli', 'Rulli', '12', 0, false),
  player('h14', 'Nahuel Molina', 'Molina', '26', 0, false),
  player('h15', 'Nicolás Otamendi', 'Otamendi', '19', 0, false),
  player('h16', 'Nicolás Tagliafico', 'Tagliafico', '3', 0, false, undefined, "68'"),
  player('h17', 'Exequiel Palacios', 'Palacios', '5', 0, false),
  player('h18', 'Thiago Almada', 'Almada', '16', 0, false),
  player('h19', 'Paulo Dybala', 'Dybala', '21', 0, false, undefined, "78'"),
  player('h20', 'Ángel Di María', 'Di María', '11', 0, false),
  player('h21', 'Nicolás González', 'N. González', '17', 0, false),
  player('h22', 'Alejandro Garnacho', 'Garnacho', '15', 0, false),
  player('h23', 'Valentín Carboni', 'Carboni', '18', 0, false)
];

// ── Away: Francia 4-4-2 ───────────────────────────────────────────────────────

const awayStarters = [
  // GK
  player('a1', 'Mike Maignan', 'Maignan', '16', 1, true),
  // Defenders (4)
  player('a2', 'Jules Koundé', 'Koundé', '5', 2, true),
  player('a3', 'Dayot Upamecano', 'Upamecano', '4', 3, true),
  player('a4', 'William Saliba', 'Saliba', '17', 4, true),
  player('a5', 'Theo Hernández', 'T. Hernández', '22', 5, true),
  // Midfielders (4)
  player('a6', 'Aurélien Tchouaméni', 'Tchouaméni', '8', 6, true),
  player('a7', 'Adrien Rabiot', 'Rabiot', '14', 7, true, "72'"),
  player('a8', 'Antoine Griezmann', 'Griezmann', '7', 8, true),
  player('a9', 'Ousmane Dembélé', 'Dembélé', '11', 9, true),
  // Forwards (2)
  player('a10', 'Kylian Mbappé', 'Mbappé', '10', 10, true),
  player('a11', 'Randal Kolo Muani', 'Kolo Muani', '9', 11, true, "81'")
];

const awayBench = [
  player('a12', 'Alphonse Areola', 'Areola', '23', 0, false),
  player('a13', 'Brice Samba', 'Samba', '1', 0, false),
  player('a14', 'Benjamin Pavard', 'Pavard', '2', 0, false),
  player('a15', 'Ibrahima Konaté', 'Konaté', '3', 0, false),
  player('a16', 'Eduardo Camavinga', 'Camavinga', '6', 0, false, undefined, "72'"),
  player('a17', 'Youssouf Fofana', 'Fofana', '15', 0, false),
  player('a18', 'Warren Zaïre-Emery', 'Zaïre-Emery', '20', 0, false),
  player('a19', 'Marcus Thuram', 'Thuram', '19', 0, false, undefined, "81'"),
  player('a20', 'Kingsley Coman', 'Coman', '18', 0, false),
  player('a21', 'Christopher Nkunku', 'Nkunku', '13', 0, false),
  player('a22', 'Bradley Barcola', 'Barcola', '21', 0, false),
  player('a23', 'Matteo Guendouzi', 'Guendouzi', '12', 0, false)
];

// ── Export ────────────────────────────────────────────────────────────────────

export const MOCK_LINEUPS: MatchLineups = {
  available: true,
  home: {
    formation: { summary: '4-3-3', name: '4-3-3', numRows: 3 },
    starters: homeStarters,
    bench: homeBench
  },
  away: {
    formation: { summary: '4-4-2', name: '4-4-2', numRows: 3 },
    starters: awayStarters,
    bench: awayBench
  }
};
