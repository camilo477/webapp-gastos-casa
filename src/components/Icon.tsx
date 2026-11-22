const shapes = {
  'home': <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
  'inventory': <><rect x="4" y="8" width="16" height="13" rx="2"/><path d="M3 3h18v5H3zM9 12h6"/></>,
  'list': <><rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 4V2h7v2M9 10l1 1 2-2m2 1h3m-8 6 1 1 2-2m2 1h3"/></>,
  'wallet': <><path d="M20 8V5a2 2 0 0 0-2-2L5 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h15V8H5M16 12h6v5h-6z"/></>,
  'camera': <><path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11H2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/></>,
  'plus': <><path d="M12 5v14M5 12h14"/></>,
  'edit': <><path d="m16 3 5 5-12 12-6 1 1-6Zm-1 1 5 5M4 15l5 5"/></>,
  'search': <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
  'check': <><path d="m5 12 4 4L19 6"/></>,
  'receipt': <><path d="M5 3v19l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2Zm4 6h6m-6 4h6m-6 4h3"/></>,
  'warning': <><path d="m12 3 10 18H2Zm0 6v5m0 3v.1"/></>,
  'info': <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,
  'close': <><path d="m6 6 12 12M6 18 18 6"/></>,
  'chevron': <><path d="m6 9 6 6 6-6"/></>,
  'offline': <><path d="m3 3 18 18M2 8a17 17 0 0 1 4-2m4-1a17 17 0 0 1 12 3M5 12a11 11 0 0 1 4-2m5 0a11 11 0 0 1 5 2m-11 4a6 6 0 0 1 8 0m-4 4v.1"/></>,
  'clock': <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
};

export type IconName = keyof typeof shapes;

export function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}
