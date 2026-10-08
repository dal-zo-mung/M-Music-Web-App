export const LIGHT_SONG_DETAIL_COLORS = [
  "#DCEEFF",
  "#E4F4E8",
  "#FFF0D8",
  "#F3E7FB",
  "#FCE6EC",
  "#D9F3F0",
  "#FCE8D5",
  "#F7F2C7",
  "#E4E9FC",
  "#E8F0D8",
] as const;

export const DARK_SONG_DETAIL_COLORS = [
  "#17324D",
  "#173D35",
  "#463318",
  "#35284D",
  "#492936",
  "#154044",
  "#493023",
  "#403A19",
  "#283354",
  "#344021",
] as const;

let lastColorIndex: number | undefined;

/** Draw once when opening a song; keep the index while its theme changes. */
export function getRandomSongDetailColorIndex(
  previousIndex: number | undefined = lastColorIndex,
  random: () => number = Math.random,
): number {
  const count = LIGHT_SONG_DETAIL_COLORS.length;
  const hasPrevious =
    previousIndex !== undefined &&
    Number.isInteger(previousIndex) &&
    previousIndex >= 0 &&
    previousIndex < count;
  const availableCount = hasPrevious ? count - 1 : count;
  let index = Math.min(
    availableCount - 1,
    Math.max(0, Math.floor(random() * availableCount)),
  );

  // Choose uniformly from the other colors without retrying a random draw.
  if (hasPrevious && index >= previousIndex) index += 1;
  lastColorIndex = index;
  return index;
}

export function getSongDetailCardColor(
  colorIndex: number,
  isDarkMode: boolean,
): string {
  const palette = isDarkMode
    ? DARK_SONG_DETAIL_COLORS
    : LIGHT_SONG_DETAIL_COLORS;

  return palette[colorIndex];
}
