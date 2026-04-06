import { Box, Typography } from '@mui/material';
import type { Match } from '../../matches/types';
import { getStageLabel } from '../stages';
import { KnockoutMatchNode } from './KnockoutMatchNode';

interface KnockoutBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

type PositionedMatch = {
  match: Match;
  x: number;
  y: number;
  width: number;
  height: number;
};

const BOARD_WIDTH = 1760;
const BOARD_HEIGHT = 900;

const SMALL_NODE_WIDTH = 170;
const LARGE_NODE_WIDTH = 186;
const NODE_HEIGHT = 70;

const X = {
  left32: 24,
  left16: 220,
  leftQF: 416,
  leftSF: 612,
  center: 787,
  rightSF: 962,
  rightQF: 1158,
  right16: 1354,
  right32: 1550
};

const Y = {
  left32: [52, 140, 228, 316, 436, 524, 612, 700],
  left16: [96, 272, 480, 657],
  leftQF: [184, 570],
  leftSF: [382],
  final: [306],
  third: [548],
  rightSF: [382],
  rightQF: [184, 580],
  right16: [96, 272, 492, 668],
  right32: [52, 140, 228, 316, 436, 524, 612, 700]
};

const LEFT_ROUND_OF_32 = ['74', '77', '73', '75', '83', '84', '81', '82'];
const LEFT_ROUND_OF_16 = ['89', '90', '93', '94'];
const LEFT_QUARTERS = ['97', '98'];
const LEFT_SEMIS = ['101'];

const RIGHT_ROUND_OF_32 = ['76', '78', '79', '80', '86', '88', '85', '87'];
const RIGHT_ROUND_OF_16 = ['91', '92', '95', '96'];
const RIGHT_QUARTERS = ['99', '100'];
const RIGHT_SEMIS = ['102'];

const FINAL_MATCH = ['104'];
const THIRD_PLACE_MATCH = ['103'];

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

function getById(matches: Match[], id: string) {
  return matches.find((match) => match.id === id) ?? null;
}

function buildPositionedColumn(
  matches: Match[],
  ids: string[],
  x: number,
  ys: number[],
  width = SMALL_NODE_WIDTH
): PositionedMatch[] {
  return ids
    .map((id, index) => {
      const match = getById(matches, id);

      if (!match) {
        return null;
      }

      return {
        match,
        x,
        y: ys[index] ?? 0,
        width,
        height: NODE_HEIGHT
      } satisfies PositionedMatch;
    })
    .filter(Boolean) as PositionedMatch[];
}

function edgePoint(box: PositionedMatch, direction: 'left' | 'right') {
  return {
    x: direction === 'left' ? box.x : box.x + box.width,
    y: box.y + box.height / 2
  };
}

function buildConnectorPath(from: PositionedMatch, to: PositionedMatch, direction: 'ltr' | 'rtl') {
  const source = edgePoint(from, direction === 'ltr' ? 'right' : 'left');
  const target = edgePoint(to, direction === 'ltr' ? 'left' : 'right');

  const gap = Math.abs(target.x - source.x);
  const elbowOffset = Math.max(28, Math.min(56, gap * 0.3));
  const middleX = direction === 'ltr' ? target.x - elbowOffset : target.x + elbowOffset;

  return `M ${source.x} ${source.y} H ${middleX} V ${target.y} H ${target.x}`;
}

function pushRoundConnectors(
  connectors: Array<{ id: string; path: string }>,
  fromNodes: PositionedMatch[],
  toNodes: PositionedMatch[],
  direction: 'ltr' | 'rtl'
) {
  toNodes.forEach((target, index) => {
    const sourceA = fromNodes[index * 2];
    const sourceB = fromNodes[index * 2 + 1];

    if (sourceA) {
      connectors.push({
        id: `${sourceA.match.id}-${target.match.id}-a`,
        path: buildConnectorPath(sourceA, target, direction)
      });
    }

    if (sourceB) {
      connectors.push({
        id: `${sourceB.match.id}-${target.match.id}-b`,
        path: buildConnectorPath(sourceB, target, direction)
      });
    }
  });
}

function pushSingleTargetConnectors(
  connectors: Array<{ id: string; path: string }>,
  fromNodes: PositionedMatch[],
  target: PositionedMatch | undefined,
  direction: 'ltr' | 'rtl',
  suffix: string
) {
  if (!target) {
    return;
  }

  fromNodes.forEach((source, index) => {
    connectors.push({
      id: `${source.match.id}-${target.match.id}-${suffix}-${index}`,
      path: buildConnectorPath(source, target, direction)
    });
  });
}

