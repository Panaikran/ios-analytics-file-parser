export function createSectionNavItems(sections) {
  return sections.map((section) => ({
    id: section.id,
    label: section.title,
    href: `#${section.id}`,
  }));
}

export function renderSectionNav(element, sections) {
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
    if (index === 0) link.setAttribute('aria-current', 'true');
    link.addEventListener('click', () => markCurrentLink(list, link));
    return link;
  });

  list.append(...links);
  element.replaceChildren(title, list);
}

function markCurrentLink(container, activeLink) {
  for (const link of container.querySelectorAll('.section-nav__link')) {
    if (link === activeLink) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}
