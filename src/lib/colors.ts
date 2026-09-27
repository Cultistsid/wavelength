// Participant hues: distinct, all readable on the deep-navy base.
export const USER_COLORS = [
  '#FF7A90', // rose
  '#5EEAD4', // aqua
  '#FFD166', // sun
  '#A78BFA', // violet
  '#7DD3FC', // sky
  '#FDBA74', // apricot
  '#86EFAC', // mint
  '#F0ABFC', // orchid
];

export const getRandomColor = (): string =>
  USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

// Connection strength warms from violet (tentative) through aqua to amber (locked in).
export const strengthColor = (strength: number): string => {
  if (strength >= 0.7) return '#FFB86B';
  if (strength >= 0.4) return '#2DD4BF';
  return '#7C6CFF';
};

export const vibeColor = (score: number): string => strengthColor(score / 100);

export const vibeLabel = (score: number): string => {
  if (score >= 80) return 'Locked in';
  if (score >= 60) return 'Good energy';
  if (score >= 40) return 'Finding the frequency';
  return 'Warming up';
};