export function KnockoutBracket({ matches, onMatchClick }: KnockoutBracketProps) {
  const knockoutMatches = sortMatches(matches);

  const left32 = buildPositionedColumn(knockoutMatches, LEFT_ROUND_OF_32, X.left32, Y.left32);
  const left16 = buildPositionedColumn(knockoutMatches, LEFT_ROUND_OF_16, X.left16, Y.left16);
  const leftQF = buildPositionedColumn(knockoutMatches, LEFT_QUARTERS, X.leftQF, Y.leftQF);
  const leftSF = buildPositionedColumn(knockoutMatches, LEFT_SEMIS, X.leftSF, Y.leftSF);

  const right32 = buildPositionedColumn(knockoutMatches, RIGHT_ROUND_OF_32, X.right32, Y.right32);
  const right16 = buildPositionedColumn(knockoutMatches, RIGHT_ROUND_OF_16, X.right16, Y.right16);
  const rightQF = buildPositionedColumn(knockoutMatches, RIGHT_QUARTERS, X.rightQF, Y.rightQF);
  const rightSF = buildPositionedColumn(knockoutMatches, RIGHT_SEMIS, X.rightSF, Y.rightSF);

  const finalMatch = buildPositionedColumn(knockoutMatches, FINAL_MATCH, X.center, Y.final, LARGE_NODE_WIDTH);
  const thirdPlaceMatch = buildPositionedColumn(
    knockoutMatches,
    THIRD_PLACE_MATCH,
    X.center,
    Y.third,
    LARGE_NODE_WIDTH
  );

  const allNodes = [
    ...left32,
    ...left16,
    ...leftQF,
    ...leftSF,
    ...right32,
    ...right16,
    ...rightQF,
    ...rightSF,
    ...finalMatch,
    ...thirdPlaceMatch
  ];

  if (allNodes.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Aún no hay cruces definidos para la fase de eliminación.
      </Typography>
    );
  }

  // const nodeMap = new Map(allNodes.map((node) => [node.match.id, node]));
  const connectors: Array<{ id: string; path: string }> = [];

  pushRoundConnectors(connectors, left32, left16, 'ltr');
  pushRoundConnectors(connectors, left16, leftQF, 'ltr');
  pushRoundConnectors(connectors, leftQF, leftSF, 'ltr');

  pushRoundConnectors(connectors, right32, right16, 'rtl');
  pushRoundConnectors(connectors, right16, rightQF, 'rtl');
  pushRoundConnectors(connectors, rightQF, rightSF, 'rtl');

  pushSingleTargetConnectors(connectors, leftSF, finalMatch[0], 'ltr', 'final-left');
  pushSingleTargetConnectors(connectors, rightSF, finalMatch[0], 'rtl', 'final-right');

  pushSingleTargetConnectors(connectors, leftSF, thirdPlaceMatch[0], 'ltr', 'third-left');
  pushSingleTargetConnectors(connectors, rightSF, thirdPlaceMatch[0], 'rtl', 'third-right');

  return (
    <Box sx={{ overflowX: 'auto', pb: 1 }}>
      <Box
        sx={{
          position: 'relative',
          width: BOARD_WIDTH,
          minWidth: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          mx: 'auto',
          px: 1
        }}
      >
        <svg
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          {connectors.map((connector) => (
            <path
              key={connector.id}
              d={connector.path}
              fill='none'
              stroke='rgba(167, 177, 188, 0.3)'
              strokeWidth='2'
              // strokeLinecap='round'
              strokeLinejoin='round'
            />
          ))}
        </svg>

        <Typography sx={{ position: 'absolute', top: 8, left: X.left32, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('round_of_32')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.left16, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('round_of_16')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.leftQF, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('quarterfinals')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.leftSF, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('semifinals')}
        </Typography>

        <Typography sx={{ position: 'absolute', top: 8, left: X.rightSF, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('semifinals')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.rightQF, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('quarterfinals')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.right16, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('round_of_16')}
        </Typography>
        <Typography sx={{ position: 'absolute', top: 8, left: X.right32, fontSize: 12, color: 'text.secondary' }}>
          {getStageLabel('round_of_32')}
        </Typography>

        <Typography
          sx={{
            position: 'absolute',
            top: 275,
            left: X.center,
            width: LARGE_NODE_WIDTH,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: 'text.secondary'
          }}
        >
          {getStageLabel('final')}
        </Typography>

        <Typography
          sx={{
            position: 'absolute',
            top: 522,
            left: X.center,
            width: LARGE_NODE_WIDTH,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'text.secondary'
          }}
        >
          {getStageLabel('third_place')}
        </Typography>

        {allNodes.map((node) => (
          <Box
            key={node.match.id}
            sx={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height
            }}
          >
            <KnockoutMatchNode match={node.match} onClick={onMatchClick} highlighted={node.match.id === '104'} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
