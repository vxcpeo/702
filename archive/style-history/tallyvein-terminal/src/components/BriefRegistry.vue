<script setup>
import { ref } from "vue";
import UiIcon from "./UiIcon.vue";

const props = defineProps({
  missions: { type: Array, default: () => [] },
  selectedKey: { type: String, default: "" },
  isSaved: { type: Function, default: () => false },
  loading: Boolean,
  loadError: { type: String, default: "" },
  configured: Boolean,
  refreshing: Boolean,
  viewTitle: { type: String, default: "Board" },
  viewNote: { type: String, default: "" },
  statusFilter: { type: String, default: "all" },
  statusOptions: { type: Array, default: () => [] },
  filtered: Boolean,
  cluster: { type: String, default: "testnet" },
  openCount: { type: Number, default: 0 },
  poolTotal: { type: String, default: "0" },
  savedView: Boolean,
  activityView: Boolean,
  walletConnected: Boolean,
});
const emit = defineEmits(["open", "save", "retry", "reset", "create", "connect"]);

const rowRefs = ref([]);
const setRow = (element, index) => {
  if (element) rowRefs.value[index] = element;
};

function handleRowsKey(event) {
  const last = props.missions.length - 1;
  if (last < 0) return;
  const current = rowRefs.value.indexOf(event.target);
  const positions = {
    ArrowDown: current < 0 ? 0 : Math.min(current + 1, last),
    ArrowUp: current < 0 ? last : Math.max(current - 1, 0),
    Home: 0,
    End: last,
  };
  if (!(event.key in positions)) return;
  event.preventDefault();
  const next = rowRefs.value[positions[event.key]];
  next?.focus();
}

const poolText = (mission) =>
  mission.sample ? mission.reward : mission.availableReward || "0";
const symbolText = (mission) => mission.rewardSymbol || "SOL";
const meterValue = (mission) => {
  const total = Number(mission.reward || 0);
  const awarded = Number(mission.totalAwarded || 0);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(awarded) || awarded <= 0) return 0;
  return Math.min(100, Math.round((awarded / total) * 100));
};
const meterLabel = (mission) => {
  const value = meterValue(mission);
  if (mission.sample) return "ILLUSTRATIVE POOL";
  if (value <= 0) return "UNALLOCATED 0%";
  return value >= 100 ? "SETTLED 100%" : `ALLOCATED ${value}%`;
};
const stateLabel = (mission) => {
  if (mission.sample) return "Sample";
  if (mission.closed) return "Closed";
  if (mission.expired) return "Ended";
  return "Open";
};
const stateClass = (mission) => {
  const label = stateLabel(mission).toLowerCase();
  return `tag state-${label}`;
};
const deadlineText = (mission) => {
  if (mission.sample) return mission.difficulty || "Open brief";
  return mission.expired ? `${mission.deadline} · ended` : mission.deadline;
};
const actionLabel = (mission, index) =>
  `${index + 1}. ${mission.title}. ${mission.category}. Pool ${poolText(mission)} ${symbolText(mission)}. State ${stateLabel(mission)}`;
</script>

