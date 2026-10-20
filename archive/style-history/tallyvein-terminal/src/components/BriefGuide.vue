<script setup>
import UiIcon from "./UiIcon.vue";

defineProps({
  configured: Boolean,
  cluster: { type: String, default: "testnet" },
  programId: { type: String, default: "" },
});
defineEmits(["start", "board", "top"]);
</script>

<template>
  <div id="guide" class="guide-view">
    <section class="guide-intro" aria-labelledby="guide-title">
      <p class="micro">the bounty loop</p>
      <h1 id="guide-title">Open the brief.<span>Settle the tally.</span></h1>
      <p>
        Tallyvein is a Solana bounty market for builder work, public evidence and
        creator-led review. A creator publishes a brief and funds a pool; builders
        answer with source-linked work; the creator reads every entry before a
        single unit is allocated.
      </p>
    </section>

    <section class="loop-grid" aria-label="How a brief moves">
      <article>
        <span class="step-label">01 <UiIcon name="plus" :size="14" /></span>
        <h2>Fund a brief</h2>
        <p>
          Write a narrow question, publish it at a public URL, set a deadline and
          fund the pool on Solana testnet.
        </p>
      </article>
      <article>
        <span class="step-label">02 <UiIcon name="link" :size="14" /></span>
        <h2>Submit evidence</h2>
        <p>
          Cite primary sources, separate observation from assumption, and submit
          the public proof URL before the deadline.
        </p>
      </article>
      <article>
        <span class="step-label">03 <UiIcon name="scale" :size="14" /></span>
        <h2>Review and settle</h2>
        <p>
          The creator allocates rewards to accepted contributions. Accepted
          contributors claim their allocation from the rewards ledger.
        </p>
      </article>
    </section>

    <div class="guide-split">
      <section aria-labelledby="rules-title">
        <p class="micro">before you begin</p>
        <h2 id="rules-title">Know the settlement rules.</h2>
        <div class="guide-notes">
          <div class="note is-gate">
            <UiIcon name="info" :size="15" />
            <p>
              <strong>Sample testnet data.</strong> The registry ships with
              illustrative briefs and testnet SOL that has no intended monetary
              value. Nothing on this desk signs or sends a transaction.
            </p>
          </div>
          <div class="note">
            <UiIcon name="ledger" :size="15" />
            <p>
              <strong>Review is creator-led.</strong> A submission is not a
              guaranteed payment. Additional funding is not an investment and is
              not an individually refundable deposit.
            </p>
          </div>
          <div class="note">
            <UiIcon name="network" :size="15" />
            <p>
              <strong>Independent project.</strong> Tallyvein is built for Solana
              testnet and is not affiliated with, endorsed by, or operated by
              Solana Labs.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title">
        <p class="micro">questions</p>
        <h2 id="faq-title">Frequently settled</h2>
        <div class="faqs" style="margin-top: 14px">
          <details>
            <summary>
              Who reviews the work?<UiIcon name="plus" :size="15" />
            </summary>
            <p>
              The bounty creator decides which contributions meet the published
              brief. Read the scope and acceptance criteria before you begin;
              submitting work does not guarantee a reward.
            </p>
          </details>
          <details>
            <summary>
              What do testnet rewards mean?<UiIcon name="plus" :size="15" />
            </summary>
            <p>
              Rewards use testnet SOL, which has no intended monetary value.
              Tallyvein has no platform token, no investment return and no
              guaranteed payout.
            </p>
          </details>
          <details>
            <summary>
              What happens to unused funds?<UiIcon name="plus" :size="15" />
            </summary>
            <p>
              After the deadline the creator can move the unallocated balance to
              their claimable rewards, then withdraw it. Additional funders do not
              receive an individual refund under the current program design.
            </p>
          </details>
          <details>
            <summary>
              Why are writes gated?<UiIcon name="plus" :size="15" />
            </summary>
            <p>
              The deployed Anchor program accepts a supplied classic SPL mint per
              brief, but the website keeps every write disabled until that mint and
              the deployment parameters are verified. Reads stay open.
            </p>
          </details>
          <details>
            <summary>
              Where do saved briefs live?<UiIcon name="plus" :size="15" />
            </summary>
            <p>
              On this device only. Bookmarks are stored in local storage under the
              tallyvein-saved key, and older project keys migrate into it without
              clearing your list.
            </p>
          </details>
        </div>
      </section>
    </div>

    <div class="insp-actions" style="margin-top: 26px">
      <button class="button primary" @click="$emit('board')">
        Open the registry<UiIcon name="arrow" :size="14" />
      </button>
      <button class="button secondary" @click="$emit('start')">
        <UiIcon name="plus" :size="14" />Post a brief
      </button>
    </div>
  </div>
</template>
