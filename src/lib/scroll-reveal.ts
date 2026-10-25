const revealSelector = '[data-scroll-reveal]';
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsIntersectionObserver = 'IntersectionObserver' in window;
let observer: IntersectionObserver | null = null;

function show(element: HTMLElement): void {
  element.dataset.scrollRevealState = 'visible';
  observer?.unobserve(element);
}

function getObserver(): IntersectionObserver | null {
  if (motionPreference.matches || !supportsIntersectionObserver) return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            show(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
  }
  return observer;
}

function prepare(element: HTMLElement): void {
  if (element.dataset.scrollRevealState) return;

  const siblings = element.parentElement
    ? Array.from(element.parentElement.children).filter((child) => child.matches(revealSelector))
    : [];
  const order = Math.max(0, siblings.indexOf(element));
  element.style.setProperty('--scroll-reveal-delay', `${Math.min(order, 4) * 65}ms`);

  const bounds = element.getBoundingClientRect();
  const alreadyVisible = bounds.top <= window.innerHeight * 0.92 && bounds.bottom > 0;
  const activeObserver = getObserver();
  if (motionPreference.matches || !activeObserver || alreadyVisible) {
    show(element);
    return;
  }

  element.dataset.scrollRevealState = 'pending';
  activeObserver.observe(element);
}

function prepareWithin(node: Node): void {
  if (!(node instanceof HTMLElement)) return;
  if (node.matches(revealSelector)) prepare(node);
  node.querySelectorAll<HTMLElement>(revealSelector).forEach(prepare);
}

if (document.documentElement.dataset.scrollRevealInitialized !== 'true') {
  document.documentElement.dataset.scrollRevealInitialized = 'true';
  document.querySelectorAll<HTMLElement>(revealSelector).forEach(prepare);

  const additions = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach(prepareWithin);
    }
  });
  additions.observe(document.body, { childList: true, subtree: true });

  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    observer?.disconnect();
    document.querySelectorAll<HTMLElement>(revealSelector).forEach(show);
  });
}
