import { markCurrentSectionNav, renderSectionNav } from './renderSectionNav.js';

const DESKTOP_QUERY = '(min-width: 64rem)';

export function createWorkspaceNavigation({
  desktopNav,
  mobileNav,
  dialog,
  trigger,
  closeButton,
  fallbackFocus,
}) {
  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  let sectionIds = [];
  let currentSectionId = '';
  let observer = null;
  let pendingSectionFocus = '';
  let focusDesktopAfterClose = false;
  let suppressFocusReturn = false;

  function markCurrent(sectionId) {
    if (!sectionIds.includes(sectionId)) return;
    currentSectionId = sectionId;
    markCurrentSectionNav(desktopNav, sectionId);
    markCurrentSectionNav(mobileNav, sectionId);
  }

  function focusSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const heading = target.querySelector('[data-section-heading]');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function handleNavigate(sectionId) {
    markCurrent(sectionId);
    pendingSectionFocus = sectionId;

    if (dialog.open) {
      dialog.close();
    } else {
      queueMicrotask(() => {
        const targetId = pendingSectionFocus;
        pendingSectionFocus = '';
        focusSection(targetId);
      });
    }
  }

  function syncResponsiveMode() {
    const hasSections = sectionIds.length > 0;
    desktopNav.hidden = !hasSections || !desktopMedia.matches;
    trigger.hidden = !hasSections || desktopMedia.matches;

    if (desktopMedia.matches && dialog.open) {
      focusDesktopAfterClose = true;
      dialog.close();
    }
  }

  function observeSections() {
    observer?.disconnect();
    observer = null;

    const targets = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;

    const visibleTargets = new Map();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleTargets.set(entry.target.id, entry);
        else visibleTargets.delete(entry.target.id);
      }

      const next = [...visibleTargets.values()].sort((left, right) => {
        const leftBelowTop = left.boundingClientRect.top >= 0 ? 0 : 1;
        const rightBelowTop = right.boundingClientRect.top >= 0 ? 0 : 1;
        return leftBelowTop - rightBelowTop || Math.abs(left.boundingClientRect.top) - Math.abs(right.boundingClientRect.top);
      })[0];

      if (next) markCurrent(next.target.id);
    }, {
      rootMargin: '-12% 0px -68% 0px',
      threshold: [0, 0.25],
    });

    for (const target of targets) observer.observe(target);
  }

  function update(sections) {
    const dialogWasOpen = dialog.open;
    if (dialogWasOpen) {
      suppressFocusReturn = true;
      dialog.close();
    }

    sectionIds = sections.map((section) => section.id);
    if (!sectionIds.includes(currentSectionId)) currentSectionId = sectionIds[0] ?? '';

    const options = { onNavigate: handleNavigate };
    renderSectionNav(desktopNav, sections, options);
    renderSectionNav(mobileNav, sections, options);
    if (currentSectionId) markCurrent(currentSectionId);

    syncResponsiveMode();
    observeSections();

    if (dialogWasOpen) {
      const nextFocus = trigger.hidden ? fallbackFocus : trigger;
      nextFocus?.focus();
    }
  }

  trigger.addEventListener('click', () => {
    if (!sectionIds.length || dialog.open) return;
    dialog.showModal();
    const currentLink = [...mobileNav.querySelectorAll('.section-nav__link')]
      .find((link) => link.dataset.sectionId === currentSectionId);
    (currentLink ?? mobileNav.querySelector('.section-nav__link'))?.focus();
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    dialog.close();
  });

  dialog.addEventListener('close', () => {
    if (suppressFocusReturn) {
      suppressFocusReturn = false;
      return;
    }

    if (pendingSectionFocus) {
      const targetId = pendingSectionFocus;
      pendingSectionFocus = '';
      queueMicrotask(() => focusSection(targetId));
      return;
    }

    if (focusDesktopAfterClose) {
      focusDesktopAfterClose = false;
      const currentLink = [...desktopNav.querySelectorAll('.section-nav__link')]
        .find((link) => link.dataset.sectionId === currentSectionId);
      currentLink?.focus();
      return;
    }

    if (!trigger.hidden) trigger.focus();
  });

  desktopMedia.addEventListener('change', syncResponsiveMode);

  return { update, markCurrent };
}
