/** The shared sheet every building and menu opens into. */

import { el, escapeHtml, qs } from './dom';

export interface PanelHandle {
  root: HTMLElement;
  body: HTMLElement;
  setSubtitle(text: string): void;
  close(): void;
}

let open: PanelHandle | null = null;

export function openPanel(opts: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  onClose?: () => void;
}): PanelHandle {
  open?.close();

  const root = el(`
    <div class="sheet-scrim" role="dialog" aria-modal="true" aria-label="${escapeHtml(opts.title)}">
      <section class="sheet${opts.wide ? ' sheet--wide' : ''}">
        <header class="sheet__head">
          <div>
            <h2 class="sheet__title">${escapeHtml(opts.title)}</h2>
            <p class="sheet__subtitle">${escapeHtml(opts.subtitle ?? '')}</p>
          </div>
          <button class="sheet__close" type="button" aria-label="Close">&#215;</button>
        </header>
        <div class="sheet__body"></div>
      </section>
    </div>
  `);

  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add('is-open'));

  const handle: PanelHandle = {
    root,
    body: qs(root, '.sheet__body'),
    setSubtitle(text) {
      qs(root, '.sheet__subtitle').textContent = text;
    },
    close() {
      if (open === handle) open = null;
      root.classList.remove('is-open');
      window.removeEventListener('keydown', onKey);
      setTimeout(() => root.remove(), 220);
      opts.onClose?.();
    },
  };

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') handle.close();
  }
  window.addEventListener('keydown', onKey);

  qs(root, '.sheet__close').addEventListener('click', () => handle.close());
  root.addEventListener('click', (e) => {
    if (e.target === root) handle.close();
  });

  open = handle;
  return handle;
}

/** Brief centred message, for hatch results and errors. */
export function toast(message: string, kind: 'info' | 'error' | 'good' = 'info'): void {
  const node = el(`<div class="toast toast--${kind}">${escapeHtml(message)}</div>`);
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-open'));
  setTimeout(() => {
    node.classList.remove('is-open');
    setTimeout(() => node.remove(), 300);
  }, 3200);
}
