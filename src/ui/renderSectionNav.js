export function createSectionNavItems(sections) {
  return sections.map((section) => ({
    id: section.id,
    label: section.title,
    href: `#${section.id}`,
  }));
}

export function renderSectionNav(element, sections, { onNavigate = null } = {}) {
  const items = createSectionNavItems(sections);
  element.hidden = items.length === 0;

  if (!items.length) {
    element.replaceChildren();
    return;
  }

  const title = document.createElement('span');
  title.className = 'section-nav__label';
  title.textContent = 'Sections';

  const list = document.createElement('div');
  list.className = 'section-nav__links';

  const links = items.map((item, index) => {
    const link = document.createElement('a');
    link.className = 'section-nav__link';
    link.href = item.href;
    link.textContent = item.label;
    link.dataset.sectionId = item.id;
    if (index === 0) link.setAttribute('aria-current', 'location');
    link.addEventListener('click', (event) => {
      markCurrentLink(list, link);
      onNavigate?.(item.id, event);
    });
    return link;
  });

  list.append(...links);
  element.replaceChildren(title, list);
}

export function markCurrentSectionNav(element, sectionId) {
  for (const link of element.querySelectorAll('.section-nav__link')) {
    if (link.dataset.sectionId === sectionId) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

function markCurrentLink(container, activeLink) {
  for (const link of container.querySelectorAll('.section-nav__link')) {
    if (link === activeLink) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}
