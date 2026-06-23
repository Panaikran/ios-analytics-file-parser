export function filterSectionsByQuery(sections, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      active: false,
      query: '',
      totalMatches: 0,
      sections,
    };
  }

  let totalMatches = 0;
  const filteredSections = [];

  for (const section of sections) {
    const result = filterSection(section, normalizedQuery);
    totalMatches += result.matchCount;
    if (result.matchCount > 0) filteredSections.push(result.section);
  }

  return {
    active: true,
    query: normalizedQuery,
    totalMatches,
    sections: filteredSections,
  };
}

function filterSection(section, query) {
  let matchCount = includesQuery(section.title, query) ? 1 : 0;
  matchCount += countFieldMatches(section.fields ?? [], query);
  matchCount += includesQuery(section.raw, query) ? 1 : 0;

  const nextSection = { ...section, forceExpanded: true };

  if (Array.isArray(section.table)) {
    const matchingRows = [];

    for (const row of section.table) {
      const rowMatches = countRowMatches(row, query);
      if (rowMatches > 0) {
        matchingRows.push(row);
        matchCount += rowMatches;
      }
    }

    nextSection.table = matchingRows;
    nextSection.tableSummary = `${matchingRows.length} of ${section.table.length} rows shown`;
  }

  return { section: nextSection, matchCount };
}

function countFieldMatches(fields, query) {
  return fields.reduce((total, field) => {
    const labelMatch = includesQuery(field.label, query) ? 1 : 0;
    const valueMatch = includesQuery(field.value, query) ? 1 : 0;
    return total + labelMatch + valueMatch;
  }, 0);
}

function countRowMatches(row, query) {
  return Object.values(row).reduce((total, value) => total + (includesQuery(value, query) ? 1 : 0), 0);
}

function includesQuery(value, query) {
  return String(value ?? '').toLowerCase().includes(query);
}
