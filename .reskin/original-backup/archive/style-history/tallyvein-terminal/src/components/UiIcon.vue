<script setup>
defineProps({
  name: { type: String, default: "arrow" },
  size: { type: [Number, String], default: 18 },
});
// Hairline terminal icons. Every path is drawn on a 24-unit grid with square
// joins so the glyphs sit on the same grid as the frames and rules.
const paths = {
  arrow: "M4 12h15 M13 6l6 6-6 6",
  arrowleft: "M20 12H5 M11 6l-6 6 6 6",
  external: "M14 3h7v7 M21 3 10 14 M11 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-7",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12 M18 6 6 18",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15 M16 16l5 5",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  grid: "M3 4h18v16H3z M3 10h18 M9 10v10",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  wallet: "M20 8V5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16V8H4a2 2 0 0 1 0-4l12-2v3 M20 12h-6v5h6 M16 14.5h.01",
  book: "M4 4h7a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H4z M20 4h-5a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h6z",
  ledger: "M4 3h16v18H4z M8 3v18 M12 8h5 M12 12h5 M12 16h5",
  scale: "M12 3v18 M7 21h10 M4 8h16 M4 8l-2 6h8z M20 8l-2 6h8z M6 14a4 4 0 0 0 8 0 M16 14a4 4 0 0 0 8 0",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  check: "m5 12 4 4L19 6",
  info: "M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  refresh: "M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 14-2l1 2 M4 17l1 2a8 8 0 0 0 14-2",
  download: "M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5",
  terminal: "M3 4h18v16H3z M7 9l3 3-3 3 M13 15h5",
  clock: "M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  network: "M8 6h8 M6 8l5 9 M18 8l-5 9 M8 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M15 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  layers: "m12 3 10 5-10 5L2 8l10-5Z M2 12l10 5 10-5 M2 16l10 5 10-5",
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="square"
    stroke-linejoin="miter"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name] || paths.arrow" />
  </svg>
</template>
