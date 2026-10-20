<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useMissions, validateMissionForm } from "./composables/useMissions";
import UiIcon from "./components/UiIcon.vue";
import ChainReadout from "./components/ChainReadout.vue";
import BriefRegistry from "./components/BriefRegistry.vue";
import BriefInspector from "./components/BriefInspector.vue";
import BriefGuide from "./components/BriefGuide.vue";
import { amountText } from "./utils/format";
import { SOLANA_CLUSTER, SOLANA_PROGRAM_ID } from "./config";
const {
  account,
  walletError,
  connecting,
  busy,
  notice,
  noticeKind,
  canUndoSavedChange,
  activeView,
  search,
  activeCategory,
  selected,
  createOpen,
  guideOpen,
  mobileNav,
  txHash,
  missionForm,
  evidence,
  contribution,
  contributions,
  claimableAmount,
  walletBalance,
  rewardBalance,
  rewardSymbol,
  rewardUnitLabel,
  rewardDecimals,
  configured,
  shortAccount,
  correctChain,
  topics,
  missionItems,
  filtered,
  savedCount,
  sortBy,
  loading,
  loadError,
  contributionsLoading,
  contributionsError,
  statsLoading,
  statsError,
  txStatus,
  txError,
  activeTransaction,
  formErrors,
  selectedIsCreator,
  selectedIsOpen,
  selectedCanRefund,
  notify,
  dismissNotice,
  saveMission,
  undoSavedChange,
  scrollTo,
  connectWallet,
  switchNetwork,
  refreshRewardDecimals,
  openCreate,
  refreshMissions,
  loadContributions,
  transact,
  closeModal,
  isSaved,
  safeExternalUrl,
  explorerLink,
  resetFilters,
  refreshAll,
  updateWalletStats,
} = useMissions();
const logo = import.meta.env.BASE_URL + "tallyvein-mark.svg";
/* New deck state: the terminal reads a clock, the tab rail carries a lane, the
   filter bar carries a state, and the inspector opens as a sheet on narrow
   screens. Every other value still comes from useMissions(). */
const searchInput = ref(null),
  clockTick = ref(Date.now()),
  statusFilter = ref("all"),
  detailOpen = ref(false),
  dialog = ref(null),
  createStep = ref(1),
  rewardsOpen = ref(false),
  detailTab = ref("Brief"),
  lane = ref("board");
const approvalAmounts = ref({}),
  approvingId = ref(null);
const wideMedia = matchMedia("(min-width: 1000px)"),
  isWide = ref(wideMedia.matches);
let clockTimer, previousFocus, navigationFocus;
const timeText = ref("");
function tickClock() {
  const now = new Date();
  clockTick.value = now.getTime();
  timeText.value = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes(),
  ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
}
tickClock();
/* The slot and epoch advance with the UTC clock. They are labelled SIM in the
   readout: nothing here requests a block height from the cluster. */
const simulatedSlot = computed(() => 268_400_000 + Math.floor(clockTick.value / 400));
const simulatedEpoch = computed(() => 640 + Math.floor(clockTick.value / 2_592_000));
const shortProgram = computed(() =>
  SOLANA_PROGRAM_ID
    ? `${SOLANA_PROGRAM_ID.slice(0, 4)}…${SOLANA_PROGRAM_ID.slice(-4)}`
    : "NOT SET",
);
const programLabel = computed(() =>
  configured.value ? shortProgram.value : `${shortProgram.value} · GATED`,
);
const shortAddress = (value) =>
  value ? `${String(value).slice(0, 6)}…${String(value).slice(-6)}` : "";
const sampleFeed = computed(
  () => !configured.value || missionItems.value.some((mission) => mission.sample),
);
const stateOf = (mission) =>
  mission.sample
    ? "sample"
    : mission.closed
      ? "closed"
      : mission.expired
        ? "ended"
        : "open";
const stateCount = (state) =>
  state === "all"
    ? missionItems.value.length
    : missionItems.value.filter((mission) => stateOf(mission) === state).length;
const statusOptions = computed(() => [
  { value: "all", label: "All", count: stateCount("all") },
  { value: "open", label: "Open", count: stateCount("open") },
  {
    value: "ended",
    label: "Ended",
    count: stateCount("ended") + stateCount("closed"),
  },
  { value: "sample", label: "Sample", count: stateCount("sample") },
]);
const registryItems = computed(() =>
  statusFilter.value === "all"
    ? filtered.value
    : filtered.value.filter((mission) =>
        statusFilter.value === "ended"
          ? stateOf(mission) === "ended" || stateOf(mission) === "closed"
          : stateOf(mission) === statusFilter.value,
      ),
);
const anyFilters = computed(
  () =>
    !!search.value ||
    activeCategory.value !== "All topics" ||
    statusFilter.value !== "all",
);
const openCount = computed(
  () => missionItems.value.filter((mission) => stateOf(mission) === "open").length,
);
/* Illustrative pool total for the deck summary. Sample records carry a decimal
   string, so the sum stays a display-only number. */
