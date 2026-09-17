/** Small original SVG line-art system. Decorative only; text supplies labels. */
const paths={
 home:'M4 11 12 4l8 7M6 10v10h12V10M10 20v-6h4v6M14 5V3h3v4',
 journal:'M12 21v-9m0 5C4 18 4 13 5 12c4 0 7 3 7 5Zm0-4c0-3 3-6 7-6 1 4-2 6-7 6ZM12 4v2m0-2c-6-4-7 4-2 4m2-4c6-4 7 4 2 4',
 studio:'M4 19h16M8 19l4-15 4 15M5 7h14v9H5ZM9 13l3-3 3 3',
 lab:'M7 21l2-13h6l2 13M6 21h12M8 4l4-3 4 3M8 4v4h8V4M9 14h6M12 5v1',
 library:'M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1ZM12 6v14M6 9l3 1m6 0 3-1M6 13l3 1m6 0 3-1',
 observatory:'M3 14a9 9 0 0 1 18 0v6H3ZM12 5v15M3 14h18M15 9l5-5 2 2-5 5M6 20v-3h3v3',
 mail:'M3 6h18v14H3ZM3 6l9 8 9-8M3 20l6-8m12 8-6-8M7 3h10',
 camp:'M2 21 12 3l10 18ZM8 21l4-8 4 8M5 2v2m-1-1h2M20 6v2m-1-1h2',
 sun:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
 moon:'M19 15a8 8 0 0 1-10-10A8.5 8.5 0 1 0 19 15ZM17 3v4m-2-2h4'
};
export function iconSvg(id){return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]||paths.home}"/></svg>`;}
export function postcardMiniature(id){const path=paths[id]||paths.home;return `<g transform="translate(70 60)"><circle cx="140" cy="115" r="110" fill="#d8c99e"/><path d="M-30 180Q50 80 150 172T330 176V300H-30" fill="#a4ba89"/><path d="M-30 225Q120 137 330 229V320H-30" fill="#6e9574"/><g transform="translate(50 0) scale(8)" stroke="#375b49" stroke-width=".7" fill="#f9e5b4" stroke-linejoin="round" stroke-linecap="round"><path d="${path}"/></g></g>`;}
