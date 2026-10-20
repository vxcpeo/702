<script setup>
import { computed, ref } from "vue";
import UiIcon from "./UiIcon.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  sheet: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
  mission: { type: Object, default: null },
  tab: { type: String, default: "Brief" },
  saved: Boolean,
  configured: Boolean,
  busy: Boolean,
  evidence: { type: String, default: "" },
  contribution: { type: String, default: "" },
  contributions: { type: Array, default: () => [] },
  contributionsLoading: Boolean,
  contributionsError: { type: String, default: "" },
  formErrors: { type: Object, default: () => ({}) },
  approvalAmounts: { type: Object, default: () => ({}) },
  approvingId: { type: [Number, String], default: null },
  rewardUnitLabel: { type: String, default: "SOL" },
  selectedIsCreator: Boolean,
  selectedIsOpen: Boolean,
  selectedCanRefund: Boolean,
  activeTransaction: { type: String, default: "" },
  txStatus: { type: String, default: "idle" },
  txError: { type: String, default: "" },
  txHash: { type: String, default: "" },
  explorerLink: { type: Function, default: () => "" },
  safeExternalUrl: { type: Function, default: () => "" },
  notice: { type: String, default: "" },
  noticeKind: { type: String, default: "" },
  canUndoSavedChange: Boolean,
});
const emit = defineEmits([
  "close",
  "save",
  "undo",
  "dismiss",
  "refresh",
  "submit",
  "fund",
  "approve",
  "refund",
  "download",
  "update:tab",
  "update:evidence",
  "update:contribution",
  "update:approval",
]);
const tabs = ["Brief", "Contribute", "Review"];
const closeButton = ref(null);

const numeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};
const awarded = computed(() => numeric(props.mission?.totalAwarded));
// A sample brief never reaches escrow: its pool is illustrative, so the split
// bar shows an empty track and the copy says so. Only a live record carries an
// escrowed balance that can be allocated.
const escrow = computed(() =>
  props.mission?.sample ? 0 : numeric(props.mission?.availableReward),
);
const pool = computed(() => awarded.value + escrow.value);
const awardedShare = computed(() =>
  pool.value > 0 ? (awarded.value / pool.value) * 100 : 0,
);
const escrowShare = computed(() =>
  pool.value > 0 ? (escrow.value / pool.value) * 100 : 0,
);
const allocation = computed(() =>
  pool.value > 0 ? Math.round((awarded.value / pool.value) * 100) : 0,
);
const amount = (value) => {
  const number = Number(value || 0);
  return number > 0 && number < 0.00001
    ? "<0.00001"
    : number.toLocaleString("en-US", { maximumFractionDigits: 5 });
};
const approvalFor = (index) => {
  const entry = props.contributions[index];
  const key = entry?.id ?? index;
  return props.approvalAmounts?.[key] ?? "";
};
const isApproving = (index) =>
  props.approvingId === (props.contributions[index]?.id ?? index);
const evidenceError = computed(() => props.formErrors?.evidence || "");
const approvalError = computed(() => props.formErrors?.approval || "");
const contributionError = computed(() => props.formErrors?.contribution || "");

