<script setup>
import { nextTick, ref } from "vue";
import UiIcon from "./UiIcon.vue";

const props = defineProps({
  missions: { type: Array, default: () => [] },
  isSaved: { type: Function, default: () => false },
  loading: Boolean,
  loadError: { type: String, default: "" },
  configured: Boolean,
  refreshing: Boolean,
  viewTitle: { type: String, default: "The brief index" },
  viewNote: { type: String, default: "" },
  search: { type: String, default: "" },
  activeCategory: { type: String, default: "All topics" },
  topics: { type: Array, default: () => [] },
  topicCounts: { type: Object, default: () => ({}) },
  statusFilter: { type: String, default: "all" },
  statusOptions: { type: Array, default: () => [] },
  sortBy: { type: String, default: "newest" },
  filtered: Boolean,
  cluster: { type: String, default: "testnet" },
  openCount: { type: Number, default: 0 },
  poolTotal: { type: String, default: "0" },
  savedView: Boolean,
  activityView: Boolean,
  walletConnected: Boolean,
});
const emit = defineEmits([
  "open",
  "save",
  "retry",
  "reset",
  "create",
  "connect",
  "update:search",
  "update:activeCategory",
  "update:statusFilter",
  "update:sortBy",
]);

const searchInput = ref(null);
const entryRefs = ref([]);
const setEntry = (element, index) => {
  if (element) entryRefs.value[index] = element;
};

async function clearSearch() {
  emit("update:search", "");
  await nextTick();
  searchInput.value?.focus();
}

function handleEntryKey(event) {
  const last = props.missions.length - 1;
  if (last < 0) return;
  const current = entryRefs.value.indexOf(event.target);
  const positions = {
    ArrowDown: current < 0 ? 0 : Math.min(current + 1, last),
    ArrowUp: current < 0 ? last : Math.max(current - 1, 0),
    Home: 0,
    End: last,
  };
  if (!(event.key in positions)) return;
  event.preventDefault();
  entryRefs.value[positions[event.key]]?.focus();
}

const poolText = (mission) =>
  mission.sample ? mission.reward : mission.availableReward || "0";
const symbolText = (mission) => mission.rewardSymbol || "SOL";
const stateLabel = (mission) => {
  if (mission.sample) return "Sample";
  if (mission.closed) return "Closed";
  if (mission.expired) return "Ended";
  return "Open";
};
const phaseClass = (mission) => `phase-${stateLabel(mission).toLowerCase()}`;
const deadlineText = (mission) => {
  if (mission.sample) return mission.difficulty || "Open brief";
  return mission.expired ? `${mission.deadline} · ended` : mission.deadline;
};
const actionLabel = (mission, index) =>
  `${index + 1}. ${mission.title}. ${mission.category}. Pool ${poolText(mission)} ${symbolText(mission)}. State ${stateLabel(mission)}`;
const pad = (value) => String(value).padStart(2, "0");
</script>

