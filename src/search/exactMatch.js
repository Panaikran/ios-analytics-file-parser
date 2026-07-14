export function isValidMatchRange(range, textLength) {
  return Number.isInteger(range?.start)
    && Number.isInteger(range?.end)
    && range.start >= 0
    && range.end > range.start
    && range.end <= textLength;
}

export function getExactMatchTargetId(region, occurrenceIndex) {
  if (!Number.isInteger(region?.sectionIndex) || !Number.isInteger(region?.regionIndex) || !Number.isInteger(occurrenceIndex)) {
    return '';
  }

  return `exact-match-${region.sectionIndex}-${region.regionIndex}-${occurrenceIndex}`;
}

export function createExactMatchTargets(matchRegions = []) {
  if (!Array.isArray(matchRegions)) return [];

  const targets = [];
  for (const [regionIndex, region] of matchRegions.entries()) {
    if (!region || !Array.isArray(region.occurrences)) continue;

    for (const [occurrenceIndex, occurrence] of region.occurrences.entries()) {
      if (!isValidMatchRange(occurrence, Number.MAX_SAFE_INTEGER)) continue;

      const targetRegion = { ...region, regionIndex };
      const id = getExactMatchTargetId(targetRegion, occurrenceIndex);
      if (!id) continue;

      targets.push(Object.freeze({
        id,
        sectionIndex: region.sectionIndex,
        sectionId: region.sectionId,
        kind: region.kind,
        regionIndex,
        occurrenceIndex,
        start: occurrence.start,
        end: occurrence.end,
      }));
    }
  }

  return targets;
}
