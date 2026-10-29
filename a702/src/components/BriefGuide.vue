<script setup>
import UiIcon from "./UiIcon.vue";

defineProps({
  configured: Boolean,
  cluster: { type: String, default: "testnet" },
  programId: { type: String, default: "" },
});
defineEmits(["start", "board"]);
</script>

<template>
  <article id="guide" class="guide">
    <div class="guide-head">
      <p class="rail-kicker">Field guide · edition one</p>
      <h1 id="guide-title" class="guide-title">How a brief becomes a record.</h1>
      <p class="guide-lede">
        Colopha is a Solana bounty market for builder work, public evidence and
        creator-led review. A creator publishes a brief and funds a pool; builders
        answer with source-linked work; the creator reads every entry before a
        single unit is allocated.
      </p>
      <p class="guide-meta">
        Compiled for Solana {{ cluster }} · sample edition ·
        {{ configured ? "writes gated" : "preview only" }}
      </p>
    </div>

    <ol class="stair" aria-label="How a brief moves">
      <li class="stair-plate">
        <span class="stair-no">01</span>
        <h2 class="stair-title">Write a narrow brief.</h2>
        <p class="stair-copy">
          Ask one focused question. Publish it at a public URL, set a deadline,
          and fund the reward pool on Solana testnet. The brief is the contract
          every contribution is read against.
        </p>
      </li>
      <li class="stair-plate">
        <span class="stair-no">02</span>
        <h2 class="stair-title">Submit verifiable evidence.</h2>
        <p class="stair-copy">
          Cite primary sources, separate observation from assumption, and make
          your limitations as clear as your findings. Submit the public proof URL
          before the deadline.
        </p>
      </li>
      <li class="stair-plate">
        <span class="stair-no">03</span>
        <h2 class="stair-title">Read every entry, then close the record.</h2>
        <p class="stair-copy">
          The creator allocates rewards to accepted contributions. Accepted
          contributors claim their allocation from the rewards ledger. A
          submission is never a guaranteed payment.
        </p>
      </li>
    </ol>

    <section class="creed" aria-labelledby="rules-title">
      <div class="creed-head">
        <div>
          <p class="rail-kicker">Before you begin</p>
          <h2 id="rules-title" class="creed-title">The rules of settlement.</h2>
        </div>
      </div>
      <div class="creed-grid">
        <div class="creed-plate">
          <h3>Sample testnet data.</h3>
          <p>
            The index ships with illustrative briefs and testnet SOL that has no
            intended monetary value. Nothing on this desk signs or sends a
            transaction.
          </p>
        </div>
        <div class="creed-plate">
          <h3>Review is creator-led.</h3>
          <p>
            A submission is not a guaranteed payment. Additional funding is not an
            investment and is not an individually refundable deposit.
          </p>
        </div>
        <div class="creed-plate">
          <h3>An independent project.</h3>
          <p>
            Colopha is built for Solana testnet and is not affiliated with,
            endorsed by, or operated by Solana Labs. Keep private information
            off-chain.
          </p>
        </div>
      </div>
    </section>

    <section class="creed" aria-labelledby="faq-title">
      <div class="creed-head">
        <div>
          <p class="rail-kicker">Common questions</p>
          <h2 id="faq-title" class="creed-title">Frequently asked</h2>
        </div>
      </div>
      <div class="faq-stack">
        <details class="faq-row">
          <summary class="faq-q">
            Who reviews the work?<UiIcon name="plus" :size="15" />
          </summary>
          <p class="faq-a">
            The bounty creator decides which contributions meet the published
            brief. Read the scope and acceptance criteria before you begin;
            submitting work does not guarantee a reward.
          </p>
        </details>
        <details class="faq-row">
          <summary class="faq-q">
            What do testnet rewards mean?<UiIcon name="plus" :size="15" />
          </summary>
          <p class="faq-a">
            Rewards use {{ cluster }} SOL, which has no intended monetary value.
            Colopha has no platform token, no investment return and no guaranteed
            payout.
          </p>
        </details>
        <details class="faq-row">
          <summary class="faq-q">
            What happens to unused funds?<UiIcon name="plus" :size="15" />
          </summary>
          <p class="faq-a">
            After the deadline the creator can return the unallocated balance to
            their reward-token account, then withdraw it. Additional funders do not
            receive an individual refund under the current program design.
          </p>
        </details>
        <details class="faq-row">
          <summary class="faq-q">
            Why are writes gated?<UiIcon name="plus" :size="15" />
          </summary>
          <p class="faq-a">
            The deployed Anchor program accepts a supplied classic SPL mint per
            brief, but the website keeps every write disabled until that mint and
            the deployment parameters are verified. Reads stay open.
          </p>
        </details>
        <details class="faq-row">
          <summary class="faq-q">
            Where do saved briefs live?<UiIcon name="plus" :size="15" />
          </summary>
          <p class="faq-a">
            On this device only. Bookmarks are stored in local storage under the
            colopha-saved key, and older project keys migrate into it without
            clearing your list.
          </p>
        </details>
      </div>
    </section>

    <div class="guide-acts">
      <button class="chart-btn" type="button" @click="$emit('board')">
        Open the index<UiIcon name="arrow" :size="15" />
      </button>
      <button class="chart-btn chart-btn--hollow" type="button" @click="$emit('start')">
        <UiIcon name="plus" :size="15" />Post a brief
      </button>
    </div>
  </article>
</template>
