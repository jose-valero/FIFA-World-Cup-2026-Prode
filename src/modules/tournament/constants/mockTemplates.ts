import type { Match } from '../../matches/types/types';
import { createTemplateMatch } from '../utils/createTemplateMatch';
import { gp, loser, third, winner } from '../utils/groupPositions';

export const KNOCKOUT_TEMPLATE: Match[] = [
  // LEFT SIDE - Round of 32
  createTemplateMatch({ id: '74', stage: 'round_of_32', home: gp('E', 1), away: third('ABCDF') }),
  createTemplateMatch({ id: '77', stage: 'round_of_32', home: gp('I', 1), away: third('CDFGH') }),
  createTemplateMatch({ id: '73', stage: 'round_of_32', home: gp('A', 2), away: gp('B', 2) }),
  createTemplateMatch({ id: '75', stage: 'round_of_32', home: gp('F', 1), away: gp('C', 2) }),

  createTemplateMatch({ id: '83', stage: 'round_of_32', home: gp('K', 2), away: gp('L', 2) }),
  createTemplateMatch({ id: '84', stage: 'round_of_32', home: gp('H', 1), away: gp('J', 2) }),
  createTemplateMatch({ id: '81', stage: 'round_of_32', home: gp('D', 1), away: third('BEFIJ') }),
  createTemplateMatch({ id: '82', stage: 'round_of_32', home: gp('G', 1), away: third('AEHIJ') }),

  // RIGHT SIDE - Round of 32
  createTemplateMatch({ id: '76', stage: 'round_of_32', home: gp('C', 1), away: gp('F', 2) }),
  createTemplateMatch({ id: '78', stage: 'round_of_32', home: gp('E', 2), away: gp('I', 2) }),
  createTemplateMatch({ id: '79', stage: 'round_of_32', home: gp('A', 1), away: third('CEFHI') }),
  createTemplateMatch({ id: '80', stage: 'round_of_32', home: gp('L', 1), away: third('EHIJK') }),

  createTemplateMatch({ id: '86', stage: 'round_of_32', home: gp('J', 1), away: gp('H', 2) }),
  createTemplateMatch({ id: '88', stage: 'round_of_32', home: gp('D', 2), away: gp('G', 2) }),
  createTemplateMatch({ id: '85', stage: 'round_of_32', home: gp('B', 1), away: third('EFGIJ') }),
  createTemplateMatch({ id: '87', stage: 'round_of_32', home: gp('K', 1), away: third('DEIJL') }),

  // Round of 16
  createTemplateMatch({ id: '89', stage: 'round_of_16', home: winner('74'), away: winner('77') }),
  createTemplateMatch({ id: '90', stage: 'round_of_16', home: winner('73'), away: winner('75') }),
  createTemplateMatch({ id: '93', stage: 'round_of_16', home: winner('83'), away: winner('84') }),
  createTemplateMatch({ id: '94', stage: 'round_of_16', home: winner('81'), away: winner('82') }),

  createTemplateMatch({ id: '91', stage: 'round_of_16', home: winner('76'), away: winner('78') }),
  createTemplateMatch({ id: '92', stage: 'round_of_16', home: winner('79'), away: winner('80') }),
  createTemplateMatch({ id: '95', stage: 'round_of_16', home: winner('86'), away: winner('88') }),
  createTemplateMatch({ id: '96', stage: 'round_of_16', home: winner('85'), away: winner('87') }),

  // Quarterfinals
  createTemplateMatch({ id: '97', stage: 'quarterfinals', home: winner('89'), away: winner('90') }),
  createTemplateMatch({ id: '98', stage: 'quarterfinals', home: winner('93'), away: winner('94') }),
  createTemplateMatch({ id: '99', stage: 'quarterfinals', home: winner('91'), away: winner('92') }),
  createTemplateMatch({ id: '100', stage: 'quarterfinals', home: winner('95'), away: winner('96') }),

  // Semifinals
  createTemplateMatch({ id: '101', stage: 'semifinals', home: winner('97'), away: winner('98') }),
  createTemplateMatch({ id: '102', stage: 'semifinals', home: winner('99'), away: winner('100') }),

  // Third place + Final
  createTemplateMatch({ id: '103', stage: 'third_place', home: loser('101'), away: loser('102') }),
  createTemplateMatch({ id: '104', stage: 'final', home: winner('101'), away: winner('102') })
];
