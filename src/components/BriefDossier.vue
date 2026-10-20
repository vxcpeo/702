<script setup>
import { computed, nextTick } from "vue";
import UiIcon from "./UiIcon.vue";

const props = defineProps({
  mission: { type: Object, required: true },
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
  "update:evidence",
  "update:contribution",
  "update:approval",
]);

const numeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};
const awarded = computed(() => numeric(props.mission?.totalAwarded));
const escrow = computed(() =>
  props.mission?.sample ? 0 : numeric(props.mission?.availableReward),
);
const pool = computed(() => awarded.value + escrow.value);
const displayPool = computed(() =>
  props.mission.sample ? numeric(props.mission.reward) : escrow.value,
);
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
const stateLabel = computed(() =>
  props.mission.sample
    ? "Sample"
    : props.mission.closed
      ? "Closed"
      : props.mission.expired
        ? "Ended"
        : "Open",
);
const stateClass = computed(() => `state-${stateLabel.value.toLowerCase()}`);
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

async function goContribute() {
  document.getElementById("contribute")?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
  await nextTick();
  document.getElementById("evidence-uri")?.focus();
}
</script>

<template>
  <article class="dossier-deck" aria-labelledby="dossier-title">
    <div class="dossier-top">
      <button class="back-key" type="button" @click="emit('close')">
        <UiIcon name="arrowleft" :size="15" />Back to the index
      </button>
      <button
        class="save-key"
        type="button"
        :aria-pressed="saved"
        @click="emit('save', mission)"
      >
        <UiIcon name="bookmark" :size="14" />{{
          saved ? "Saved to your list" : "Save this brief"
        }}
      </button>
    </div>

    <div class="dossier-mast">
      <p class="kicker">
        {{
          mission.sample
            ? "Sample dossier · illustrative record"
            : `Dossier no. ${mission.id}`
        }}
      </p>
      <h1 id="dossier-title" class="dossier-title" tabindex="-1">
        {{ mission.title }}
      </h1>
      <p class="dossier-standfirst">{{ mission.brief || mission.description }}</p>
      <div class="dossier-tags">
        <span class="topic-stamp">{{ mission.category }}</span>
        <span class="state-stamp" :class="stateClass">{{ stateLabel }}</span>
      </div>
    </div>

    <div
      v-if="notice && noticeKind === 'bookmark'"
      class="readout"
      role="status"
    >
      <p>{{ notice }}</p>
      <button
        v-if="canUndoSavedChange"
        class="line-action"
        type="button"
        @click="emit('undo')"
      >
        Undo
      </button>
      <button
        class="glyph-key"
        type="button"
        aria-label="Dismiss notification"
        @click="emit('dismiss')"
      >
        <UiIcon name="close" :size="14" />
      </button>
    </div>

    <dl class="fact-ticker">
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

    <section class="pool-deck" aria-label="Reward pool">
      <div class="pool-figure">
        <p class="kicker">
          {{
            mission.sample
              ? "Illustrative pool · sample record"
              : "In escrow · available to allocate"
          }}
        </p>
        <strong>{{ amount(displayPool) }} <small>{{ mission.rewardSymbol || "SOL" }}</small></strong>
        <p v-if="mission.sample" class="fine-print">
          Illustrative pool {{ mission.reward }} SOL. Sample records hold no escrow
          and accept no transactions.
        </p>
      </div>
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
    </section>

    <div class="dossier-body">
      <section id="scope" class="dossier-section" aria-labelledby="scope-title">
        <div class="section-head">
          <span class="section-no">01</span>
          <h2 id="scope-title">Brief scope</h2>
        </div>
        <p class="dossier-copy">{{ mission.brief || mission.description }}</p>
        <ul v-if="mission.deliverables?.length" class="deliverables">
          <li v-for="line in mission.deliverables" :key="line">
            <UiIcon name="check" :size="15" />{{ line }}
          </li>
        </ul>
        <div v-if="mission.creator" class="byline-row">
          <span>Bounty creator</span><code>{{ mission.creator }}</code>
        </div>
        <p v-if="safeExternalUrl(mission.descriptionURI)" class="published-link">
          <a
            :href="safeExternalUrl(mission.descriptionURI)"
            target="_blank"
            rel="noopener noreferrer"
            class="ghost-action"
            >Read the published brief<UiIcon name="external" :size="14"
          /></a>
        </p>
        <div class="margin-note">
          <UiIcon name="quote" :size="19" />
          <p>
            <strong>Make your proof verifiable.</strong> Cite primary sources,
            separate facts from interpretation, and make your limitations as clear
            as your findings.
          </p>
        </div>
        <div class="section-actions">
          <button class="key-action" type="button" @click="goContribute">
            Open contribution options<UiIcon name="arrow" :size="15" />
          </button>
        </div>
      </section>

      <section id="contribute" class="dossier-section" aria-labelledby="contribute-title">
        <div class="section-head">
          <span class="section-no">02</span>
          <h2 id="contribute-title">Submit evidence &amp; fund the pool</h2>
        </div>
        <div
          v-if="!mission.sample && !selectedIsOpen"
          class="readout is-static"
          role="status"
        >
          <p>
            This brief is {{ mission.closed ? "closed" : "past its deadline" }}.
            New funding and submissions are unavailable.
          </p>
        </div>
        <div class="entry-grid">
          <form class="entry-form" @submit.prevent="emit('submit')">
            <p class="form-kicker">Entry one</p>
            <h3>Submit proof</h3>
            <p class="form-intro">
              Publish your findings, then link the public evidence for creator
              review.
            </p>
            <label for="evidence-uri">Public evidence URL</label>
            <input
              id="evidence-uri"
              :value="evidence"
              placeholder="https://… or ipfs://…"
              :aria-invalid="!!evidenceError"
              :aria-describedby="
                evidenceError ? 'evidence-help evidence-error' : 'evidence-help'
              "
              required
              @input="emit('update:evidence', $event.target.value)"
            />
            <small id="evidence-help"
              >Use a permanent public URL. Keep personal information off-chain.</small
            >
            <p v-if="evidenceError" id="evidence-error" class="field-error">
              {{ evidenceError }}
            </p>
            <button
              class="key-action wide"
              :disabled="mission.sample || !selectedIsOpen || busy"
            >
              {{
                activeTransaction === "submit" && busy
                  ? "Submitting…"
                  : "Submit proof"
              }}<UiIcon name="arrow" :size="15" />
            </button>
          </form>

          <form class="entry-form" @submit.prevent="emit('fund')">
            <p class="form-kicker">Entry two</p>
            <h3>Fund the pool</h3>
            <p class="form-intro">
              Add to the reward pool. The creator controls allocations and any
              unspent balance after the deadline.
            </p>
            <label for="fund-amount">Contribution · {{ rewardUnitLabel }}</label>
            <input
              id="fund-amount"
              inputmode="decimal"
              placeholder="0.01"
              :value="contribution"
              :aria-invalid="!!contributionError"
              :aria-describedby="contributionError ? 'fund-error' : undefined"
              required
              @input="emit('update:contribution', $event.target.value)"
            />
            <p v-if="contributionError" id="fund-error" class="field-error">
              {{ contributionError }}
            </p>
            <button
              class="ghost-action wide"
              :disabled="mission.sample || !selectedIsOpen || busy"
            >
              {{ activeTransaction === "fund" && busy ? "Funding…" : "Fund brief" }}
              <UiIcon name="plus" :size="15" />
            </button>
          </form>
        </div>
        <div class="margin-note is-gate">
          <UiIcon name="info" :size="19" />
          <div>
            <p>
              <strong>Writes stay gated.</strong> The reward mint and deployed
              program schema must be verified before any instruction is enabled.
            </p>
            <ul class="gate-list">
              <li>Reads: index, pool split, evidence list</li>
              <li>Gated: create, fund, submit, allocate, refund, claim</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="review" class="dossier-section" aria-labelledby="review-title">
        <div class="section-head">
          <span class="section-no">03</span>
          <h2 id="review-title">Evidence and creator review</h2>
        </div>
        <div v-if="contributionsLoading" class="readout is-static" role="status">
          <span class="spinner"></span>
          <p>Loading evidence…</p>
        </div>
        <div v-else-if="contributionsError" class="readout is-alert" role="alert">
          <p>{{ contributionsError }}</p>
          <button class="line-action" type="button" @click="emit('refresh')">
            Try again
          </button>
        </div>
        <div v-else-if="!contributions.length" class="review-empty">
          <UiIcon name="book" :size="24" />
          <h3>No evidence submitted yet.</h3>
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
            class="evidence-row"
          >
            <div class="evidence-head">
              <span class="kicker">Entry {{ String(index + 1).padStart(2, "0") }}</span>
              <span class="state-stamp" :class="item.approvedByCreator ? 'state-open' : 'state-sample'">{{
                item.approvedByCreator ? "Allocated" : "Pending review"
              }}</span>
            </div>
            <a
              v-if="safeExternalUrl(item.evidenceURI)"
              :href="safeExternalUrl(item.evidenceURI)"
              target="_blank"
              rel="noopener noreferrer"
              class="evidence-link"
              >{{ item.evidenceURI }}<UiIcon name="external" :size="13"
            /></a>
            <p v-else>
              Evidence URI is unavailable or uses an unsupported protocol.
            </p>
            <div class="byline-row">
              <span>Contributor / reward recipient</span
              ><code>{{ item.contributor }}</code>
            </div>
            <p v-if="item.approvedByCreator" class="allocation-line">
              Allocated reward: <b>{{ item.approved }}</b> {{ rewardUnitLabel }}
            </p>
            <form
              v-if="selectedIsCreator && !item.approvedByCreator"
              class="entry-form is-inline"
              @submit.prevent="emit('approve', item.id ?? index, approvalFor(index))"
            >
              <h4>Reward allocation</h4>
              <label :for="`approval-amount-${index}`">Amount · {{ rewardUnitLabel }}</label>
              <div class="inline-input">
                <input
                  :id="`approval-amount-${index}`"
                  inputmode="decimal"
                  placeholder="0.01"
                  :value="approvalFor(index)"
                  :aria-invalid="!!approvalError && isApproving(index)"
                  :aria-describedby="
                    approvalError && isApproving(index)
                      ? `approval-error-${index}`
                      : undefined
                  "
                  required
                  @input="emit('update:approval', item.id ?? index, $event.target.value)"
                />
                <button class="key-action" :disabled="busy || !selectedIsOpen">
                  {{ busy && isApproving(index) ? "Approving…" : "Approve" }}
                </button>
              </div>
              <p
                v-if="approvalError && isApproving(index)"
                :id="`approval-error-${index}`"
                class="field-error"
              >
                {{ approvalError }}
              </p>
            </form>
          </article>
        </template>
        <div v-if="selectedIsCreator && !mission.sample" class="refund-block">
          <h3>Unallocated funds</h3>
          <p class="dossier-copy">
            After the deadline, return any unallocated balance to the creator's
            reward-token account. Approved contribution rewards stay claimable
            separately.
          </p>
          <button
            class="ghost-action"
            :disabled="!selectedCanRefund || busy"
            type="button"
            @click="emit('refund')"
          >
            Return unallocated funds
          </button>
          <small v-if="!selectedCanRefund" class="fine-print"
            >Available to the creator after the deadline.</small
          >
        </div>
      </section>

      <div class="dossier-foot">
        <div class="dossier-actions">
          <button class="ghost-action" type="button" @click="emit('download')">
            <UiIcon name="download" :size="14" />Download draft
          </button>
          <button
            class="line-action"
            type="button"
            :aria-pressed="saved"
            @click="emit('save', mission)"
          >
            <UiIcon name="bookmark" :size="14" />{{ saved ? "Remove" : "Save" }}
          </button>
          <button
            class="line-action"
            type="button"
            :disabled="busy"
            @click="emit('refresh')"
          >
            <UiIcon name="refresh" :size="14" />Refresh
          </button>
        </div>
        <div
          v-if="txStatus !== 'idle' && (txError || txHash)"
          class="readout is-static"
          :class="{ 'is-alert': txError }"
          :role="txError ? 'alert' : 'status'"
        >
          <UiIcon :name="txError ? 'info' : 'check'" :size="16" />
          <p>
            {{ txError || "Transaction confirmed." }}
            <a
              v-if="explorerLink(txHash)"
              :href="explorerLink(txHash)"
              target="_blank"
              rel="noopener noreferrer"
              >View transaction ↗</a>
          </p>
        </div>
      </div>
    </div>
  </article>
</template>
