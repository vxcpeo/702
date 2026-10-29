<script setup>
defineProps({
  name: { type: String, default: "arrow" },
  size: { type: [Number, String], default: 18 },
});
/*
 * A fine-line icon family for the night sheet: rounded caps, a 1.4 stroke on a
 * 24-unit grid, and no glyph borrowed from an earlier edition. Decorative only;
 * every control carries its own text or accessible name.
 */
const paths = {
  arrow: "M4 12h15.5 M13.5 6l6.5 6-6.5 6",
  arrowleft: "M20 12H4.5 M10.5 6 4 12l6.5 6",
  arrowup: "M12 20V4.5 M6 10.5 12 4l6 6.5",
  external: "M13.5 4H20v6.5 M20 4l-8.5 8.5 M11 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V13",
  plus: "M12 4.5v15 M4.5 12h15",
  minus: "M4.5 12h15",
  close: "m6 6 12 12 M18 6 6 18",
  search: "M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4 M16.2 16.2 21 21",
  menu: "M4 7.5h16 M4 12h16 M4 16.5h10",
  bookmark: "M6.5 4h11a1 1 0 0 1 1 1v16l-6.5-4.2L5.5 21V5a1 1 0 0 1 1-1Z",
  wallet: "M19.5 8.5V6A1.5 1.5 0 0 0 18 4.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h13a1.5 1.5 0 0 0 1.5-1.5v-2.5 M20.5 8.5h-5a3 3 0 0 0 0 6h5a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z M16.5 11.5h.01",
  book: "M3.5 4.5h6.5A4 4 0 0 1 14 8.5v11a3.2 3.2 0 0 0-3.2-3.2H3.5Z M20.5 4.5H14A4 4 0 0 0 10 8.5v11a3.2 3.2 0 0 1 3.2-3.2h7.3Z",
  ledger: "M5 3.5h14v17H5Z M9 3.5v17 M12.5 8h4 M12.5 12h4 M12.5 16h4",
  scale: "M12 3.5v17 M7.5 20.5h9 M3.5 8h17 M3.5 8 1.5 14h6Z M20.5 8l-2 6h6Z M6 14a4 4 0 0 0 7 0 M15 14a4 4 0 0 0 7 0",
  link: "M9.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1 1 M14.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1-1",
  check: "m4.5 12.5 4.5 4L19.5 6",
  info: "M12 10.5v6 M12 7.2h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  refresh: "M20 8V4l-1.6 1.6A8 8 0 0 0 4.6 9.5 M4 16v4l1.6-1.6a8 8 0 0 0 13.8-3.9",
  download: "M12 3.5v11 M7 10.5l5 5 5-5 M3.5 16.5v3a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-3",
  quote: "M5 17.5c0-4 1.8-7.1 5.5-9l.8 1.6C8.8 11.3 7.8 13 7.7 14.6H10v5.4H5Z M14 17.5c0-4 1.8-7.1 5.5-9l.8 1.6c-2.5 1.2-3.5 2.9-3.6 4.5H19v5.4h-5Z",
  dot: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name] || paths.arrow" />
  </svg>
</template>
