import { classifyDiagnostic } from './classifyDiagnostic.js';

export function detectFileType(input) {
  return classifyDiagnostic(input).legacyType;
}
