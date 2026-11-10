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
import BriefIndex from "./components/BriefIndex.vue";
import BriefDossier from "./components/BriefDossier.vue";
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
  filtered: missionFiltered,
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
  closeModal,
  isSaved,
  safeExternalUrl,
  explorerLink,
  resetFilters,
  refreshAll,
  refreshMissions,
  refreshRewardDecimals,
  updateWalletStats,
  connectWallet,
  switchNetwork,
  openCreate,
  loadContributions,
  transact,
} = useMissions();

const seal = import.meta.env.BASE_URL + "navrel-seal.svg";
/* The chart desk: a masthead, a ruled index line, one wide main plate and a
   margin that holds the edition note and the compass keys. A selected brief is
   printed as its own sheet; the draft and the rewards ledger are typeset into
   one dialog. */
const page = ref("index");
const statusFilter = ref("all");
const dialog = ref(null);
const createStep = ref(1);
const rewardsOpen = ref(false);
const approvalAmounts = ref({});
const approvingId = ref(null);
let previousFocus, navigationFocus;

const shortProgram = computed(() =>
  SOLANA_PROGRAM_ID
    ? `${SOLANA_PROGRAM_ID.slice(0, 4)}…${SOLANA_PROGRAM_ID.slice(-4)}`
    : "NOT SET",
);
const programLabel = computed(() =>
  configured.value ? shortProgram.value : `${shortProgram.value} · GATED`,
);
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
    ? missionFiltered.value
    : missionFiltered.value.filter((mission) =>
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
const topicCounts = computed(() => {
  const counts = { all: missionItems.value.length };
  for (const topic of topics.slice(1)) {
    counts[topic] = missionItems.value.filter(
      (mission) => mission.category === topic,
    ).length;
  }
  return counts;
});
const navItems = computed(() => [
  { id: "index", label: "Index", count: missionItems.value.length },
  { id: "saved", label: "Saved", count: savedCount.value },
  { id: "activity", label: "My briefs", count: 0 },
  { id: "guide", label: "Guide", count: 0 },
]);
const pageTitle = computed(
  () =>
    ({
      index: "The brief index",
      saved: "Saved briefs",
      activity: "Briefs from this wallet",
    })[page.value] || "The brief index",
);
const pageNote = computed(
  () =>
    ({
      index:
        "Illustrative briefs from the sample feed. Open a title to read its scope, pool and review state.",
      saved:
        "Kept on this device only. Nothing in this list is sent to the network.",
      activity:
        "Briefs created with the connected wallet. Connect a wallet to read your own records.",
    })[page.value] || "",
);
const modalOpen = computed(() => !!(createOpen.value || rewardsOpen.value));
const modalTitle = computed(() =>
  createOpen.value
    ? "Post a brief"
    : rewardsOpen.value
      ? "Your rewards"
      : "",
);
const modalKicker = computed(() =>
  createOpen.value
    ? `Draft sheet · step ${createStep.value} of 2`
    : "Rewards ledger",
);
const minimumDate = new Date(
  Date.now() + 60_000 - new Date().getTimezoneOffset() * 60_000,
)
  .toISOString()
  .slice(0, 16);

function resetTransactionFeedback() {
  if (!busy.value) {
    txError.value = "";
    txHash.value = "";
    txStatus.value = "idle";
    dismissNotice();
  }
}
function approveReset() {
  approvalAmounts.value = {};
  approvingId.value = null;
}
async function goPage(id) {
  mobileNav.value = false;
  selected.value = null;
  resetTransactionFeedback();
  page.value = id;
  statusFilter.value = "all";
  search.value = "";
  activeCategory.value = "All topics";
  if (id === "saved") activeView.value = "Saved";
  else if (id === "activity") activeView.value = "My activity";
  else activeView.value = "All missions";
  if (!busy.value) {
    closeModal();
    rewardsOpen.value = false;
  }
  await nextTick();
  window.scrollTo({ top: 0, behavior: "auto" });
}
function goHome() {
  goPage("index");
}
async function scrollToIndex() {
  await nextTick();
  document.getElementById("brief-index")?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}
function openDetails(mission) {
  resetTransactionFeedback();
  approveReset();
  selected.value = mission;
  nextTick(() => {
    document.getElementById("dossier-title")?.focus();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}
function closeDetail() {
  const key = selected.value?.key || selected.value?.id;
  selected.value = null;
  nextTick(() => {
    document.querySelectorAll(".bp-entry-open").forEach((entry) => {
      if (entry.dataset.key === String(key)) entry.focus();
    });
  });
}
function handleSave(mission) {
  saveMission(mission);
}
function startCreate() {
  resetTransactionFeedback();
  createStep.value = 1;
  mobileNav.value = false;
  openCreate();
}
function openRewards() {
  resetTransactionFeedback();
  mobileNav.value = false;
  rewardsOpen.value = true;
}
function closeAll() {
  if (busy.value) {
    notify("Your transaction is still in progress. Follow its status here.");
    return;
  }
  closeModal();
  rewardsOpen.value = false;
}
async function resetView() {
  resetFilters();
  statusFilter.value = "all";
  page.value = "index";
  activeView.value = "All missions";
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
function handleGlobalKey(event) {
  if (event.key === "Escape") {
    if (modalOpen.value) return;
    if (mobileNav.value) mobileNav.value = false;
    else if (selected.value) closeDetail();
    return;
  }
  if (event.key !== "Tab") return;
  const surface = modalOpen.value
    ? dialog.value
    : mobileNav.value
      ? document.querySelector("#bp-contents")
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
    dialog.value?.querySelector(".bp-dialog-body")?.scrollTo({ top: 0 });
    dialog.value?.querySelector(".bp-preview h3")?.focus();
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
function downloadBrief() {
  const f = missionForm.value;
  const unit = configured.value ? rewardSymbol.value : `${SOLANA_CLUSTER} SOL`;
  const disclaimer = configured.value
    ? "The selected reward mint is on the configured Solana network. Verify the mint and its terms before funding."
    : `Sample ${SOLANA_CLUSTER} SOL has no intended monetary value.`;
  const text = [
    "# " + (f.title || "Untitled brief"),
    "",
    "Navrel / " + f.category,
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
  anchor.download = "navrel-bounty-brief.md";
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
    else document.querySelector('.bp-key[aria-controls="bp-contents"]')?.focus();
  }
});
watch(selected, (mission, previous) => {
  if (mission?.key !== previous?.key) approveReset();
});
watch(mobileNav, async (open) => {
  document.body.style.overflow = open || modalOpen.value ? "hidden" : "";
  if (open) {
    navigationFocus = document.activeElement;
    await nextTick();
    document.querySelector("#bp-contents button")?.focus();
  } else {
    await nextTick();
    if (!modalOpen.value && navigationFocus?.isConnected)
      navigationFocus.focus();
  }
});
watch(registryItems, (items) => {
  if (
    selected.value &&
    !items.some(
      (mission) =>
        (mission.key || mission.id) === (selected.value.key || selected.value.id),
    )
  ) {
    selected.value = null;
  }
});
onMounted(() => {
  document.addEventListener("keydown", handleGlobalKey);
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleGlobalKey);
});
</script>

<template>
  <div id="bp-top" class="bp-shell">
    <a
      class="bp-skip"
      :href="page === 'guide' ? '#guide' : selected ? '#dossier-title' : '#brief-index'"
      :inert="mobileNav"
      >{{ page === "guide" ? "Skip to the field guide" : selected ? "Skip to the dossier" : "Skip to the brief index" }}</a
    >

    <div class="bp-split">
      <aside class="bp-rail" aria-label="Narrative rail">
        <div class="bp-brand">
          <button
            class="bp-brand-button"
            type="button"
            aria-label="Navrel home"
            @click="goHome"
          >
            <img class="bp-brand-mark" :src="seal" alt="" width="44" height="44" />
            <span class="bp-brand-word">Navrel<i>.</i></span>
          </button>
          <p class="bp-brand-motto">Two paths in. One record out.</p>
          <div class="bp-brand-facts">
            <span class="bp-brand-stamp">The sample edition · no. 01</span>
            <span class="bp-brand-net"
              >{{ SOLANA_CLUSTER }} · {{ configured ? "writes gated" : "preview only" }}</span
            >
          </div>
        </div>

        <nav class="bp-rail-nav" aria-label="Primary navigation">
          <a
            v-for="item in navItems"
            :key="item.id"
            class="bp-nav-row"
            :class="{ 'is-on': page === item.id }"
            :href="'#' + item.id"
            :aria-current="page === item.id ? 'page' : undefined"
            @click="goPage(item.id)"
          >
            <span class="bp-nav-label">{{ item.label }}</span>
            <span v-if="item.id !== 'guide'" class="bp-nav-count">{{ item.count }}</span>
          </a>
          <button class="bp-nav-add" type="button" aria-label="Post a brief" @click="startCreate">
            <UiIcon name="plus" :size="14" />
          </button>
        </nav>

        <template v-if="!selected && page !== 'guide'">
          <section v-if="page === 'index'" class="bp-rail-thesis" aria-labelledby="statement-title">
            <p class="bp-eyebrow">A market for careful work</p>
            <h1 id="statement-title" class="bp-display">
              Two paths in.<em>One record out.</em>
            </h1>
            <p class="bp-lede">
              Navrel is a Solana bounty market for focused research. Creators
              publish a brief with a funded pool. Builders answer with
              source-linked evidence. The creator reads every entry before a
              single unit is allocated.
            </p>
            <div class="bp-thesis-actions">
              <button class="bp-btn" type="button" @click="scrollToIndex">
                Browse the index<UiIcon name="arrow" :size="15" />
              </button>
              <button class="bp-link" type="button" @click="startCreate">
                Post a brief
              </button>
              <button class="bp-link" type="button" @click="goPage('guide')">
                Read the field guide
              </button>
            </div>
          </section>

          <section v-else class="bp-rail-thesis" aria-labelledby="page-title">
            <p class="bp-eyebrow">{{ page === "saved" ? "Your reading list" : "Wallet activity" }}</p>
            <h1 id="page-title" class="bp-display">{{ pageTitle }}</h1>
            <p class="bp-lede">{{ pageNote }}</p>
          </section>
        </template>
        <div v-else class="bp-rail-motif" aria-hidden="true"></div>

        <div class="bp-rail-actions">
          <button class="bp-btn" type="button" @click="startCreate">
            Post a brief<UiIcon name="arrow" :size="14" />
          </button>
          <button
            class="bp-wallet"
            type="button"
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
            <UiIcon name="wallet" :size="16" />
            <span>{{ connecting ? "Connecting…" : shortAccount }}</span>
          </button>
        </div>

        <div class="bp-keys" role="group" aria-label="Quick access">
          <button
            v-for="item in navItems"
            :key="`key-${item.id}`"
            class="bp-key"
            type="button"
            :class="{ 'is-on': page === item.id }"
            :data-label="item.label"
            :aria-label="item.id === 'guide' ? item.label : `${item.label}, ${item.count} records`"
            :aria-pressed="page === item.id"
            @click="goPage(item.id)"
          >
            <UiIcon
              :name="item.id === 'index' ? 'ledger' : item.id === 'saved' ? 'bookmark' : item.id === 'activity' ? 'wallet' : 'book'"
              :size="16"
            />
          </button>
          <button class="bp-key bp-key--add" type="button" aria-label="Post a brief" @click="startCreate">
            <UiIcon name="plus" :size="16" />
          </button>
          <button
            class="bp-key bp-key--menu"
            type="button"
            :aria-expanded="mobileNav"
            aria-controls="bp-contents"
            aria-label="Toggle navigation"
            @click="mobileNav = !mobileNav"
          >
            <UiIcon name="menu" :size="16" />
          </button>
        </div>
      </aside>

      <main id="main-content" class="bp-stage">
        <template v-if="page === 'guide'">
          <section aria-labelledby="guide-title">
            <BriefGuide
              :configured="configured"
              :cluster="SOLANA_CLUSTER"
              :program-id="SOLANA_PROGRAM_ID"
              @start="startCreate"
              @board="goPage('index')"
            />
          </section>
        </template>

        <template v-else-if="selected">
          <section aria-labelledby="dossier-title">
            <BriefDossier
              :mission="selected"
              :saved="isSaved(selected)"
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
              @update:evidence="evidence = $event"
              @update:contribution="contribution = $event"
              @update:approval="updateApproval"
            />
          </section>
        </template>

        <template v-else>
          <BriefIndex
            :search="search"
            :active-category="activeCategory"
            :status-filter="statusFilter"
            :sort-by="sortBy"
            :missions="registryItems"
            :is-saved="isSaved"
            :loading="loading"
            :load-error="loadError"
            :configured="configured"
            :refreshing="loading"
            :view-title="pageTitle"
            :view-note="pageNote"
            :topics="topics"
            :topic-counts="topicCounts"
            :status-options="statusOptions"
            :filtered="anyFilters"
            :cluster="SOLANA_CLUSTER"
            :open-count="openCount"
            :pool-total="poolTotal"
            :saved-view="page === 'saved'"
            :activity-view="page === 'activity'"
            :wallet-connected="!!account"
            @update:search="search = $event"
            @update:activeCategory="activeCategory = $event"
            @update:statusFilter="statusFilter = $event"
            @update:sortBy="sortBy = $event"
            @open="openDetails"
            @save="handleSave"
            @retry="anyFilters ? resetView() : refreshMissions()"
            @reset="resetView()"
            @create="startCreate"
            @connect="connectWallet"
          />
        </template>
      </main>
    </div>

    <section class="bp-band" aria-label="Edition notice">
      <div class="bp-band-inner">
        <div class="bp-band-lead">
          <p class="bp-band-head"><span>Editor's note</span></p>
          <p class="bp-band-copy">
            This is the sample edition. Four illustrative briefs show the shape
            of the market; no wallet is asked to sign and no transaction is
            sent.
          </p>
          <p class="bp-band-foot">
            {{ sampleFeed ? "Sample testnet data" : "Live read" }} · writes
            disabled
          </p>
        </div>
        <dl class="bp-band-facts">
          <div class="bp-band-fact">
            <dt class="bp-band-key">Briefs</dt>
            <dd class="bp-band-figure">{{ String(missionItems.length).padStart(2, "0") }}</dd>
          </div>
          <div class="bp-band-fact">
            <dt class="bp-band-key">Open</dt>
            <dd class="bp-band-figure">{{ String(openCount).padStart(2, "0") }}</dd>
          </div>
          <div class="bp-band-fact">
            <dt class="bp-band-key">Pool</dt>
            <dd class="bp-band-figure">{{ poolTotal }}<small>SOL</small></dd>
          </div>
        </dl>
      </div>
    </section>

    <footer class="bp-colophon" aria-label="Publication colophon">
      <div class="bp-colophon-lead">
        <p class="bp-colophon-brand">Navrel<span>.</span></p>
        <p class="bp-colophon-motto">Two paths in. One record out.</p>
      </div>
      <dl class="bp-colophon-facts">
        <div><dt>Cluster</dt><dd>{{ SOLANA_CLUSTER }}</dd></div>
        <div><dt>Program</dt><dd>{{ programLabel }}</dd></div>
        <div><dt>Edition</dt><dd>{{ sampleFeed ? "Sample testnet data" : "Live read" }}</dd></div>
        <div><dt>Network</dt><dd>Solana</dd></div>
      </dl>
      <p class="bp-colophon-fine">
        <strong>NO WRITES</strong> · <strong>SAMPLE TESTNET DATA</strong> · Every
        record is an illustrative testnet brief. Rewards carry no intended monetary
        value, no platform token or CA is live, and no action on this page signs or
        sends a transaction.
      </p>
      <div class="bp-colophon-base">
        <span>&copy; 2026 Navrel · an independent Solana testnet project</span>
        <a
          class="bp-colophon-x"
          href="https://x.com/Navrel_site"
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="Navrel on X (@Navrel_site)"
          >X · @Navrel_site<UiIcon name="external" :size="13" /></a
        >
        <button class="bp-link" type="button" @click="backToTop">
          Back to top<UiIcon name="arrowup" :size="14" />
        </button>
      </div>
    </footer>

    <template v-if="mobileNav">
      <button
        class="bp-shade"
        type="button"
        aria-label="Close navigation"
        @click="mobileNav = false"
      ></button>
      <nav id="bp-contents" class="bp-contents" aria-label="Site navigation">
        <div class="bp-contents-plate">
          <div class="bp-contents-head">
            <span>Contents</span>
            <button
              class="bp-icon-btn"
              type="button"
              aria-label="Close menu"
              @click="mobileNav = false"
            >
              <UiIcon name="close" :size="18" />
            </button>
          </div>
          <button
            v-for="item in navItems"
            :key="`row-${item.id}`"
            class="bp-contents-row"
            type="button"
            :class="{ 'is-on': page === item.id }"
            @click="goPage(item.id)"
          >
            <span>{{ item.label }}</span>
            <small v-if="item.id !== 'guide'">{{ item.count }}</small>
          </button>
          <button class="bp-contents-row" type="button" @click="startCreate">
            <span>Post a brief</span><UiIcon name="plus" :size="18" />
          </button>
          <button class="bp-contents-row" type="button" @click="account ? openRewards() : connectWallet()">
            <span>{{ account ? "Your rewards" : "Connect wallet" }}</span>
            <small>{{ account ? shortAccount : "Wallet" }}</small>
          </button>
          <div class="bp-contents-foot">
            <span>{{ SOLANA_CLUSTER }} · {{ configured ? "writes gated" : "preview only" }}</span>
            <span>{{ programLabel }}</span>
          </div>
        </div>
      </nav>
    </template>

    <dialog
      ref="dialog"
      class="bp-dialog"
      aria-labelledby="dialog-title"
      @cancel.prevent="closeAll"
      @click="(event) => event.target === dialog && closeAll()"
    >
      <div v-if="modalOpen" class="bp-dialog-plate">
        <div class="bp-dialog-head">
          <div>
            <p class="bp-dialog-tag">{{ modalKicker }}</p>
            <h2 id="dialog-title" class="bp-dialog-title">{{ modalTitle }}</h2>
          </div>
          <button
            class="bp-icon-btn"
            type="button"
            aria-label="Close dialog"
            :disabled="busy"
            @click="closeAll"
          >
            <UiIcon name="close" :size="18" />
          </button>
        </div>
        <div class="bp-dialog-body">
          <div v-if="walletError" class="bp-state is-broken" role="alert">
            <p>{{ walletError }}</p>
            <button
              class="bp-link"
              type="button"
              @click="connectWallet"
              :disabled="connecting"
            >
              Try connecting again
            </button>
          </div>

          <template v-if="createOpen">
            <p class="bp-dialog-lede">
              Turn a focused question into an open brief. Define the scope, then
              review and fund it.
            </p>
            <div class="bp-steps" aria-label="Creation progress">
              <span :class="{ 'is-live': createStep === 1 }">01 · Shape the brief</span>
              <span class="bp-step-rule" aria-hidden="true"></span>
              <span :class="{ 'is-live': createStep === 2 }">02 · Review &amp; fund</span>
            </div>
            <form v-if="createStep === 1" class="bp-form" @submit.prevent="reviewDraft">
              <div class="bp-field">
                <label class="bp-label" for="mission-title">What should this brief answer?</label>
                <input
                  id="mission-title"
                  class="bp-input"
                  :aria-invalid="!!formErrors.title"
                  :aria-describedby="formErrors.title ? 'error-title' : undefined"
                  v-model="missionForm.title"
                  maxlength="96"
                  placeholder="Give the brief a clear, narrow title"
                  required
                />
                <small class="bp-hint">Up to 96 UTF-8 bytes. Keep the question focused.</small>
              </div>
              <div class="bp-field">
                <label class="bp-label" for="mission-topic">Brief topic</label>
                <select id="mission-topic" class="bp-input" v-model="missionForm.category">
                  <option v-for="topic in topics.slice(1)" :key="topic">
                    {{ topic }}
                  </option>
                </select>
              </div>
              <div class="bp-field">
                <label class="bp-label" for="mission-draft"
                  >Your working brief
                  <span class="bp-hint">optional · stays in this page until you leave</span></label
                >
                <textarea
                  id="mission-draft"
                  class="bp-input"
                  v-model="missionForm.description"
                  rows="4"
                  placeholder="Define the question, scope, primary sources, and what an accepted contribution should include."
                ></textarea>
              </div>
              <button class="bp-link" type="button" @click="downloadBrief">
                <UiIcon name="download" :size="14" />Download your brief
              </button>
              <div class="bp-notice">
                <UiIcon name="info" :size="17" />
                <p>
                  Publish your brief on a public host, then paste its URL below.
                  Draft text is not uploaded or stored on-chain by Navrel.
                </p>
              </div>
              <div class="bp-field">
                <label class="bp-label" for="brief-uri">Public brief URL</label>
                <input
                  id="brief-uri"
                  class="bp-input"
                  :aria-invalid="!!formErrors.uri"
                  :aria-describedby="formErrors.uri ? 'error-uri' : undefined"
                  v-model="missionForm.uri"
                  placeholder="https://… or ipfs://…"
                  required
                />
              </div>
              <div class="bp-twofield">
                <div class="bp-field">
                  <label class="bp-label" for="mission-reward">Brief pool · {{ rewardUnitLabel }}</label>
                  <input
                    id="mission-reward"
                    class="bp-input"
                    :aria-invalid="!!formErrors.reward"
                    :aria-describedby="formErrors.reward ? 'error-reward' : undefined"
                    v-model="missionForm.reward"
                    inputmode="decimal"
                    placeholder="0.05"
                    required
                  />
                </div>
                <div class="bp-field">
                  <label class="bp-label" for="mission-deadline">Deadline · your local time</label>
                  <input
                    id="mission-deadline"
                    class="bp-input"
                    :aria-invalid="!!formErrors.deadline"
                    :aria-describedby="formErrors.deadline ? 'error-deadline' : undefined"
                    v-model="missionForm.deadline"
                    type="datetime-local"
                    :min="minimumDate"
                    required
                  />
                </div>
              </div>
              <ul v-if="Object.keys(formErrors).length" class="bp-errors" role="alert">
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <button class="bp-btn" type="submit">
                Review brief<UiIcon name="arrow" :size="15" />
              </button>
            </form>

            <div v-else class="bp-preview">
              <span class="bp-tag">{{ missionForm.category }}</span>
              <h3 tabindex="-1" class="bp-preview-title">{{ missionForm.title }}</h3>
              <dl class="bp-preview-index">
                <div>
                  <dt>Public brief</dt>
                  <dd>
                    <a
                      v-if="safeExternalUrl(missionForm.uri)"
                      :href="safeExternalUrl(missionForm.uri)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ missionForm.uri }} ↗</a><span v-else>{{ missionForm.uri }}</span>
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
              <p class="bp-prose">
                You will fund the reward pool and become this brief's reviewer.
                Contributors rely on your published scope and acceptance criteria.
              </p>
              <div v-if="!configured" class="bp-notice">
                <UiIcon name="info" :size="17" />
                <p>
                  Publishing is not available in this preview. Download your draft
                  to keep it for later.
                </p>
              </div>
              <ul v-if="Object.keys(formErrors).length" class="bp-errors" role="alert">
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <div class="bp-dialog-acts">
                <button class="bp-btn bp-btn--ghost" type="button" @click="editDraft" :disabled="busy">
                  <UiIcon name="arrowleft" :size="15" />Edit brief
                </button>
                <button
                  v-if="!configured"
                  class="bp-btn"
                  type="button"
                  @click="downloadBrief"
                >
                  <UiIcon name="download" :size="15" />Download brief
                </button>
                <button
                  v-else
                  class="bp-btn"
                  type="button"
                  @click="transact('create')"
                  :disabled="busy"
                >
                  {{ busy ? "Publishing…" : "Publish & fund" }}
                  <UiIcon name="arrow" :size="15" />
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="rewardsOpen">
            <p class="bp-dialog-lede">
              A clear view of the work you have earned rewards for.
            </p>
            <div v-if="!account" class="bp-void-slip">
              <UiIcon name="wallet" :size="30" />
              <h3>Connect to see your rewards.</h3>
              <p>Use the wallet you contributed with on Solana testnet.</p>
              <button class="bp-btn" type="button" @click="connectWallet" :disabled="connecting">
                {{ connecting ? "Connecting…" : "Connect wallet" }}
              </button>
            </div>
            <template v-else>
              <code class="bp-account">{{ account }}</code>
              <div v-if="!correctChain" class="bp-state">
                <p>Switch to Solana testnet to view and claim your rewards.</p>
                <button class="bp-btn bp-btn--ghost" type="button" @click="switchNetwork">
                  Switch network
                </button>
              </div>
              <div v-else-if="!configured" class="bp-state" role="status">
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
                <button class="bp-link" type="button" @click="updateWalletStats" :disabled="statsLoading">
                  <UiIcon name="refresh" :size="14" />Refresh wallet balance
                </button>
              </div>
              <div v-else-if="statsError" class="bp-state is-broken" role="alert">
                <p>{{ statsError }}</p>
                <button class="bp-link" type="button" @click="refreshAll">Try again</button>
              </div>
              <div v-else class="bp-rewards">
                <div class="bp-reward-plate">
                  <p class="bp-dialog-tag">Available to claim</p>
                  <strong class="bp-reward-num" :title="claimableAmount + ' ' + rewardSymbol"
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
                <p class="bp-prose">
                  Accepted contributions and returned unallocated funds appear
                  here. Claiming sends the balance to your connected wallet.
                </p>
                <button
                  class="bp-btn"
                  type="button"
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
                  }}<UiIcon name="wallet" :size="15" />
                </button>
                <button class="bp-link" type="button" @click="refreshAll" :disabled="statsLoading || busy">
                  <UiIcon name="refresh" :size="14" />Refresh balance
                </button>
              </div>
            </template>
            <p class="bp-fine">
              {{
                configured
                  ? `The configured reward mint is on ${SOLANA_CLUSTER}; test assets have no intended monetary value.`
                  : `${SOLANA_CLUSTER} SOL has no intended monetary value.`
              }}
            </p>
          </template>

          <div
            v-if="txStatus !== 'idle' && (busy || txError || txHash)"
            class="bp-state"
            :class="{ 'is-broken': txError }"
            :role="txError ? 'alert' : 'status'"
          >
            <span v-if="busy" class="bp-beat"></span>
            <UiIcon v-else :name="txError ? 'info' : 'check'" :size="16" />
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
                >View transaction ↗</a>
            </p>
          </div>
          <div
            v-if="notice && noticeKind !== 'bookmark' && !txHash && !txError"
            class="bp-state"
            role="status"
          >
            <p>{{ notice }}</p>
          </div>
        </div>
      </div>
    </dialog>

    <div v-if="walletError && !modalOpen" class="bp-toast is-broken" role="alert">
      <UiIcon name="info" :size="17" />
      <p>{{ walletError }}</p>
      <button class="bp-icon-btn" type="button" aria-label="Dismiss wallet error" @click="walletError = ''">
        <UiIcon name="close" :size="15" />
      </button>
    </div>
    <div v-if="notice && !modalOpen && !walletError && !selected" class="bp-toast" role="status">
      <UiIcon name="info" :size="17" />
      <p>
        {{ notice
        }}<a
          v-if="noticeKind === 'transaction' && txStatus === 'confirmed' && explorerLink(txHash)"
          :href="explorerLink(txHash)"
          target="_blank"
          rel="noopener noreferrer"
          >View confirmed transaction ↗</a>
      </p>
      <button v-if="canUndoSavedChange" class="bp-link bp-undo" type="button" @click="undoSavedChange">
        Undo
      </button>
      <button class="bp-icon-btn" type="button" aria-label="Dismiss notification" @click="dismissNotice">
        <UiIcon name="close" :size="15" />
      </button>
    </div>
  </div>
</template>
