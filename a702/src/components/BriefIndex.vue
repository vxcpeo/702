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
const stateClass = (mission) => `state-${stateLabel(mission).toLowerCase()}`;
const deadlineText = (mission) => {
  if (mission.sample) return mission.difficulty || "Open brief";
  return mission.expired ? `${mission.deadline} · ended` : mission.deadline;
};
const actionLabel = (mission, index) =>
  `${index + 1}. ${mission.title}. ${mission.category}. Pool ${poolText(mission)} ${symbolText(mission)}. State ${stateLabel(mission)}`;
const pad = (value) => String(value).padStart(2, "0");
</script>

<template>
  <section id="brief-index" class="registry-section" aria-labelledby="index-title">
    <header class="registry-head">
      <div>
        <p class="overline">
          {{
            savedView
              ? "Your reading list"
              : activityView
                ? "Your briefs"
                : "The brief index"
          }}
        </p>
        <h2 id="index-title" class="registry-title">{{ viewTitle }}</h2>
        <p class="registry-note">{{ viewNote }}</p>
      </div>
      <div class="registry-acts">
        <button
          class="text-link"
          type="button"
          :disabled="refreshing"
          @click="emit('retry')"
        >
          <UiIcon name="refresh" :size="14" />{{
            configured ? "Rescan the chain" : "Reload samples"
          }}
        </button>
        <button
          class="action-core"
          type="button"
          aria-label="Post a brief"
          @click="emit('create')"
        >
          <span aria-hidden="true">Post a brief</span><UiIcon name="arrow" :size="15" />
        </button>
      </div>
    </header>

    <div class="query-row" role="search" aria-label="Filter the brief index">
      <div class="query-field">
        <UiIcon name="search" :size="17" />
        <input
          id="brief-search"
          ref="searchInput"
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
      <label class="query-order" for="brief-order">
        <span>Order</span>
        <select
          id="brief-order"
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
        class="quiet-link"
        type="button"
        :disabled="!filtered"
        @click="emit('reset')"
      >
        Reset
      </button>
    </div>

    <div class="topic-line">
      <div class="topic-rail" role="group" aria-label="Filter by topic">
        <span class="topic-rail__label">Topics</span>
        <button
          v-for="topic in topics"
          :key="topic"
          class="topic-chip"
          type="button"
          :class="{ 'is-current': activeCategory === topic }"
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
      <div class="topic-rail" role="group" aria-label="Filter by state">
        <span class="topic-rail__label">Standing</span>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="topic-chip"
          type="button"
          :class="{ 'is-current': statusFilter === option.value }"
          :aria-pressed="statusFilter === option.value"
          @click="emit('update:statusFilter', option.value)"
        >
          {{ option.label }}<sup>{{ option.count }}</sup>
        </button>
      </div>
    </div>

    <div class="registry-body">
      <div class="registry-ledger">
        <div v-if="loading" class="loading-ledger" role="status">
          <span class="visually-hidden">Loading briefs…</span>
          <span v-for="n in 5" :key="n" class="loading-row" aria-hidden="true"></span>
        </div>

        <div v-else-if="loadError" class="blank-slate is-fault" role="alert">
          <UiIcon name="info" :size="26" />
          <h3>The index could not be printed.</h3>
          <p>{{ loadError }}</p>
          <button class="action-core" type="button" @click="emit('retry')">
            Try again<UiIcon name="refresh" :size="15" />
          </button>
        </div>

        <template v-else-if="missions.length">
          <ol class="register" aria-label="Briefs">
            <li v-for="(mission, index) in missions" :key="mission.key || mission.id">
              <article class="register-row">
                <button
                  :ref="(element) => setEntry(element, index)"
                  class="register-open"
                  type="button"
                  :data-key="mission.key || mission.id"
                  :aria-label="actionLabel(mission, index)"
                  @click="emit('open', mission)"
                  @keydown="handleEntryKey"
                >
                  <span class="register-no">{{ pad(index + 1) }}</span>
                  <span class="register-brief">
                    <span class="register-topic">{{ mission.category }}</span>
                    <span class="register-title">{{ mission.title }}</span>
                    <span class="register-copy">{{ mission.description }}</span>
                  </span>
                  <span class="register-stats">
                    <span class="register-pool"
                      ><strong>{{ poolText(mission) }}</strong>
                      <em>{{ symbolText(mission) }}</em></span
                    >
                    <span class="register-when">{{ deadlineText(mission) }}</span>
                    <span class="register-state" :class="stateClass(mission)">{{
                      stateLabel(mission)
                    }}</span>
                  </span>
                </button>
                <button
                  class="register-keep"
                  type="button"
                  :class="{ 'is-kept': isSaved(mission) }"
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
              </article>
            </li>
          </ol>
          <div class="register-foot" aria-live="polite">
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

        <div v-else class="blank-slate">
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
                  ? "Keep a brief from any entry and it stays on this device under the Trovane-saved key."
                  : activityView
                    ? "Connect the wallet you create briefs with, or post the first brief from this desk."
                    : viewNote || "Reload the samples or post the first brief to open the index."
            }}
          </p>
          <button v-if="filtered" class="text-link" type="button" @click="emit('reset')">
            <UiIcon name="refresh" :size="14" />Reset view
          </button>
          <button
            v-else-if="activityView"
            class="action-core"
            type="button"
            @click="emit('connect')"
          >
            <UiIcon name="wallet" :size="15" />Connect wallet
          </button>
          <button v-else class="action-core" type="button" @click="emit('create')">
            <UiIcon name="plus" :size="15" />Post a brief
          </button>
        </div>
      </div>

      <div class="summary-aside" role="complementary" aria-label="This edition at a glance">
        <p class="overline">This edition at a glance</p>
        <dl class="summary-figures">
          <div class="summary-figure">
            <dt>Records</dt>
            <dd>{{ pad(missions.length) }}</dd>
          </div>
          <div class="summary-figure">
            <dt>Open</dt>
            <dd>{{ pad(openCount) }}<small>accepting evidence</small></dd>
          </div>
          <div class="summary-figure">
            <dt>Illustrative pool</dt>
            <dd>{{ poolTotal }}<small>testnet SOL</small></dd>
          </div>
          <div class="summary-figure">
            <dt>Cluster</dt>
            <dd class="summary-cluster">
              {{ cluster.toUpperCase() }}<small>{{
                configured ? "writes gated" : "preview only"
              }}</small>
            </dd>
          </div>
        </dl>
        <p class="summary-note">
          <UiIcon name="info" :size="16" />
          <span
            ><strong>{{ filtered ? "Filtered view." : "Full index." }}</strong>
            Every record here is an illustrative testnet brief: rewards carry no
            intended monetary value, nothing signs or sends a transaction, and each
            dossier reads pool, evidence and review state only.</span
          >
        </p>
      </div>
    </div>
  </section>
</template>