<template>
  <div class="registry-pane">
    <div class="pane-head">
      <h2>{{ viewTitle }}</h2>
      <span class="micro" aria-live="polite"
        >{{ missions.length }}
        {{ missions.length === 1 ? "record" : "records" }}</span
      >
      <button
        v-if="configured"
        class="button ghost"
        :disabled="refreshing"
        @click="emit('retry')"
      >
        <UiIcon name="refresh" :size="13" />Rescan
      </button>
      <button v-else class="button ghost" @click="emit('retry')">
        <UiIcon name="refresh" :size="13" />Reload samples
      </button>
      <button
        class="button primary create-brief"
        aria-label="Post brief"
        @click="emit('create')"
      >
        <UiIcon name="plus" :size="13" /><span aria-hidden="true">Post brief</span>
      </button>
    </div>

    <div v-if="loading" class="registry-body" role="status">
      <span class="sr-only">Loading briefs…</span>
      <span v-for="n in 7" :key="n" class="skeleton-row"></span>
    </div>

    <div v-else-if="loadError" class="state-panel is-error" role="alert">
      <UiIcon name="info" :size="24" />
      <h3>The registry could not be read.</h3>
      <p>{{ loadError }}</p>
      <button class="button secondary" @click="emit('retry')">
        <UiIcon name="refresh" :size="14" />Try again
      </button>
    </div>

    <template v-if="missions.length">
      <div class="registry" role="table" aria-label="Brief registry">
        <div class="reg-head" role="row">
          <span role="columnheader">id</span>
          <span role="columnheader">brief</span>
          <span role="columnheader">topic</span>
          <span role="columnheader">pool</span>
          <span class="reg-col-deadline" role="columnheader">deadline</span>
          <span role="columnheader">settlement</span>
          <span role="columnheader">state</span>
          <span role="columnheader"><span class="sr-only">Row actions</span></span>
        </div>
        <div class="registry-body" role="rowgroup" @keydown="handleRowsKey">
          <div
            v-for="(mission, index) in missions"
            :key="mission.key || mission.id"
            class="reg-row"
            :class="{ 'is-selected': selectedKey === (mission.key || mission.id) }"
            role="row"
            :ref="(element) => setRow(element, index)"
            :data-key="mission.key || mission.id"
            :tabindex="
              selectedKey === (mission.key || mission.id) ||
              (!selectedKey && index === 0)
                ? 0
                : -1
            "
            :aria-current="
              selectedKey === (mission.key || mission.id) ? 'true' : undefined
            "
            :aria-label="actionLabel(mission, index)"
            @click="emit('open', mission)"
            @keydown.enter.prevent="emit('open', mission)"
            @keydown.space.prevent="emit('open', mission)"
          >
            <span class="row-id" role="cell">{{
              String(index + 1).padStart(2, "0")
            }}</span>
            <span class="reg-title" role="cell"
              ><b>{{ mission.title }}</b
              ><code>{{ mission.id }}</code></span
            >
            <span class="reg-topic" role="cell">{{ mission.category }}</span>
            <span class="reg-pool" role="cell"
              ><strong>{{ poolText(mission) }}</strong
              ><em
                >{{ symbolText(mission) }} ·
                {{ mission.sample ? "POOL" : "OPEN" }}</em
              ></span
            >
            <span class="reg-deadline" role="cell"
              ><span>{{ deadlineText(mission) }}</span
              ><em>{{
                mission.sample ? "ILLUSTRATIVE" : "LOCAL TIME"
              }}</em></span
            >
            <span class="reg-meter" role="cell"
              ><span
                class="meter-track"
                :class="{ 'is-empty': meterValue(mission) <= 0 }"
                ><i :style="{ width: `${meterValue(mission)}%` }"></i></span
              ><span class="meter-value">{{ meterLabel(mission) }}</span></span
            >
            <span class="reg-state" role="cell"
              ><span :class="stateClass(mission)">{{
                stateLabel(mission)
              }}</span></span
            >
            <span class="reg-actions" role="cell">
              <button
                class="icon-button"
                :class="{ 'is-on': isSaved(mission) }"
                :aria-pressed="isSaved(mission)"
                :aria-label="`${
                  isSaved(mission) ? 'Remove' : 'Save'
                } ${mission.title} ${
                  isSaved(mission) ? 'from' : 'to'
                } your saved list`"
                @click.stop="emit('save', mission)"
              >
                <UiIcon name="bookmark" :size="14" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!missions.length" class="state-panel">
      <UiIcon :name="filtered ? 'search' : savedView ? 'bookmark' : activityView ? 'wallet' : 'ledger'" :size="24" />
      <h3>
        {{
          filtered
            ? "No brief matches this view."
            : savedView
              ? "Nothing saved yet."
              : activityView
                ? "No briefs from this wallet yet."
                : "The registry is empty."
        }}
      </h3>
      <p>
        {{
          filtered
            ? "Clear the search, topic or state filter and the full registry returns."
            : savedView
              ? "Save a brief from any row and it is kept on this device under the tallyvein-saved key."
              : activityView
                ? "Connect the wallet you create briefs with, or post the first brief from this desk."
                : viewNote || "Reload the samples or post the first brief to open the registry."
        }}
      </p>
      <button v-if="filtered" class="button secondary" @click="emit('reset')">
        <UiIcon name="refresh" :size="14" />Reset view
      </button>
      <button
        v-else-if="activityView"
        class="button primary"
        @click="emit('connect')"
      >
        <UiIcon name="wallet" :size="14" />Connect wallet
      </button>
      <button v-else class="button primary" @click="emit('create')">
        <UiIcon name="plus" :size="14" />Post a brief
      </button>
    </div>

    <div class="registry-status">
      <span aria-live="polite"
        >{{ missions.length }}
        {{ missions.length === 1 ? "brief" : "briefs" }}
        {{ filtered ? "after filters" : "in this view" }}</span
      >
      <span v-if="statusFilter && statusFilter !== 'all'"
        >STATE FILTER · {{ statusFilter.toUpperCase() }}</span
      >
      <span v-else>SELECT A ROW TO OPEN THE INSPECTOR</span>
    </div>

    <div class="deck-base">
      <div class="base-head"><span class="micro">deck summary</span></div>
      <dl class="base-grid">
        <div>
          <dt>Records</dt>
          <dd>{{ String(missions.length).padStart(2, "0") }}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>
            {{ String(openCount).padStart(2, "0")
            }}<small>accepting evidence</small>
          </dd>
        </div>
        <div>
          <dt>Illustrative pool</dt>
          <dd>{{ poolTotal }}<small>testnet SOL</small></dd>
        </div>
        <div>
          <dt>Cluster</dt>
          <dd class="base-cluster">
            {{ cluster.toUpperCase()
            }}<small>{{ configured ? "writes gated" : "preview only" }}</small>
          </dd>
        </div>
      </dl>
      <p class="base-note">
        <UiIcon name="info" :size="15" />
        <span
          ><strong>{{ filtered ? "Filtered view." : "Full registry." }}</strong>
          Every record here is an illustrative testnet brief: rewards carry no
          intended monetary value, nothing signs or sends a transaction, and the
          inspector reads pool, evidence and review state only.</span
        >
      </p>
    </div>
  </div>
</template>
