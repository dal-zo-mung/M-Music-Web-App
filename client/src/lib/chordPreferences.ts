import { keyFingerprint, validateKey, type SongKey } from "@m-music/chord-core";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function readSongKey(
  storage: StorageLike | null,
  id: string,
  original: SongKey,
): SongKey {
  try {
    const value = JSON.parse(storage?.getItem(`mMusic.key.${id}`) ?? "null");
    const key = value && validateKey(value.targetKey);
    return key &&
      value.originalKeyFingerprint === keyFingerprint(original) &&
      key.mode === original.mode
      ? key
      : original;
  } catch {
    return original;
  }
}
export function storeSongKey(
  storage: StorageLike | null,
  id: string,
  original: SongKey,
  target: SongKey,
): void {
  try {
    if (keyFingerprint(original) === keyFingerprint(target))
      storage?.removeItem(`mMusic.key.${id}`);
    else
      storage?.setItem(
        `mMusic.key.${id}`,
        JSON.stringify({
          targetKey: target,
          originalKeyFingerprint: keyFingerprint(original),
        }),
      );
  } catch {
    /* Reading remains usable when storage is unavailable. */
  }
}
