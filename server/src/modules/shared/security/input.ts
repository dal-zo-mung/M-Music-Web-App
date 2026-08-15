const DANGEROUS_OBJECT_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function assertNoDangerousKeys(value: unknown, path = "payload"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoDangerousKeys(item, `${path}[${index}]`);
    });
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (
      key.startsWith("$") ||
      key.includes(".") ||
      DANGEROUS_OBJECT_KEYS.has(key)
    ) {
      const error = new Error(
        `Unsafe request structure detected at ${path}.${key}.`,
      ) as Error & {
        statusCode?: number;
      };
      error.statusCode = 400;
      throw error;
    }

    assertNoDangerousKeys(nestedValue, `${path}.${key}`);
  });
}

function stripControlCharacters(
  value: string,
  options: { preserveNewlines?: boolean } = {},
): string {
  const withoutNullBytes = value.replace(/\u0000/g, "");

  if (options.preserveNewlines) {
    return withoutNullBytes.replace(/[^\P{Cc}\n\t]/gu, "");
  }

  return withoutNullBytes.replace(/[^\P{Cc}\t]/gu, "");
}

export function normalizePlainText(
  value: unknown,
  options: {
    maxLength: number;
    preserveNewlines?: boolean;
  },
): string {
  const rawValue = typeof value === "string" ? value : "";
  const trimmedValue = stripControlCharacters(rawValue, {
    preserveNewlines: options.preserveNewlines,
  }).trim();

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.length > options.maxLength
    ? trimmedValue.slice(0, options.maxLength)
    : trimmedValue;
}

export function normalizeOptionalPlainText(
  value: unknown,
  options: {
    maxLength: number;
    preserveNewlines?: boolean;
  },
): string {
  return normalizePlainText(value, options);
}

export function normalizeLyrics(value: unknown): string[] {
  const text = normalizePlainText(value, {
    maxLength: 12_000,
    preserveNewlines: true,
  });

  if (!text) {
    return [];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .slice(0, 400);

  const normalizedLines: string[] = [];
  let previousWasBlank = false;

  lines.forEach((line) => {
    const cleanedLine = line.slice(0, 300);
    const isBlank = cleanedLine.trim().length === 0;

    if (isBlank) {
      if (!previousWasBlank) {
        normalizedLines.push("");
      }
      previousWasBlank = true;
      return;
    }

    previousWasBlank = false;
    normalizedLines.push(cleanedLine);
  });

  return normalizedLines;
}
