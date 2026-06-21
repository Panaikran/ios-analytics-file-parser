import { createSection } from '../models/sectionModel.js';

export function parsePanicStub() {
  return [
    createSection({
      id: 'panic-placeholder',
      title: 'Panic-full Recognized',
      priority: 'warning',
      raw: 'Panic-full file recognized. Full panic rendering is planned for Phase 2.',
    }),
  ];
}
