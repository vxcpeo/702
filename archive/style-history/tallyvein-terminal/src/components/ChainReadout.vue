<script setup>
defineProps({
  cluster: { type: String, default: "testnet" },
  slot: { type: [Number, String], default: 0 },
  epoch: { type: [Number, String], default: 0 },
  clock: { type: String, default: "--:--:--" },
  simulated: { type: Boolean, default: true },
  sample: { type: Boolean, default: false },
  live: { type: Boolean, default: false },
});
const pad = (value, width) => String(value).padStart(width, "0");
const group = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
</script>
<template>
  <div class="chain-readout" role="status" aria-label="Chain readout">
    <span class="readout-cell"
      ><span>cluster</span><b>{{ cluster.toUpperCase() }}</b></span
    >
    <span class="readout-cell is-live is-optional"
      ><span>{{ simulated ? "sim slot" : "slot" }}</span
      ><b>{{ group(slot) }}</b></span
    >
    <span class="readout-cell is-optional"
      ><span>epoch</span><b>{{ pad(epoch, 3) }}</b></span
    >
    <span class="readout-cell"
      ><span>utc</span><b>{{ clock }}</b></span
    >
    <span class="readout-cell is-sample"
      ><span>feed</span
      ><b>{{ sample ? "SAMPLE DATA" : live ? "LIVE READ" : "PREVIEW" }}</b></span
    >
  </div>
</template>