function selectTab(name) {
  emit("update:tab", name);
}
async function handleTabsKey(event) {
  const current = tabs.indexOf(props.tab);
  const positions = {
    ArrowRight: (current + 1) % tabs.length,
    ArrowLeft: (current + tabs.length - 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  };
  if (!(event.key in positions)) return;
  event.preventDefault();
  const next = tabs[positions[event.key]];
  emit("update:tab", next);
  await Promise.resolve();
  document.getElementById(`insp-tab-${next}`)?.focus();
}
defineExpose({ closeButton });
</script>

<template>
  <aside
    id="brief-inspector"
    class="inspector"
    :class="{ 'is-sheet-open': sheet && open }"
    :inert="!open"
    :aria-hidden="open ? undefined : 'true'"
    aria-label="Brief inspector"
    tabindex="-1"
  >
    <div class="insp-head">
      <span class="micro">{{
        mission
          ? mission.sample
            ? "sample inspector"
            : `brief / ${mission.id}`
          : "inspector"
      }}</span>
      <button
        v-if="closable"
        ref="closeButton"
        class="icon-button close"
        aria-label="Close inspector"
        @click="emit('close')"
      >
        <UiIcon name="close" :size="15" />
      </button>
    </div>

    <div v-if="!mission" class="insp-empty">
      <h3>No brief selected.</h3>
      <p>
        Choose a row in the registry to read its scope, pool split, evidence and
        creator review in this inspector.
      </p>
    </div>

    <template v-else>
      <div class="insp-summary">
        <div class="detail-tags">
          <span class="tag">{{ mission.category }}</span>
          <span
            class="tag"
            :class="
              mission.sample
                ? 'state-sample'
                : mission.closed
                  ? 'state-closed'
                  : mission.expired
                    ? 'state-ended'
                    : 'state-open'
            "
            >{{
              mission.sample
                ? "Sample"
                : mission.closed
                  ? "Closed"
                  : mission.expired
                    ? "Ended"
                    : "Open"
            }}</span
          >
          <button
            class="text-button"
            :aria-pressed="saved"
            @click="emit('save', mission)"
          >
            <UiIcon name="bookmark" :size="13" />{{ saved ? "Saved" : "Save" }}
          </button>
        </div>
        <h3 class="insp-title">{{ mission.title }}</h3>
        <div
          v-if="notice && noticeKind === 'bookmark'"
          class="message neutral bookmark-feedback"
          role="status"
        >
          <p>{{ notice }}</p>
          <button
            v-if="canUndoSavedChange"
            class="text-button toast-undo"
            @click="emit('undo')"
          >
            Undo
          </button>
          <button
            class="icon-button"
            aria-label="Dismiss notification"
            @click="emit('dismiss')"
          >
            <UiIcon name="close" :size="14" />
          </button>
        </div>
        <div class="insp-val">
          <span>In escrow · available to allocate</span>
          <strong
            >{{ amount(escrow) }}
            <small>{{ mission.rewardSymbol || "SOL" }}</small></strong
          >
        </div>
        <p v-if="mission.sample" class="insp-copy" style="margin-top: 6px">
          Illustrative pool {{ mission.reward }} SOL. Sample records hold no
          escrow and accept no transactions.
        </p>
        <div class="split-bar">
          <div
            class="bar"
            role="img"
            :aria-label="`Awarded ${amount(awarded)}, in escrow ${amount(escrow)}, allocation ${allocation} percent`"
          >
            <i
              v-if="awardedShare > 0"
              class="awarded"
              :style="{ width: `${awardedShare}%` }"
            ></i>
            <i
              v-if="escrowShare > 0"
              class="escrow"
              :style="{ width: `${escrowShare}%` }"
            ></i>
            <i v-if="awardedShare + escrowShare <= 0" class="empty"></i>
          </div>
          <div class="split-legend">
            <span :class="{ 'is-zero': awarded <= 0 }"
              ><i class="awarded"></i>Awarded <b>{{ amount(awarded) }}</b></span
            >
            <span :class="{ 'is-zero': escrow <= 0 }"
              ><i class="escrow"></i>Escrow <b>{{ amount(escrow) }}</b></span
            >
            <span :class="{ 'is-zero': allocation <= 0 }"
              ><i class="empty"></i>Allocation <b>{{ allocation }}%</b></span
            >
          </div>
        </div>
      </div>

      <div
        class="insp-tabs"
        role="tablist"
        aria-label="Inspector sections"
        @keydown="handleTabsKey"
      >
        <button
          v-for="name in tabs"
          :id="`insp-tab-${name}`"
          :key="name"
          role="tab"
          :aria-controls="`insp-panel-${name}`"
          :class="{ 'is-active': tab === name }"
          :aria-selected="tab === name"
          :tabindex="tab === name ? 0 : -1"
          @click="selectTab(name)"
        >
          {{ name }}<span v-if="name === 'Review'">{{ contributions.length }}</span>
        </button>
      </div>

      <div
        v-show="tab === 'Brief'"
        id="insp-panel-Brief"
        class="insp-section"
        role="tabpanel"
        aria-labelledby="insp-tab-Brief"
        tabindex="0"
      >
        <h3>Brief scope</h3>
        <p class="insp-copy">{{ mission.brief || mission.description }}</p>
        <dl class="insp-facts">
          <div>
            <dt>Record</dt>
            <dd>{{ mission.sample ? "SAMPLE" : `#${mission.id}` }}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{{ mission.sample ? "Illustrative" : mission.deadline }}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>
              {{ mission.sample ? "None" : `${contributions.length} submitted` }}
            </dd>
          </div>
          <div>
            <dt>Reviewer</dt>
            <dd>{{ selectedIsCreator ? "This wallet" : "External signer" }}</dd>
          </div>
        </dl>
        <ul v-if="mission.deliverables?.length" class="insp-list">
          <li v-for="line in mission.deliverables" :key="line">
            <UiIcon name="check" :size="14" />{{ line }}
          </li>
        </ul>
        <div v-if="mission.creator" class="node-line" style="margin-top: 12px">
          <span>Bounty creator</span><code>{{ mission.creator }}</code>
        </div>
        <p v-if="safeExternalUrl(mission.descriptionURI)" style="margin: 12px 0 0">
          <a
            :href="safeExternalUrl(mission.descriptionURI)"
            target="_blank"
            rel="noopener noreferrer"
            class="button secondary"
            >Read the published brief<UiIcon name="external" :size="13"
          /></a>
        </p>
        <div class="note is-gate" style="margin-top: 12px">
          <UiIcon name="book" :size="15" />
          <div>
            <p>
              <strong>Make your proof verifiable.</strong> Cite primary sources,
              separate facts from interpretation, and make your limitations as
              clear as your findings.
            </p>
          </div>
        </div>
        <button class="button primary full" style="margin-top: 12px" @click="selectTab('Contribute')">
          Open contribution options<UiIcon name="arrow" :size="13" />
        </button>
      </div>

      <div
        v-show="tab === 'Contribute'"
        id="insp-panel-Contribute"
        class="insp-section"
        role="tabpanel"
        aria-labelledby="insp-tab-Contribute"
        tabindex="0"
      >
        <div v-if="!mission.sample && !selectedIsOpen" class="message neutral" role="status">
          This brief is {{ mission.closed ? "closed" : "past its deadline" }}.
          New funding and submissions are unavailable.
        </div>
        <form class="action-form" @submit.prevent="emit('submit')">
          <h4>Submit proof</h4>
          <p>
            Publish your findings, then link the public evidence for creator
            review.
          </p>
          <label for="insp-evidence-uri">Public evidence URL</label>
          <input
            id="insp-evidence-uri"
            :value="evidence"
            placeholder="https://… or ipfs://…"
            :aria-invalid="!!evidenceError"
            :aria-describedby="
              evidenceError ? 'insp-evidence-help insp-evidence-error' : 'insp-evidence-help'
            "
            required
            @input="emit('update:evidence', $event.target.value)"
          />
          <small id="insp-evidence-help"
            >Use a permanent public URL. Keep personal information off-chain.</small
          >
          <p v-if="evidenceError" id="insp-evidence-error" class="field-error">
            {{ evidenceError }}
          </p>
          <button
            class="button primary"
            :disabled="mission.sample || !selectedIsOpen || busy"
          >
            {{
              activeTransaction === "submit" && busy ? "Submitting…" : "Submit proof"
            }}<UiIcon name="arrow" :size="13" />
          </button>
        </form>
        <form class="action-form" @submit.prevent="emit('fund')">
          <h4>Fund the pool</h4>
          <p>
            Add to the reward pool. The creator controls allocations and any
            unspent balance after the deadline.
          </p>
          <label for="insp-fund-amount">Contribution · {{ rewardUnitLabel }}</label>
          <input
            id="insp-fund-amount"
            inputmode="decimal"
            placeholder="0.01"
            :value="contribution"
            :aria-invalid="!!contributionError"
            :aria-describedby="contributionError ? 'insp-fund-error' : undefined"
            required
            @input="emit('update:contribution', $event.target.value)"
          />
          <p v-if="contributionError" id="insp-fund-error" class="field-error">
            {{ contributionError }}
          </p>
          <button
            class="button secondary"
            :disabled="mission.sample || !selectedIsOpen || busy"
          >
            {{ activeTransaction === "fund" && busy ? "Funding…" : "Fund brief" }}
            <UiIcon name="plus" :size="13" />
          </button>
        </form>
        <div class="note is-gate" style="margin-top: 12px">
          <UiIcon name="info" :size="15" />
          <div>
            <p>
              <strong>Writes stay gated.</strong> The reward mint and deployed
              program schema must be verified before any instruction is enabled.
            </p>
            <ul class="gate-list">
              <li>Reads: registry, pool split, evidence list</li>
              <li>Gated: create, fund, submit, allocate, refund, claim</li>
            </ul>
          </div>
        </div>
      </div>

      <div
        v-show="tab === 'Review'"
        id="insp-panel-Review"
        class="insp-section"
        role="tabpanel"
        aria-labelledby="insp-tab-Review"
        tabindex="0"
      >
        <h3>Evidence and creator review</h3>
        <div v-if="contributionsLoading" class="message neutral" role="status">
          <span class="spinner"></span>Loading evidence…
        </div>
        <div v-else-if="contributionsError" class="message error" role="alert">
          {{ contributionsError }}
          <button class="text-button" @click="emit('refresh')">Try again</button>
        </div>
        <div v-else-if="!contributions.length" class="review-empty">
          <UiIcon name="book" :size="20" />
          <h4>No evidence submitted yet.</h4>
          <p>
            {{
              mission.sample
                ? "This sample shows the shape of a brief record."
                : "The first public source can open the review."
            }}
          </p>
        </div>
        <template v-else>
          <article
            v-for="(item, index) in contributions"
            :key="item.id ?? index"
            class="evidence-card"
          >
            <div class="evidence-top">
              <span class="micro">Entry {{ String(index + 1).padStart(2, "0") }}</span>
              <span class="tag" :class="item.approvedByCreator ? 'settled' : ''">{{
                item.approvedByCreator ? "Allocated" : "Pending review"
              }}</span>
            </div>
            <a
              v-if="safeExternalUrl(item.evidenceURI)"
              :href="safeExternalUrl(item.evidenceURI)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ item.evidenceURI }}<UiIcon name="external" :size="12"
            /></a>
            <p v-else>
              Evidence URI is unavailable or uses an unsupported protocol.
            </p>
            <div class="node-line">
              <span>Contributor / reward recipient</span
              ><code>{{ item.contributor }}</code>
            </div>
            <p v-if="item.approvedByCreator">
              Allocated reward: <span class="num">{{ item.approved }}</span>
              {{ rewardUnitLabel }}
            </p>
            <form
              v-if="selectedIsCreator && !item.approvedByCreator"
              class="action-form"
              @submit.prevent="emit('approve', item.id ?? index, approvalFor(index))"
            >
              <h4>Reward allocation</h4>
              <label :for="`insp-approval-${index}`">Amount · {{ rewardUnitLabel }}</label>
              <div class="inline-form">
                <input
                  :id="`insp-approval-${index}`"
                  inputmode="decimal"
                  placeholder="0.01"
                  :value="approvalFor(index)"
                  :aria-invalid="!!approvalError && isApproving(index)"
                  :aria-describedby="
                    approvalError && isApproving(index)
                      ? `insp-approval-error-${index}`
                      : undefined
                  "
                  required
                  @input="emit('update:approval', item.id ?? index, $event.target.value)"
                />
                <button class="button primary" :disabled="busy || !selectedIsOpen">
                  {{ busy && isApproving(index) ? "Approving…" : "Approve" }}
                </button>
              </div>
              <p
                v-if="approvalError && isApproving(index)"
                :id="`insp-approval-error-${index}`"
                class="field-error"
              >
                {{ approvalError }}
              </p>
            </form>
          </article>
        </template>
        <div v-if="selectedIsCreator && !mission.sample" class="refund-panel">
          <h3>Unallocated funds</h3>
          <p class="insp-copy">
            After the deadline, return any unallocated balance to the creator's
            reward-token account. Approved contribution rewards stay claimable
            separately.
          </p>
          <button
            class="button secondary"
            :disabled="!selectedCanRefund || busy"
            @click="emit('refund')"
          >
            Return unallocated funds
          </button>
          <small v-if="!selectedCanRefund" class="micro" style="display: block; margin-top: 7px"
            >Available to the creator after the deadline.</small
          >
        </div>
      </div>

      <div class="insp-section insp-foot">
        <div class="insp-actions">
          <button class="button secondary" @click="emit('download')">
            <UiIcon name="download" :size="13" />Download draft
          </button>
          <button
            class="button ghost"
            :aria-pressed="saved"
            @click="emit('save', mission)"
          >
            <UiIcon name="bookmark" :size="13" />{{ saved ? "Remove" : "Save" }}
          </button>
          <button class="button ghost" :disabled="busy" @click="emit('refresh')">
            <UiIcon name="refresh" :size="13" />Refresh
          </button>
        </div>
        <div
          v-if="txStatus !== 'idle' && (txError || txHash)"
          class="transaction-state"
          :class="{ error: txError }"
          :role="txError ? 'alert' : 'status'"
        >
          <UiIcon :name="txError ? 'info' : 'check'" :size="15" />
          <p>
            {{ txError || "Transaction confirmed." }}
            <a
              v-if="explorerLink(txHash)"
              :href="explorerLink(txHash)"
              target="_blank"
              rel="noopener noreferrer"
              >View transaction ↗</a
            >
          </p>
        </div>
      </div>
    </template>
  </aside>
</template>
