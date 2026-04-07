import argentinaFlag from '../../assets/flags/argentina.svg';
import australiaFlag from '../../assets/flags/australia.svg';
import austriaFlag from '../../assets/flags/austria.svg';
import belgiumFlag from '../../assets/flags/belgium.svg';
import bosniaFlag from '../../assets/flags/bosnia-herzegovina.svg';
import brazilFlag from '../../assets/flags/brazil.svg';
import caboVerdeFlag from '../../assets/flags/cape-verde.svg';
import canadaFlag from '../../assets/flags/canada.svg';
import colombiaFlag from '../../assets/flags/colombia.svg';
import congoDrFlag from '../../assets/flags/democratic-republic-of-congo.svg';
import croatiaFlag from '../../assets/flags/croatia.svg';
import curacaoFlag from '../../assets/flags/curacao.svg';
import czechiaFlag from '../../assets/flags/czechia.svg';
import ecuadorFlag from '../../assets/flags/ecuador.svg';
import egyptFlag from '../../assets/flags/egypt.svg';
import englandFlag from '../../assets/flags/england.svg';
import franceFlag from '../../assets/flags/france.svg';
import germanyFlag from '../../assets/flags/germany.svg';
import ghanaFlag from '../../assets/flags/ghana.svg';
import haitiFlag from '../../assets/flags/haiti.svg';
import iranFlag from '../../assets/flags/iran.svg';
import iraqFlag from '../../assets/flags/iraq.svg';
import japanFlag from '../../assets/flags/japan.svg';
import jordanFlag from '../../assets/flags/jordan.svg';
import mexicoFlag from '../../assets/flags/mexico.svg';
import moroccoFlag from '../../assets/flags/morocco.svg';
import netherlandsFlag from '../../assets/flags/netherlands.svg';
import newZealandFlag from '../../assets/flags/new-zealand.svg';
import norwayFlag from '../../assets/flags/norway.svg';
import panamaFlag from '../../assets/flags/panama.svg';
import paraguayFlag from '../../assets/flags/paraguay.svg';
import portugalFlag from '../../assets/flags/portugal.svg';
import qatarFlag from '../../assets/flags/qatar.svg';
import saudiArabiaFlag from '../../assets/flags/saudi-arabia.svg';
import scotlandFlag from '../../assets/flags/scotland.svg';
import senegalFlag from '../../assets/flags/senegal.svg';
import southAfricaFlag from '../../assets/flags/south-africa.svg';
import southKoreaFlag from '../../assets/flags/south-korea.svg';
import spainFlag from '../../assets/flags/spain.svg';
import swedenFlag from '../../assets/flags/sweden.svg';
import switzerlandFlag from '../../assets/flags/switzerland.svg';
import tunisiaFlag from '../../assets/flags/tunisia.svg';
import turkeyFlag from '../../assets/flags/turkey.svg';
import uruguayFlag from '../../assets/flags/uruguay.svg';
import usaFlag from '../../assets/flags/usa.svg';
import uzbekistanFlag from '../../assets/flags/uzbekistan.svg';
import algeriaFlag from '../../assets/flags/algeria.svg';
import ivoryCoastFlag from '../../assets/flags/ivory-coast.svg';

export const teamFlagMap: Record<string, string> = {
  ALG: algeriaFlag,
  ARG: argentinaFlag,
  AUS: australiaFlag,
  AUT: austriaFlag,
  BEL: belgiumFlag,
  BIH: bosniaFlag,
  BRA: brazilFlag,
  CAN: canadaFlag,
  CIV: ivoryCoastFlag,
  COL: colombiaFlag,
  COD: congoDrFlag,
  CPV: caboVerdeFlag,
  CRO: croatiaFlag,
  CUW: curacaoFlag,
  CZE: czechiaFlag,
  ECU: ecuadorFlag,
  EGY: egyptFlag,
  ENG: englandFlag,
  FRA: franceFlag,
  GER: germanyFlag,
  GHA: ghanaFlag,
  HAI: haitiFlag,
  IRN: iranFlag,
  IRQ: iraqFlag,
  JPN: japanFlag,
  JOR: jordanFlag,
  KOR: southKoreaFlag,
  MAR: moroccoFlag,
  MEX: mexicoFlag,
  NED: netherlandsFlag,
  NOR: norwayFlag,
  NZL: newZealandFlag,
  PAN: panamaFlag,
  PAR: paraguayFlag,
  POR: portugalFlag,
  QAT: qatarFlag,
  KSA: saudiArabiaFlag,
  SCO: scotlandFlag,
  SEN: senegalFlag,
  RSA: southAfricaFlag,
  ESP: spainFlag,
  SUI: switzerlandFlag,
  SWE: swedenFlag,
  TUN: tunisiaFlag,
  TUR: turkeyFlag,
  URU: uruguayFlag,
  USA: usaFlag,
  UZB: uzbekistanFlag
};

export function getFlagSrcByTeamCode(teamCode?: string | null) {
  if (!teamCode) return null;
  return teamFlagMap[teamCode.toUpperCase()] ?? null;
}
