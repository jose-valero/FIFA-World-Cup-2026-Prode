import algeriaCrest from '../../assets/crests/national-teams/algeria.png';
import argentinaCrest from '../../assets/crests/national-teams/argentina.png';
import australiaCrest from '../../assets/crests/national-teams/australia.png';
import austriaCrest from '../../assets/crests/national-teams/austria.png';
import belgiumCrest from '../../assets/crests/national-teams/belgium.png';
import bosniaCrest from '../../assets/crests/national-teams/bosnia-and-herzegovina.png';
import brazilCrest from '../../assets/crests/national-teams/brazil.png';
import caboVerdeCrest from '../../assets/crests/national-teams/cabo-verde.png';
import canadaCrest from '../../assets/crests/national-teams/canada.png';
import colombiaCrest from '../../assets/crests/national-teams/colombia.png';
import congoDrCrest from '../../assets/crests/national-teams/congo-dr.png';
import ivoryCoastCrest from '../../assets/crests/national-teams/cote-divoire.png';
import croatiaCrest from '../../assets/crests/national-teams/croatia.png';
import curacaoCrest from '../../assets/crests/national-teams/curacao.png';
import czechiaCrest from '../../assets/crests/national-teams/czechia.png';
import ecuadorCrest from '../../assets/crests/national-teams/ecuador.png';
import egyptCrest from '../../assets/crests/national-teams/egypt.png';
import englandCrest from '../../assets/crests/national-teams/england.png';
import franceCrest from '../../assets/crests/national-teams/france.png';
import germanyCrest from '../../assets/crests/national-teams/germany.png';
import ghanaCrest from '../../assets/crests/national-teams/ghana.png';
import haitiCrest from '../../assets/crests/national-teams/haiti.png';
import iranCrest from '../../assets/crests/national-teams/ir-iran.png';
import iraqCrest from '../../assets/crests/national-teams/iraq.png';
import japanCrest from '../../assets/crests/national-teams/japan.png';
import jordanCrest from '../../assets/crests/national-teams/jordan.png';
import southKoreaCrest from '../../assets/crests/national-teams/korea-republic.png';
import mexicoCrest from '../../assets/crests/national-teams/mexico.png';
import moroccoCrest from '../../assets/crests/national-teams/morocco.png';
import netherlandsCrest from '../../assets/crests/national-teams/netherlands.png';
import newZealandCrest from '../../assets/crests/national-teams/new-zealand.png';
import norwayCrest from '../../assets/crests/national-teams/norway.png';
import panamaCrest from '../../assets/crests/national-teams/panama.png';
import paraguayCrest from '../../assets/crests/national-teams/paraguay.png';
import portugalCrest from '../../assets/crests/national-teams/portugal.png';
import qatarCrest from '../../assets/crests/national-teams/qatar.png';
import saudiArabiaCrest from '../../assets/crests/national-teams/saudi-arabia.png';
import scotlandCrest from '../../assets/crests/national-teams/scotland.png';
import senegalCrest from '../../assets/crests/national-teams/senegal.png';
import southAfricaCrest from '../../assets/crests/national-teams/south-africa.png';
import spainCrest from '../../assets/crests/national-teams/spain.png';
import swedenCrest from '../../assets/crests/national-teams/sweden.png';
import switzerlandCrest from '../../assets/crests/national-teams/switzerland.png';
import tunisiaCrest from '../../assets/crests/national-teams/tunisia.png';
import turkeyCrest from '../../assets/crests/national-teams/turkiye.png';
import uruguayCrest from '../../assets/crests/national-teams/uruguay.png';
import usaCrest from '../../assets/crests/national-teams/usa.png';
import uzbekistanCrest from '../../assets/crests/national-teams/uzbekistan.png';

export const teamCrestMap: Record<string, string> = {
  ALG: algeriaCrest,
  ARG: argentinaCrest,
  AUS: australiaCrest,
  AUT: austriaCrest,
  BEL: belgiumCrest,
  BIH: bosniaCrest,
  BRA: brazilCrest,
  CAN: canadaCrest,
  CIV: ivoryCoastCrest,
  COL: colombiaCrest,
  COD: congoDrCrest,
  CPV: caboVerdeCrest,
  CRO: croatiaCrest,
  CUW: curacaoCrest,
  CZE: czechiaCrest,
  ECU: ecuadorCrest,
  EGY: egyptCrest,
  ENG: englandCrest,
  FRA: franceCrest,
  GER: germanyCrest,
  GHA: ghanaCrest,
  HAI: haitiCrest,
  IRN: iranCrest,
  IRQ: iraqCrest,
  JPN: japanCrest,
  JOR: jordanCrest,
  KOR: southKoreaCrest,
  MAR: moroccoCrest,
  MEX: mexicoCrest,
  NED: netherlandsCrest,
  NOR: norwayCrest,
  NZL: newZealandCrest,
  PAN: panamaCrest,
  PAR: paraguayCrest,
  POR: portugalCrest,
  QAT: qatarCrest,
  KSA: saudiArabiaCrest,
  SCO: scotlandCrest,
  SEN: senegalCrest,
  RSA: southAfricaCrest,
  ESP: spainCrest,
  SUI: switzerlandCrest,
  SWE: swedenCrest,
  TUN: tunisiaCrest,
  TUR: turkeyCrest,
  URU: uruguayCrest,
  USA: usaCrest,
  UZB: uzbekistanCrest
};

export function getCrestSrcByTeamCode(teamCode?: string | null) {
  if (!teamCode) return null;
  return teamCrestMap[teamCode.toUpperCase()] ?? null;
}