const poolTotal = computed(() =>
  missionItems.value
    .reduce(
      (sum, mission) =>
        sum +
        (Number(mission.sample ? mission.reward : mission.availableReward) || 0),
      0,
    )
    .toFixed(2),
);
const lanes = computed(() => [
  { id: "board", label: "Board", icon: "grid", count: missionItems.value.length },
  { id: "briefs", label: "Briefs", icon: "ledger", count: registryItems.value.length },
  { id: "evidence", label: "Evidence", icon: "link", count: contributions.value.length },
  { id: "tallies", label: "Tallies", icon: "scale", count: savedCount.value },
  { id: "guide", label: "Guide", icon: "book", count: 0 },
]);
const viewLabel = (view) =>
  ({ "All missions": "Board", Saved: "Tallies", "My activity": "Evidence" })[
    view
  ] || view;
const laneIs = (id) => lane.value === id;
const registryTitle = computed(() => `${viewLabel(activeView.value)} · REGISTRY`);
const registryNote = computed(() =>
  activeView.value === "Saved"
    ? "Saved on this device. Nothing here is sent to the network."
    : activeView.value === "My activity"
      ? "Briefs created with the connected wallet."
      : "Illustrative briefs from the sample feed.",
);
const mobileDetail = computed(() => !isWide.value && detailOpen.value);
/* The inspector stays live on a wide desk (it is a docked pane) and only takes
   focus and the accessibility tree when it opens as a sheet. */
const detailVisible = computed(() => isWide.value || detailOpen.value);
/* The inspector is the only brief-detail surface, so the dialog carries the
   create, rewards and guide views alone. */
const modalOpen = computed(
  () => !!(createOpen.value || guideOpen.value || rewardsOpen.value),
);
const modalTitle = computed(() =>
  createOpen.value
    ? "Post a brief"
    : rewardsOpen.value
      ? "Your rewards"
      : "How it works",
);
const modalKicker = computed(() =>
  createOpen.value
    ? `NEW BRIEF / STEP ${createStep.value} OF 2`
    : rewardsOpen.value
      ? "REWARDS LEDGER"
      : "GUIDE / HOW IT WORKS",
);
const minimumDate = new Date(
  Date.now() + 60_000 - new Date().getTimezoneOffset() * 60_000,
)
  .toISOString()
  .slice(0, 16);

async function clearSearch() {
  search.value = "";
  await nextTick();
  searchInput.value?.focus();
}
function approveReset() {
  approvalAmounts.value = {};
  approvingId.value = null;
}
function closeAll() {
  if (busy.value) {
    notify("Your transaction is still in progress. Follow its status here.");
    return;
  }
  closeModal();
  rewardsOpen.value = false;
}
function resetTransactionFeedback() {
  if (!busy.value) {
    txError.value = "";
    txHash.value = "";
    txStatus.value = "idle";
    dismissNotice();
  }
}
function openDetails(m) {
  resetTransactionFeedback();
  detailTab.value = "Brief";
  approveReset();
  selected.value = m;
  detailOpen.value = true;
}
function closeDetail() {
  const key = selected.value?.key || selected.value?.id;
  detailOpen.value = false;
  selected.value = null;
  nextTick(() => {
    document.querySelectorAll(".reg-row").forEach((row) => {
      if (row.getAttribute("data-key") === key) row.focus();
    });
  });
}
/* One lane switch drives the existing view, topic and surface state. Guide is a
   view of its own: the rail and registry give way to the guide deck. */