<template>
  <section id="brief-index" class="ledger" aria-labelledby="index-title">
    <div class="ledger-head">
      <div class="ledger-lead">
        <p class="rail-kicker">
          {{
            savedView
              ? "Your reading list"
              : activityView
                ? "Your briefs"
                : "The brief index"
          }}
        </p>
        <h2 id="index-title" class="ledger-title">{{ viewTitle }}</h2>
        <p class="ledger-note">{{ viewNote }}</p>
      </div>
      <div class="ledger-tools">
        <button
          class="chart-link"
          type="button"
          :disabled="refreshing"
          @click="emit('retry')"
        >
          <UiIcon name="refresh" :size="14" />{{
            configured ? "Rescan the chain" : "Reload samples"
          }}
        </button>
        <button
          class="chart-btn"
          type="button"
          aria-label="Post a brief"
          @click="emit('create')"
        >
          <span aria-hidden="true">Post a brief</span><UiIcon name="arrow" :size="15" />
        </button>
      </div>
    </div>

    <div class="query-rail" role="search" aria-label="Filter the brief index">
      <div class="query-field">
        <UiIcon name="search" :size="17" />
        <input
          id="brief-search"
          ref="searchInput"
          class="query-input"
          type="search"
          :value="search"
          placeholder="Search titles, topics and scope"
          aria-label="Search briefs"
          autocomplete="off"
          @input="emit('update:search', $event.target.value)"
        />
        <button
          v-if="search"
          class="query-clear"
          type="button"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <UiIcon name="close" :size="14" />
        </button>
      </div>
      <label class="order-field" for="brief-order">
        <span>Order</span>
        <select
          id="brief-order"
          class="order-select"
          :value="sortBy"
          aria-label="Sort briefs"
          @change="emit('update:sortBy', $event.target.value)"
        >
          <option value="newest">Newest record</option>
          <option value="recommended">Recommended</option>
          <option value="reward">Highest pool</option>
          <option value="deadline">Closing soon</option>
        </select>
      </label>
      <button
        class="chart-link"
        type="button"
        :disabled="!filtered"
        @click="emit('reset')"
      >
        Reset
      </button>
    </div>

    <div class="facet-line">
      <div class="facet-set" role="group" aria-label="Filter by topic">
        <span class="facet-label">Topics</span>
        <button
          v-for="topic in topics"
          :key="topic"
          class="facet"
          type="button"
          :class="{ 'is-picked': activeCategory === topic }"
          :aria-pressed="activeCategory === topic"
          @click="emit('update:activeCategory', topic)"
        >
          {{ topic }}<sup>{{
            topic === "All topics"
              ? topicCounts.all || 0
              : topicCounts[topic] || 0
          }}</sup>
        </button>
      </div>
      <div class="facet-set" role="group" aria-label="Filter by state">
        <span class="facet-label">Standing</span>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="facet"
          type="button"
          :class="{ 'is-picked': statusFilter === option.value }"
          :aria-pressed="statusFilter === option.value"
          @click="emit('update:statusFilter', option.value)"
        >
          {{ option.label }}<sup>{{ option.count }}</sup>
        </button>
      </div>
    </div>

    <section class="tally-line" aria-labelledby="band-title">
      <p id="band-title" class="tally-kicker">This edition at a glance</p>
      <dl class="tally-cells">
        <div class="tally-cell">
          <dt class="tally-label">Records</dt>
          <dd class="tally-value">{{ pad(missions.length) }}</dd>
        </div>
        <div class="tally-cell">
          <dt class="tally-label">Open</dt>
          <dd class="tally-value">{{ pad(openCount) }}<small>accepting evidence</small></dd>
        </div>
        <div class="tally-cell">
          <dt class="tally-label">Illustrative pool</dt>
          <dd class="tally-value">{{ poolTotal }}<small>testnet SOL</small></dd>
        </div>
        <div class="tally-cell">
          <dt class="tally-label">Cluster</dt>
          <dd class="tally-value">
            {{ cluster.toUpperCase() }}<small>{{
              configured ? "writes gated" : "preview only"
            }}</small>
          </dd>
        </div>
      </dl>
      <p class="tally-note">
        <UiIcon name="info" :size="16" />
        <span
          ><strong>{{ filtered ? "Filtered view." : "Full index." }}</strong>
          Every record here is an illustrative testnet brief: rewards carry no
          intended monetary value, nothing signs or sends a transaction, and each
          dossier reads pool, evidence and review state only.</span
        >
      </p>
    </section>

    <div v-if="loading" class="loadline" role="status">
      <span class="sr-only">Loading briefs…</span>
      <span v-for="n in 5" :key="n" class="load-block" aria-hidden="true"></span>
    </div>

    <div v-else-if="loadError" class="void" role="alert">
      <UiIcon name="info" :size="26" />
      <h3>The index could not be printed.</h3>
      <p>{{ loadError }}</p>
      <button class="chart-btn" type="button" @click="emit('retry')">
        Try again<UiIcon name="refresh" :size="15" />
      </button>
    </div>

    <template v-else-if="missions.length">
      <ol class="ledger-rows" aria-label="Briefs">
        <li v-for="(mission, index) in missions" :key="mission.key || mission.id">
          <article class="entry-row">
            <span class="entry-no">{{ pad(index + 1) }}</span>
            <div class="entry-lead">
              <span class="entry-topic">{{ mission.category }}</span>
              <button
                :ref="(element) => setEntry(element, index)"
                class="entry-open"
                type="button"
                :data-key="mission.key || mission.id"
                :aria-label="actionLabel(mission, index)"
                @click="emit('open', mission)"
                @keydown="handleEntryKey"
              >
                <span class="entry-title">{{ mission.title }}</span>
                <span class="entry-copy">{{ mission.description }}</span>
              </button>
            </div>
            <div class="entry-figures">
              <span class="entry-pool"
                >{{ poolText(mission) }}<em>{{ symbolText(mission) }}</em></span
              >
              <span class="entry-due">{{ deadlineText(mission) }}</span>
              <span class="entry-state" :class="phaseClass(mission)">{{
                stateLabel(mission)
              }}</span>
            </div>
            <div class="entry-keep">
              <button
                class="keep-key"
                type="button"
                :class="{ 'is-held': isSaved(mission) }"
                :aria-pressed="isSaved(mission)"
                :aria-label="`${
                  isSaved(mission) ? 'Remove' : 'Save'
                } ${mission.title} ${
                  isSaved(mission) ? 'from' : 'to'
                } your saved list`"
                @click="emit('save', mission)"
              >
                <UiIcon name="bookmark" :size="15" />
                <span aria-hidden="true">{{ isSaved(mission) ? "Kept" : "Keep" }}</span>
              </button>
            </div>
          </article>
        </li>
      </ol>
      <div class="ledger-foot" aria-live="polite">
        <span
          >{{ missions.length }}
          {{ missions.length === 1 ? "brief" : "briefs" }}
          {{ filtered ? "after filters" : "in this view" }}</span
        >
        <span v-if="statusFilter !== 'all'"
          >Standing · {{ statusFilter.toUpperCase() }}</span
        >
        <span v-else>Choose a title to read the full dossier</span>
      </div>
    </template>

    <div v-else class="void">
      <UiIcon
        :name="filtered ? 'search' : savedView ? 'bookmark' : activityView ? 'wallet' : 'ledger'"
        :size="26"
      />
      <h3>
        {{
          filtered
            ? "No brief matches this view."
            : savedView
              ? "Nothing saved yet."
              : activityView
                ? "No briefs from this wallet yet."
                : "The index is empty."
        }}
      </h3>
      <p>
        {{
          filtered
            ? "Clear the search, topic or standing filter and the full index returns."
            : savedView
              ? "Keep a brief from any entry and it stays on this device under the Colopha-saved key."
              : activityView
                ? "Connect the wallet you create briefs with, or post the first brief from this desk."
                : viewNote || "Reload the samples or post the first brief to open the index."
        }}
      </p>
      <button v-if="filtered" class="chart-link" type="button" @click="emit('reset')">
        <UiIcon name="refresh" :size="14" />Reset view
      </button>
      <button
        v-else-if="activityView"
        class="chart-btn"
        type="button"
        @click="emit('connect')"
      >
        <UiIcon name="wallet" :size="15" />Connect wallet
      </button>
      <button v-else class="chart-btn" type="button" @click="emit('create')">
        <UiIcon name="plus" :size="15" />Post a brief
      </button>
    </div>
  </section>
</template>
