export function parseIpsContainer(input) {
  const text = String(input ?? '').trim();

  try {
    return { body: JSON.parse(text), metadata: null };
  } catch {
    const firstLineBreak = text.indexOf('\n');
    if (firstLineBreak < 0) return null;

    try {
      return {
        metadata: JSON.parse(text.slice(0, firstLineBreak)),
        body: JSON.parse(text.slice(firstLineBreak + 1)),
      };
    } catch {
      return null;
    }
  }
}