async function selectLane(id) {
  mobileNav.value = false;
  if (id === "guide") {
    resetTransactionFeedback();
    closeModal();
    rewardsOpen.value = false;
    detailOpen.value = false;
    lane.value = "guide";
    await nextTick();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  lane.value = id;
  resetTransactionFeedback();
  detailOpen.value = false;
  statusFilter.value = "all";
  if (id === "board") {
    activeView.value = "All missions";
    activeCategory.value = "All topics";
  } else if (id === "briefs") {
    activeView.value = "All missions";
  } else if (id === "tallies") {
    activeView.value = "Saved";
    activeCategory.value = "All topics";
  } else if (id === "evidence") {
    activeView.value = "My activity";
    activeCategory.value = "All topics";
  }
  await nextTick();
  scrollTo("missions");
}
function handleSave(mission) {
  saveMission(mission);
  if (!isWide.value) detailOpen.value = false;
}
function navigate(view) {
  activeView.value = view;
  lane.value =
    view === "Saved" ? "tallies" : view === "My activity" ? "evidence" : "board";
  mobileNav.value = false;
  scrollTo("missions");
}
function startCreate() {
  resetTransactionFeedback();
  createStep.value = 1;
  mobileNav.value = false;
  openCreate();
}
function openGuide() {
  resetTransactionFeedback();
  mobileNav.value = false;
  guideOpen.value = true;
}
function openRewards() {
  resetTransactionFeedback();
  mobileNav.value = false;
  rewardsOpen.value = true;
}
async function resetView() {
  resetFilters();
  statusFilter.value = "all";
  lane.value = "board";
  await nextTick();
  await refreshMissions();
}
function backToTop() {
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
async function approveBounty(id, amount) {
  approvingId.value = id;
  const value = amount ?? approvalAmounts.value[id];
  try {
    await transact("approve", id, value);
  } finally {
    approvingId.value = null;
  }
}
function updateApproval(key, value) {
  approvalAmounts.value = { ...approvalAmounts.value, [key]: value };
}
function updateWide(event) {
  isWide.value = event.matches;
  if (event.matches) detailOpen.value = false;
}
function handleGlobalKey(event) {
  if (event.key === "Escape" && !modalOpen.value) {
    if (mobileNav.value) mobileNav.value = false;
    else if (detailOpen.value && !isWide.value) closeDetail();
  }
  if (event.key !== "Tab") return;
  const surface = modalOpen.value
    ? dialog.value
    : mobileNav.value && !isWide.value
      ? document.querySelector(".nav-sheet")
      : null;
  if (!surface) return;
  const buttons = [
    ...surface.querySelectorAll(
      "a[href], button, input, select, textarea, [tabindex]",
    ),
  ].filter(
    (el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length,
  );
  const first = buttons[0],
    last = buttons.at(-1);
  if (!first) {
    event.preventDefault();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !surface.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !surface.contains(document.activeElement))
  ) {
    event.preventDefault();
    first.focus();
  }
}
async function reviewDraft() {
  if (configured.value) {
    try {
      await refreshRewardDecimals();
    } catch (error) {
      formErrors.value = {
        reward: String(
          error?.message || "The configured reward mint could not be read.",
        ),
      };
      return;
    }
  }
  const result = validateMissionForm(
    missionForm.value,
    Date.now(),
    rewardDecimals.value,
  );
  formErrors.value = result.errors;
  if (!Object.keys(result.errors).length) {
    createStep.value = 2;
    await nextTick();
    dialog.value?.querySelector(".modal-scroll")?.scrollTo({ top: 0 });
    dialog.value?.querySelector(".review-mission h3")?.focus();
  } else {
    await nextTick();
    dialog.value?.querySelector('[aria-invalid="true"]')?.focus();
  }
}
async function editDraft() {
  createStep.value = 1;
  await nextTick();
  document.getElementById("mission-title")?.focus();
}
async function showContribute() {
  detailTab.value = "Contribute";
  detailOpen.value = true;
  await nextTick();
  document.getElementById("insp-evidence-uri")?.focus();
}
function downloadBrief() {
  const f = missionForm.value;
  const unit = configured.value ? rewardSymbol.value : `${SOLANA_CLUSTER} SOL`;
  const disclaimer = configured.value
    ? "The selected reward mint is on the configured Solana network. Verify the mint and its terms before funding."
    : `Sample ${SOLANA_CLUSTER} SOL has no intended monetary value.`;
  const text = [
    "# " + (f.title || "Untitled brief"),
    "",
    "Tallyvein / " + f.category,
    "",
    "## Bounty brief",
    f.description || "Add scope, primary sources and acceptance criteria here.",
    "",
    "## Submission deadline",
    f.deadline || "To be set",
    "",
    "## Reward pool",
    (f.reward || "0") + " " + unit,
    "",
    "Published brief: " + (f.uri || "Add a public URL after hosting this file."),
    "",
    "The bounty creator reviews submissions. A submission does not guarantee an allocation. " +
      disclaimer,
    "",
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tallyvein-bounty-brief.md";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(
    "Brief downloaded. Publish it, then add its public URL before funding your bounty.",
  );
}
watch(modalOpen, async (open) => {
  if (open) {
    previousFocus = document.activeElement;
    mobileNav.value = false;
    await nextTick();
    dialog.value?.showModal();
    document.body.style.overflow = "hidden";
  } else {
    dialog.value?.close();
    document.body.style.overflow = "";
    await nextTick();
    if (previousFocus?.isConnected && previousFocus.getClientRects().length)
      previousFocus.focus();
    else if (!isWide.value) document.querySelector(".menu-button")?.focus();
  }
});
watch(selected, (m, previous) => {
  if (m?.key !== previous?.key) {
    detailTab.value = "Brief";
    approveReset();
  }
});
watch(mobileNav, async (open) => {
  document.body.style.overflow =
    open || modalOpen.value || mobileDetail.value ? "hidden" : "";
  if (open) {
    navigationFocus = document.activeElement;
    await nextTick();
    document.querySelector(".nav-sheet button")?.focus();
  } else {
    await nextTick();
    if (!modalOpen.value && navigationFocus?.isConnected)
      navigationFocus.focus();
  }
});
watch(mobileDetail, (open) => {
  document.body.style.overflow =
    open || mobileNav.value || modalOpen.value ? "hidden" : "";
});
watch(registryItems, (items) => {
  if (
    selected.value &&
    !items.some(
      (m) => (m.key || m.id) === (selected.value.key || selected.value.id),
    )
  ) {
    detailOpen.value = false;
  }
});
onMounted(() => {
  wideMedia.addEventListener("change", updateWide);
  document.addEventListener("keydown", handleGlobalKey);
  clockTimer = setInterval(tickClock, 1000);
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  clearInterval(clockTimer);
  wideMedia.removeEventListener("change", updateWide);
  document.removeEventListener("keydown", handleGlobalKey);
});
</script>

<template>
  <div class="deck">
    <header class="chain-header">
      <a
        class="skip-link"
        :href="lane === 'guide' ? '#guide' : '#missions'"
        :inert="mobileNav && !isWide"
        >{{ lane === "guide" ? "Skip to the guide" : "Skip to the brief registry" }}</a
      >
      <button
        class="chain-brand"
        type="button"
        aria-label="Tallyvein home"
        @click="
          selectLane('board');
          backToTop();
        "
      >
        <img :src="logo" alt="" width="26" height="26" />
        <span class="chain-wordmark"
          ><b>TALLYVEIN</b><span>Open the brief. Settle the tally.</span></span
        >
      </button>
      <ChainReadout
        :cluster="SOLANA_CLUSTER"
        :slot="simulatedSlot"
        :epoch="simulatedEpoch"
        :clock="timeText"
        :sample="sampleFeed"
        :live="configured"
        :simulated="true"
      />
      <div class="chain-actions">
        <span class="network-pill"
          ><i class="stat-dot"></i
          >{{ configured ? SOLANA_CLUSTER.toUpperCase() : "PREVIEW" }}</span
        >
        <button
          class="button secondary wallet-button"
          :aria-label="
            connecting
              ? 'Connecting wallet'
              : account
                ? 'Open your rewards'
                : 'Connect wallet'
          "
          :disabled="connecting"
          @click="account ? openRewards() : connectWallet()"
        >
          <UiIcon name="wallet" :size="14" /><span>{{
            connecting ? "Connecting…" : shortAccount
          }}</span>
        </button>
        <button
          class="icon-button menu-button"
          :aria-expanded="mobileNav"
          aria-controls="deck-navigation"
          aria-label="Toggle navigation"
          @click="mobileNav = !mobileNav"
        >
          <UiIcon name="menu" :size="16" />
        </button>
      </div>
    </header>

    <nav class="tab-rail" aria-label="Primary navigation">
      <button
        v-for="item in lanes"
        :key="item.id"
        class="tab-button"
        :class="{ 'is-active': laneIs(item.id) }"
        :aria-current="laneIs(item.id) ? 'page' : undefined"
        @click="selectLane(item.id)"
      >
        <UiIcon :name="item.icon" :size="13" />{{ item.label
        }}<span v-if="item.id !== 'guide'" class="tab-count">{{
          item.count
        }}</span>
      </button>
    </nav>

    <div v-if="lane !== 'guide'" class="filter-bar" role="search" aria-label="Filter the brief registry">
      <div class="search-field">
        <UiIcon name="search" :size="14" />
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          placeholder="SEARCH BRIEFS, TOPICS, EVIDENCE"
          aria-label="Search briefs"
        />
        <button
          v-if="search"
          class="icon-button"
          type="button"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <UiIcon name="close" :size="13" />
        </button>
      </div>
      <div class="chip-set topics" role="group" aria-label="Filter by topic">
        <button
          v-for="topic in topics"
          :key="topic"
          class="chip"
          :aria-pressed="activeCategory === topic"
          @click="activeCategory = topic"
        >
          {{ topic
          }}<i>{{
            topic === "All topics"
              ? missionItems.length
              : missionItems.filter((m) => m.category === topic).length
          }}</i>
        </button>
      </div>
      <span class="chip-divider" aria-hidden="true"></span>
      <div class="chip-set" role="group" aria-label="Filter by state">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="chip"
          :aria-pressed="statusFilter === option.value"
          @click="statusFilter = option.value"
        >
          {{ option.label }}<i>{{ option.count }}</i>
        </button>
      </div>
      <div class="filter-tail">
        <label class="sort-field"
          ><span class="sr-only">Sort briefs</span
          ><select v-model="sortBy" aria-label="Sort briefs">
            <option value="newest">Newest record</option>
            <option value="recommended">Recommended</option>
            <option value="reward">Highest pool</option>
            <option value="deadline">Closing soon</option>
          </select></label
        >
        <button class="button ghost" :disabled="!anyFilters" @click="resetView">
          <UiIcon name="refresh" :size="13" />Reset
        </button>
      </div>
    </div>

    <main id="main-content">
      <section
        v-if="lane !== 'guide'"
        id="missions"
        class="deck-body"
        aria-labelledby="board-title"
        tabindex="-1"
      >        <h1 id="board-title" class="sr-only">
          Tallyvein brief registry — {{ viewLabel(activeView) }}
        </h1>
        <BriefRegistry
          :missions="registryItems"
          :selected-key="selected ? selected.key || selected.id : ''"
          :is-saved="isSaved"
          :loading="loading"
          :load-error="loadError"
          :configured="configured"
          :refreshing="loading"
          :view-title="registryTitle"
          :view-note="registryNote"
          :status-filter="statusFilter"
          :status-options="statusOptions"
          :filtered="anyFilters"
          :cluster="SOLANA_CLUSTER"
          :open-count="openCount"
          :pool-total="poolTotal"
          :saved-view="activeView === 'Saved'"
          :activity-view="activeView === 'My activity'"
          :wallet-connected="!!account"
          @open="openDetails"
          @save="handleSave"
          @retry="anyFilters ? resetView() : refreshMissions()"
          @reset="resetView()"
          @create="startCreate"
          @connect="connectWallet"
        />
        <BriefInspector
          :open="detailVisible"
          :sheet="mobileDetail"
          :closable="!isWide"
          :mission="selected"
          :tab="detailTab"
          :saved="selected ? isSaved(selected) : false"
          :configured="configured"
          :busy="busy"
          :evidence="evidence"
          :contribution="contribution"
          :contributions="contributions"
          :contributions-loading="contributionsLoading"
          :contributions-error="contributionsError"
          :form-errors="formErrors"
          :approval-amounts="approvalAmounts"
          :approving-id="approvingId"
          :reward-unit-label="rewardUnitLabel"
          :selected-is-creator="selectedIsCreator"
          :selected-is-open="selectedIsOpen"
          :selected-can-refund="selectedCanRefund"
          :active-transaction="activeTransaction"
          :tx-status="txStatus"
          :tx-error="txError"
          :tx-hash="txHash"
          :explorer-link="explorerLink"
          :safe-external-url="safeExternalUrl"
          :notice="notice"
          :notice-kind="noticeKind"
          :can-undo-saved-change="canUndoSavedChange"
          @close="closeDetail"
          @save="handleSave"
          @undo="undoSavedChange"
          @dismiss="dismissNotice"
          @refresh="refreshAll"
          @submit="transact('submit')"
          @fund="transact('fund')"
          @approve="approveBounty"
          @refund="transact('refund')"
          @download="downloadBrief"
          @update:tab="detailTab = $event"
          @update:evidence="evidence = $event"
          @update:contribution="contribution = $event"
          @update:approval="updateApproval"
        />
      </section>
      <button
        v-if="mobileDetail"
        class="insp-backdrop"
        aria-label="Close inspector"
        @click="closeDetail"
      ></button>
      <BriefGuide
        v-if="lane === 'guide'"
        :configured="configured"
        :cluster="SOLANA_CLUSTER"
        :program-id="SOLANA_PROGRAM_ID"
        @start="startCreate"
        @board="selectLane('board')"
      />
      <!-- Slim footer for the guide view. It stays inside main so the content
           sits in the main landmark; the fixed strip is the one contentinfo. -->
      <div v-if="lane === 'guide'" class="site-footer">
        <p class="footer-line">
          &copy; 2026 Tallyvein <i class="footer-divider">/</i> Open the brief.
          Settle the tally.<i class="footer-divider">/</i>
          {{ SOLANA_CLUSTER.toUpperCase() }}
          {{ configured && SOLANA_PROGRAM_ID ? "· PROGRAM GATED" : "· PREVIEW" }}
        </p>
        <button class="text-button" @click="backToTop">Back to top &uarr;</button>
      </div>
    </main>

    <footer
      class="status-strip"
      aria-label="Chain status"
      tabindex="0"
      title="Chain status strip — focus it to scroll"
    >
      <span class="strip-cell"
        ><i class="stat-dot" style="color: var(--cyan)"></i>CLUSTER
        <b>{{ SOLANA_CLUSTER.toUpperCase() }}</b></span
      >
      <span class="strip-cell">PROGRAM <b>{{ programLabel }}</b></span>
      <span class="strip-cell is-gate"
        >GATE <b>NO WRITES · SAMPLE TESTNET DATA</b></span
      >
      <span class="strip-cell is-legend" aria-hidden="true"
        ><span><i class="cyan"></i>OPEN</span
        ><span><i class="lime"></i>REWARD</span
        ><span><i class="violet"></i>TOPIC</span></span
      >
    </footer>

    <template v-if="mobileNav">
      <button
        class="nav-backdrop"
        aria-label="Close navigation"
        @click="mobileNav = false"
      ></button>
      <aside
        id="deck-navigation"
        class="nav-sheet is-open"
        aria-label="Deck navigation"
      >
        <div class="nav-sheet-head">
          <img :src="logo" alt="" width="22" height="22" />
          <span class="micro">tallyvein / navigation</span>
          <button
            class="icon-button"
            aria-label="Close menu"
            @click="mobileNav = false"
          >
            <UiIcon name="close" :size="15" />
          </button>
        </div>
        <nav aria-label="Deck views">
          <button
            v-for="item in lanes.filter((entry) => entry.id !== 'guide')"
            :key="`nav-${item.id}`"
            :class="{ 'is-active': laneIs(item.id) }"
            @click="selectLane(item.id)"
          >
            <UiIcon :name="item.icon" :size="15" />{{ item.label
            }}<span class="tab-count">{{ item.count }}</span>
          </button>
          <button @click="selectLane('guide')">
            <UiIcon name="book" :size="15" />Guide
          </button>
          <button @click="openRewards">
            <UiIcon name="wallet" :size="15" />Rewards
          </button>
        </nav>
        <button class="button primary" style="margin-top: 14px" @click="startCreate">
          <UiIcon name="plus" :size="14" />Post a brief
        </button>
        <div class="nav-sheet-foot">
          <div class="node-line">
            <span>Cluster</span><code>{{ SOLANA_CLUSTER }}</code>
          </div>
          <div class="node-line">
            <span>Program</span><code>{{ programLabel }}</code>
          </div>
          <div class="node-line">
            <span>Wallet</span
            ><code>{{ account ? shortAddress(account) : "Not connected" }}</code>
          </div>
        </div>
      </aside>
    </template>

    <dialog
      ref="dialog"
      class="modal"
      aria-labelledby="dialog-title"
      @cancel.prevent="closeAll"
      @click="(event) => event.target === dialog && closeAll()"
    >
      <div v-if="modalOpen" class="modal-shell">
        <div class="modal-top">
          <span class="micro">{{ modalKicker }}</span>
          <h2 id="dialog-title">{{ modalTitle }}</h2>
          <button
            class="icon-button"
            aria-label="Close dialog"
            :disabled="busy"
            @click="closeAll"
          >
            <UiIcon name="close" :size="15" />
          </button>
        </div>
        <div class="modal-scroll">
          <div v-if="walletError" class="message error" role="alert">
            {{ walletError
            }}<button
              class="text-button"
              @click="connectWallet"
              :disabled="connecting"
            >
              Try connecting again
            </button>
          </div>
          <template v-if="createOpen">
            <p class="modal-intro">
              Turn a focused question into an open brief. Define the scope, then
              review and fund it.
            </p>
            <div class="create-progress" aria-label="Creation progress">
              <span :class="{ 'is-on': createStep === 1 }"
                >01 &nbsp; Shape the brief</span
              ><UiIcon name="arrow" :size="14" /><span
                :class="{ 'is-on': createStep === 2 }"
                >02 &nbsp; Review &amp; fund</span
              >
            </div>
            <form v-if="createStep === 1" @submit.prevent="reviewDraft">
              <label for="mission-title">What should this brief answer?</label
              ><input
                id="mission-title"
                :aria-invalid="!!formErrors.title"
                :aria-describedby="formErrors.title ? 'error-title' : undefined"
                v-model="missionForm.title"
                maxlength="96"
                placeholder="Give the brief a clear, narrow title"
                required
              /><small>Up to 96 UTF-8 bytes. Keep the question focused.</small
              ><label for="mission-topic">Brief topic</label
              ><select id="mission-topic" v-model="missionForm.category">
                <option v-for="topic in topics.slice(1)" :key="topic">
                  {{ topic }}
                </option></select
              ><label for="mission-draft"
                >Your working brief
                <span class="micro" style="display: block; padding-top: 3px"
                  >optional · stays in this page until you leave</span
                ></label
              ><textarea
                id="mission-draft"
                v-model="missionForm.description"
                rows="4"
                placeholder="Define the question, scope, primary sources, and what an accepted contribution should include."
              ></textarea
              ><button class="text-button" type="button" @click="downloadBrief">
                <UiIcon name="download" :size="13" />Download your brief
              </button>
              <div class="note">
                <UiIcon name="info" :size="15" />
                <p>
                  Publish your brief on a public host, then paste its URL below.
                  Draft text is not uploaded or stored on-chain by Tallyvein.
                </p>
              </div>
              <label for="brief-uri">Public brief URL</label
              ><input
                id="brief-uri"
                :aria-invalid="!!formErrors.uri"
                :aria-describedby="formErrors.uri ? 'error-uri' : undefined"
                v-model="missionForm.uri"
                placeholder="https://… or ipfs://…"
                required
              />
              <div class="form-row">
                <div>
                  <label for="mission-reward"
                    >Brief pool · {{ rewardUnitLabel }}</label
                  ><input
                    id="mission-reward"
                    :aria-invalid="!!formErrors.reward"
                    :aria-describedby="
                      formErrors.reward ? 'error-reward' : undefined
                    "
                    v-model="missionForm.reward"
                    inputmode="decimal"
                    placeholder="0.05"
                    required
                  />
                </div>
                <div>
                  <label for="mission-deadline">Deadline · your local time</label
                  ><input
                    id="mission-deadline"
                    :aria-invalid="!!formErrors.deadline"
                    :aria-describedby="
                      formErrors.deadline ? 'error-deadline' : undefined
                    "
                    v-model="missionForm.deadline"
                    type="datetime-local"
                    :min="minimumDate"
                    required
                  />
                </div>
              </div>
              <ul
                v-if="Object.keys(formErrors).length"
                class="field-error"
                role="alert"
              >
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <button
                class="button primary full"
                style="margin-top: 16px"
                type="submit"
              >
                Review brief<UiIcon name="arrow" :size="14" />
              </button>
            </form>
            <div v-else class="review-mission">
              <span class="tag">{{ missionForm.category }}</span>
              <h3 tabindex="-1">{{ missionForm.title }}</h3>
              <dl>
                <div>
                  <dt>Public brief</dt>
                  <dd>
                    <a
                      v-if="safeExternalUrl(missionForm.uri)"
                      :href="safeExternalUrl(missionForm.uri)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ missionForm.uri }} ↗</a
                    ><span v-else>{{ missionForm.uri }}</span>
                  </dd>
                </div>
                <div>
                  <dt>Initial reward</dt>
                  <dd>{{ missionForm.reward }} {{ rewardUnitLabel }}</dd>
                </div>
                <div>
                  <dt>Submission deadline</dt>
                  <dd>{{ new Date(missionForm.deadline).toLocaleString() }}</dd>
                </div>
              </dl>
              <p>
                You will fund the reward pool and become this brief's reviewer.
                Contributors rely on your published scope and acceptance criteria.
              </p>
              <div v-if="!configured" class="note is-gate">
                <UiIcon name="info" :size="15" />
                <p>
                  Publishing is not available in this preview. Download your draft
                  to keep it for later.
                </p>
              </div>
              <ul
                v-if="Object.keys(formErrors).length"
                class="field-error"
                role="alert"
              >
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <div class="dialog-actions">
                <button class="button secondary" @click="editDraft" :disabled="busy">
                  <UiIcon name="arrowleft" :size="14" />Edit brief</button
                ><button
                  v-if="!configured"
                  class="button primary"
                  @click="downloadBrief"
                >
                  <UiIcon name="download" :size="14" />Download brief</button
                ><button
                  v-else
                  class="button primary"
                  @click="transact('create')"
                  :disabled="busy"
                >
                  {{ busy ? "Publishing…" : "Publish & fund" }}
                  <UiIcon name="arrow" :size="14" />
                </button>
              </div>
            </div>
          </template>
          <template v-else-if="rewardsOpen">
            <p class="modal-intro">
              A clear view of the work you have earned rewards for.
            </p>
            <div v-if="!account" class="empty-state">
              <UiIcon name="wallet" :size="28" />
              <h3>Connect to see your rewards.</h3>
              <p>Use the wallet you contributed with on Solana testnet.</p>
              <button
                class="button primary"
                @click="connectWallet"
                :disabled="connecting"
              >
                {{ connecting ? "Connecting…" : "Connect wallet" }}
              </button>
            </div>
            <template v-else>
              <code class="account-address">{{ account }}</code>
              <div v-if="!correctChain" class="message neutral">
                <p>Switch to Solana testnet to view and claim your rewards.</p>
                <button class="button secondary" @click="switchNetwork">
                  Switch network
                </button>
              </div>
              <div v-else-if="!configured" class="message neutral" role="status">
                <p>
                  The Solana bounty program is live on testnet, but claimable
                  rewards cannot be read until a classic SPL reward mint is
                  configured.
                </p>
                <p v-if="statsError" role="alert">{{ statsError }}</p>
                <p v-else>
                  Wallet balance:
                  {{ statsLoading ? "…" : amountText(walletBalance) }}
                  {{ SOLANA_CLUSTER }} SOL
                </p>
                <button
                  class="text-button"
                  @click="updateWalletStats"
                  :disabled="statsLoading"
                >
                  <UiIcon name="refresh" :size="13" />Refresh wallet balance
                </button>
              </div>
              <div v-else-if="statsError" class="message error" role="alert">
                {{ statsError
                }}<button class="text-button" @click="refreshAll">Try again</button>
              </div>
              <div v-else>
                <div class="reward-balance">
                  <span>Available to claim</span
                  ><strong :title="claimableAmount + ' ' + rewardSymbol"
                    >{{ statsLoading ? "…" : amountText(claimableAmount) }}
                    <small>{{ rewardSymbol }}</small></strong
                  >
                  <p>
                    Reward-token balance: {{ amountText(rewardBalance) }}
                    {{ rewardSymbol }}<br />
                    Network fee balance: {{ amountText(walletBalance) }}
                    {{ SOLANA_CLUSTER }} SOL
                  </p>
                </div>
                <p>
                  Accepted contributions and returned unallocated funds appear
                  here. Claiming sends the balance to your connected wallet.
                </p>
                <button
                  class="button primary full"
                  style="margin-top: 12px"
                  @click="transact('claim')"
                  :disabled="
                    !configured ||
                    statsLoading ||
                    busy ||
                    Number(claimableAmount) <= 0
                  "
                >
                  {{
                    busy
                      ? "Claiming…"
                      : Number(claimableAmount) > 0
                        ? "Claim rewards"
                        : "No rewards to claim yet"
                  }}<UiIcon name="wallet" :size="14" /></button
                ><button
                  class="text-button refresh-rewards"
                  @click="refreshAll"
                  :disabled="statsLoading || busy"
                >
                  <UiIcon name="refresh" :size="13" />Refresh balance
                </button>
              </div>
            </template>
            <p class="fine-print">
              {{
                configured
                  ? `The configured reward mint is on ${SOLANA_CLUSTER}; test assets have no intended monetary value.`
                  : `${SOLANA_CLUSTER} SOL has no intended monetary value.`
              }}
            </p>
          </template>
          <template v-else>
            <p class="modal-intro">
              Good briefs start with clear expectations. Here is how the tally is
              kept.
            </p>
            <div class="guide-section">
              <span>01</span>
              <div>
                <h3>For the brief writers</h3>
                <p>
                  Write a narrow question with specific acceptance criteria.
                  Publish the brief at an accessible URL, choose a deadline, and
                  fund its testnet SOL pool. You review the work and allocate
                  rewards before the deadline.
                </p>
              </div>
            </div>
            <div class="guide-section">
              <span>02</span>
              <div>
                <h3>For the evidence seekers</h3>
                <p>
                  Read the brief before beginning. Cite original sources,
                  distinguish observations from assumptions, and state what
                  remains uncertain. Publish your proof and submit the public URL.
                  The creator decides which work they accept.
                </p>
              </div>
            </div>
            <div class="guide-section">
              <span>03</span>
              <div>
                <h3>For a stronger commons</h3>
                <p>
                  Reviewers allocate rewards to accepted contributions.
                  Contributors withdraw from Rewards. A submission is not a
                  guaranteed payment; additional funding is not an investment or
                  an individually refundable deposit.
                </p>
              </div>
            </div>
            <div class="note is-gate" style="margin-top: 16px">
              <UiIcon name="info" :size="15" />
              <div>
                <p>
                  <strong>{{
                    configured
                      ? "An independent Solana testnet project"
                      : "You are exploring the preview"
                  }}</strong>
                </p>
                <p>
                  {{
                    configured
                      ? "Tallyvein runs on Solana testnet. Testnet SOL has no intended monetary value."
                      : "Sample briefs let you explore topics, save records, and draft a brief. They are examples with illustrative rewards and cannot receive transactions."
                  }}
                  This preview is educational. Keep private information off-chain.
                </p>
              </div>
            </div>
            <button
              class="button primary full"
              style="margin-top: 16px"
              @click="
                closeAll();
                selectLane('board');
              "
            >
              Find a question worth asking<UiIcon name="arrow" :size="14" />
            </button>
          </template>
          <div
            v-if="txStatus !== 'idle' && (busy || txError || txHash)"
            class="transaction-state"
            :class="{ error: txError }"
            :role="txError ? 'alert' : 'status'"
          >
            <span v-if="busy" class="spinner"></span
            ><UiIcon v-else :name="txError ? 'info' : 'check'" :size="15" />
            <p>
              {{
                txError ||
                (txStatus === "wallet"
                  ? "Confirm the transaction in your wallet."
                  : txStatus === "pending"
                    ? "Submitted. Waiting for network confirmation…"
                    : "Transaction confirmed.")
              }}<a
                v-if="explorerLink(txHash)"
                :href="explorerLink(txHash)"
                target="_blank"
                rel="noopener noreferrer"
                >View transaction ↗</a
              >
            </p>
          </div>
          <div
            v-if="notice && noticeKind !== 'bookmark' && !txHash && !txError"
            class="message neutral"
            role="status"
          >
            {{ notice }}
          </div>
        </div>
      </div>
    </dialog>

    <div v-if="walletError && !modalOpen" class="toast error" role="alert">
      <UiIcon name="info" :size="16" />
      <p>{{ walletError }}</p>
      <button
        class="icon-button"
        @click="walletError = ''"
        aria-label="Dismiss wallet error"
      >
        <UiIcon name="close" :size="15" />
      </button>
    </div>
    <div v-if="notice && !modalOpen && !walletError" class="toast" role="status">
      <UiIcon name="info" :size="16" />
      <p>
        {{ notice
        }}<a
          v-if="
            noticeKind === 'transaction' &&
            txStatus === 'confirmed' &&
            explorerLink(txHash)
          "
          :href="explorerLink(txHash)"
          target="_blank"
          rel="noopener noreferrer"
          >View confirmed transaction ↗</a
        >
      </p>
      <button
        v-if="canUndoSavedChange"
        class="text-button toast-undo"
        @click="undoSavedChange"
      >
        Undo
      </button>
      <button
        class="icon-button"
        @click="dismissNotice"
        aria-label="Dismiss notification"
      >
        <UiIcon name="close" :size="15" />
      </button>
    </div>
  </div>
</template>
