<template>
  <div id="press-top" class="press">
    <a
      class="press-skip"
      :href="page === 'guide' ? '#guide' : selected ? '#dossier-title' : '#brief-index'"
      :inert="mobileNav"
      >{{ page === "guide" ? "Skip to the field guide" : selected ? "Skip to the dossier" : "Skip to the brief index" }}</a
    >

    <header class="mast">
      <button class="mast-brand" type="button" aria-label="Ledgiva home" @click="goHome">
        <img class="mast-mark" :src="seal" alt="" width="46" height="46" />
        <span class="mast-name">Ledgiva<i>.</i></span>
        <span class="mast-motto">Two paths in. One record out.</span>
      </button>
      <div class="mast-side">
        <div class="mast-flag">
          <span class="stamp">The sample edition · no. 01</span>
          <span>{{ SOLANA_CLUSTER }} · {{ configured ? "writes gated" : "preview only" }}</span>
        </div>
        <div class="mast-acts">
          <button class="press-btn" type="button" @click="startCreate">
            Post a brief<UiIcon name="arrow" :size="14" />
          </button>
          <button
            class="wallet-tag"
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
      </div>
    </header>

    <main id="main-content" class="stage">
      <nav class="route-wall" aria-label="Primary navigation">
        <a
          v-for="item in navItems"
          :key="item.id"
          class="route-tile"
          :class="{ 'is-lit': page === item.id }"
          :href="'#' + item.id"
          :aria-current="page === item.id ? 'page' : undefined"
          @click="goPage(item.id)"
        >
          <span class="tile-label">{{ item.label }}</span>
          <span v-if="item.id !== 'guide'" class="tile-count">{{ item.count }}</span>
        </a>
      </nav>

      <template v-if="page === 'guide'">
        <section id="guide" class="scene" aria-labelledby="guide-title">
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
        <section class="scene" aria-labelledby="dossier-title">
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
        <section v-if="page === 'index'" class="scene scene--open" aria-labelledby="statement-title">
          <div class="scene-body">
            <p class="kicker">A market for careful work</p>
            <h1 id="statement-title" class="poster-title">
              Two paths in.<em>One record out.</em>
            </h1>
            <p class="poster-lede">
              Ledgiva is a Solana bounty market for focused research. Creators
              publish a brief with a funded pool. Builders answer with
              source-linked evidence. The creator reads every entry before a
              single unit is allocated.
            </p>
            <div class="poster-actions">
              <button class="press-btn" type="button" @click="scrollToIndex">
                Browse the index<UiIcon name="arrow" :size="15" />
              </button>
              <button class="press-link" type="button" @click="startCreate">
                Post a brief
              </button>
              <button class="press-link" type="button" @click="goPage('guide')">
                Read the field guide
              </button>
            </div>
          </div>
          <section class="note-plate" aria-label="Edition notice">
            <p class="note-head"><span>Editor's note</span><span>01</span></p>
            <p class="note-copy">
              This is the sample edition. Four illustrative briefs show the
              shape of the market; no wallet is asked to sign and no
              transaction is sent.
            </p>
            <div class="fact-strip">
              <div class="fact">
                <span class="fact-label">Briefs</span>
                <span class="fact-value">{{ String(missionItems.length).padStart(2, "0") }}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Open</span>
                <span class="fact-value">{{ String(openCount).padStart(2, "0") }}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Pool</span>
                <span class="fact-value">{{ poolTotal }}<small>SOL</small></span>
              </div>
            </div>
            <p class="fact-foot">
              {{ sampleFeed ? "Sample testnet data" : "Live read" }} · writes
              disabled
            </p>
          </section>
        </section>

        <section v-else class="scene scene--open" aria-labelledby="page-title">
          <div class="scene-body">
            <p class="page-tag">{{ page === "saved" ? "Your reading list" : "Wallet activity" }}</p>
            <h1 id="page-title" class="poster-title">{{ pageTitle }}</h1>
            <p class="poster-lede">{{ pageNote }}</p>
          </div>
        </section>

        <section class="scene scene--board" aria-labelledby="index-title">
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
        </section>
      </template>
    </main>

    <footer class="press-foot" aria-label="Publication colophon">
      <div class="foot-plate">
        <div>
          <p class="foot-brand">Ledgiva<span>.</span></p>
          <p class="foot-motto">Two paths in. One record out.</p>
        </div>
        <dl class="foot-facts">
          <div><dt>Cluster</dt><dd>{{ SOLANA_CLUSTER }}</dd></div>
          <div><dt>Program</dt><dd>{{ programLabel }}</dd></div>
          <div><dt>Edition</dt><dd>{{ sampleFeed ? "Sample testnet data" : "Live read" }}</dd></div>
          <div><dt>Network</dt><dd>Solana</dd></div>
        </dl>
      </div>
      <p class="foot-fine">
        <strong>NO WRITES</strong> · <strong>SAMPLE TESTNET DATA</strong> · Every
        record is an illustrative testnet brief. Rewards carry no intended monetary
        value, no platform token or CA is live, and no action on this page signs or
        sends a transaction.
      </p>
      <div class="foot-base">
        <span>&copy; 2026 Ledgiva · an independent Solana testnet project</span>
        <button class="press-link" type="button" @click="backToTop">
          Back to top<UiIcon name="arrowup" :size="14" />
        </button>
      </div>
    </footer>

    <div class="dock" role="group" aria-label="Quick access">
      <button
        v-for="item in navItems"
        :key="`dock-${item.id}`"
        class="dock-key"
        type="button"
        :class="{ 'is-lit': page === item.id }"
        :data-label="item.label"
        :aria-label="item.id === 'guide' ? item.label : `${item.label}, ${item.count} records`"
        :aria-pressed="page === item.id"
        @click="goPage(item.id)"
      >
        <UiIcon
          :name="item.id === 'index' ? 'ledger' : item.id === 'saved' ? 'bookmark' : item.id === 'activity' ? 'wallet' : 'book'"
          :size="19"
        />
      </button>
      <button class="dock-key dock-key--end" type="button" aria-label="Post a brief" @click="startCreate">
        <UiIcon name="plus" :size="19" />
      </button>
      <button
        class="dock-key dock-key--end"
        type="button"
        :aria-expanded="mobileNav"
        aria-controls="site-contents"
        aria-label="Toggle navigation"
        @click="mobileNav = !mobileNav"
      >
        <UiIcon name="menu" :size="19" />
      </button>
    </div>

    <template v-if="mobileNav">
      <button
        class="dock-sheet"
        type="button"
        aria-label="Close navigation"
        @click="mobileNav = false"
      ></button>
      <nav id="site-contents" class="dock-sheet" aria-label="Site navigation">
        <div class="dock-plate">
          <div class="dock-plate-head">
            <span>Contents</span>
            <button
              class="ghost-key"
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
            class="dock-row"
            type="button"
            :class="{ 'is-lit': page === item.id }"
            @click="goPage(item.id)"
          >
            <span>{{ item.label }}</span>
            <small v-if="item.id !== 'guide'">{{ item.count }}</small>
          </button>
          <button class="dock-row" type="button" @click="startCreate">
            <span>Post a brief</span><UiIcon name="plus" :size="18" />
          </button>
          <button class="dock-row" type="button" @click="account ? openRewards() : connectWallet()">
            <span>{{ account ? "Your rewards" : "Connect wallet" }}</span>
            <small>{{ account ? shortAccount : "Wallet" }}</small>
          </button>
          <div class="dock-plate-foot">
            <span>{{ SOLANA_CLUSTER }} · {{ configured ? "writes gated" : "preview only" }}</span>
            <span>{{ programLabel }}</span>
          </div>
        </div>
      </nav>
    </template>

    <dialog
      ref="dialog"
      class="sheet"
      aria-labelledby="dialog-title"
      @cancel.prevent="closeAll"
      @click="(event) => event.target === dialog && closeAll()"
    >
      <div v-if="modalOpen" class="sheet-plate">
        <div class="sheet-head">
          <div>
            <p class="page-tag">{{ modalKicker }}</p>
            <h2 id="dialog-title">{{ modalTitle }}</h2>
          </div>
          <button
            class="ghost-key"
            type="button"
            aria-label="Close dialog"
            :disabled="busy"
            @click="closeAll"
          >
            <UiIcon name="close" :size="18" />
          </button>
        </div>
        <div class="sheet-body">
          <div v-if="walletError" class="readout-strip is-fault" role="alert">
            <p>{{ walletError }}</p>
            <button
              class="press-link"
              type="button"
              @click="connectWallet"
              :disabled="connecting"
            >
              Try connecting again
            </button>
          </div>

          <template v-if="createOpen">
            <p class="sheet-intro">
              Turn a focused question into an open brief. Define the scope, then
              review and fund it.
            </p>
            <div class="step-strip" aria-label="Creation progress">
              <span :class="{ 'is-now': createStep === 1 }">01 · Shape the brief</span>
              <span class="step-line" aria-hidden="true"></span>
              <span :class="{ 'is-now': createStep === 2 }">02 · Review &amp; fund</span>
            </div>
            <form v-if="createStep === 1" class="sheet-form" @submit.prevent="reviewDraft">
              <div class="field">
                <label class="field-label" for="mission-title">What should this brief answer?</label>
                <input
                  id="mission-title"
                  class="press-input"
                  :aria-invalid="!!formErrors.title"
                  :aria-describedby="formErrors.title ? 'error-title' : undefined"
                  v-model="missionForm.title"
                  maxlength="96"
                  placeholder="Give the brief a clear, narrow title"
                  required
                />
                <small class="field-help">Up to 96 UTF-8 bytes. Keep the question focused.</small>
              </div>
              <div class="field">
                <label class="field-label" for="mission-topic">Brief topic</label>
                <select id="mission-topic" class="press-select" v-model="missionForm.category">
                  <option v-for="topic in topics.slice(1)" :key="topic">
                    {{ topic }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label class="field-label" for="mission-draft"
                  >Your working brief
                  <span class="field-help">optional · stays in this page until you leave</span></label
                >
                <textarea
                  id="mission-draft"
                  class="press-area"
                  v-model="missionForm.description"
                  rows="4"
                  placeholder="Define the question, scope, primary sources, and what an accepted contribution should include."
                ></textarea>
              </div>
              <button class="press-link" type="button" @click="downloadBrief">
                <UiIcon name="download" :size="14" />Download your brief
              </button>
              <div class="sheet-note">
                <UiIcon name="info" :size="17" />
                <p>
                  Publish your brief on a public host, then paste its URL below.
                  Draft text is not uploaded or stored on-chain by Ledgiva.
                </p>
              </div>
              <div class="field">
                <label class="field-label" for="brief-uri">Public brief URL</label>
                <input
                  id="brief-uri"
                  class="press-input"
                  :aria-invalid="!!formErrors.uri"
                  :aria-describedby="formErrors.uri ? 'error-uri' : undefined"
                  v-model="missionForm.uri"
                  placeholder="https://… or ipfs://…"
                  required
                />
              </div>
              <div class="two-entry">
                <div class="field">
                  <label class="field-label" for="mission-reward">Brief pool · {{ rewardUnitLabel }}</label>
                  <input
                    id="mission-reward"
                    class="press-input"
                    :aria-invalid="!!formErrors.reward"
                    :aria-describedby="formErrors.reward ? 'error-reward' : undefined"
                    v-model="missionForm.reward"
                    inputmode="decimal"
                    placeholder="0.05"
                    required
                  />
                </div>
                <div class="field">
                  <label class="field-label" for="mission-deadline">Deadline · your local time</label>
                  <input
                    id="mission-deadline"
                    class="press-input"
                    :aria-invalid="!!formErrors.deadline"
                    :aria-describedby="formErrors.deadline ? 'error-deadline' : undefined"
                    v-model="missionForm.deadline"
                    type="datetime-local"
                    :min="minimumDate"
                    required
                  />
                </div>
              </div>
              <ul v-if="Object.keys(formErrors).length" class="error-list" role="alert">
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <button class="press-btn" type="submit">
                Review brief<UiIcon name="arrow" :size="15" />
              </button>
            </form>

            <div v-else class="review-brief review-slip">
              <span class="stamp stamp--red">{{ missionForm.category }}</span>
              <h3 tabindex="-1">{{ missionForm.title }}</h3>
              <dl class="review-list">
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
              <p>
                You will fund the reward pool and become this brief's reviewer.
                Contributors rely on your published scope and acceptance criteria.
              </p>
              <div v-if="!configured" class="sheet-note">
                <UiIcon name="info" :size="17" />
                <p>
                  Publishing is not available in this preview. Download your draft
                  to keep it for later.
                </p>
              </div>
              <ul v-if="Object.keys(formErrors).length" class="error-list" role="alert">
                <li
                  v-for="(error, field) in formErrors"
                  :key="field"
                  :id="`error-${field}`"
                >
                  {{ error }}
                </li>
              </ul>
              <div class="sheet-actions">
                <button class="press-btn press-btn--ghost" type="button" @click="editDraft" :disabled="busy">
                  <UiIcon name="arrowleft" :size="15" />Edit brief
                </button>
                <button
                  v-if="!configured"
                  class="press-btn"
                  type="button"
                  @click="downloadBrief"
                >
                  <UiIcon name="download" :size="15" />Download brief
                </button>
                <button
                  v-else
                  class="press-btn"
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
            <p class="sheet-intro">
              A clear view of the work you have earned rewards for.
            </p>
            <div v-if="!account" class="review-empty">
              <UiIcon name="wallet" :size="30" />
              <h3>Connect to see your rewards.</h3>
              <p>Use the wallet you contributed with on Solana testnet.</p>
              <button class="press-btn" type="button" @click="connectWallet" :disabled="connecting">
                {{ connecting ? "Connecting…" : "Connect wallet" }}
              </button>
            </div>
            <template v-else>
              <code class="account-line">{{ account }}</code>
              <div v-if="!correctChain" class="readout-strip is-quiet">
                <p>Switch to Solana testnet to view and claim your rewards.</p>
                <button class="press-btn press-btn--ghost" type="button" @click="switchNetwork">
                  Switch network
                </button>
              </div>
              <div v-else-if="!configured" class="readout-strip is-quiet" role="status">
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
                <button class="press-link" type="button" @click="updateWalletStats" :disabled="statsLoading">
                  <UiIcon name="refresh" :size="14" />Refresh wallet balance
                </button>
              </div>
              <div v-else-if="statsError" class="readout-strip is-fault" role="alert">
                <p>{{ statsError }}</p>
                <button class="press-link" type="button" @click="refreshAll">Try again</button>
              </div>
              <div v-else>
                <div class="reward-plate">
                  <p class="page-tag">Available to claim</p>
                  <strong class="reward-figure" :title="claimableAmount + ' ' + rewardSymbol"
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
                  class="press-btn"
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
                <button class="press-link" type="button" @click="refreshAll" :disabled="statsLoading || busy">
                  <UiIcon name="refresh" :size="14" />Refresh balance
                </button>
              </div>
            </template>
            <p class="fine-note">
              {{
                configured
                  ? `The configured reward mint is on ${SOLANA_CLUSTER}; test assets have no intended monetary value.`
                  : `${SOLANA_CLUSTER} SOL has no intended monetary value.`
              }}
            </p>
          </template>

          <div
            v-if="txStatus !== 'idle' && (busy || txError || txHash)"
            class="readout-strip is-quiet"
            :class="{ 'is-fault': txError }"
            :role="txError ? 'alert' : 'status'"
          >
            <span v-if="busy" class="pulse-dot"></span>
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
            class="readout-strip is-quiet"
            role="status"
          >
            <p>{{ notice }}</p>
          </div>
        </div>
      </div>
    </dialog>

    <div v-if="walletError && !modalOpen" class="press-toast is-fault" role="alert">
      <UiIcon name="info" :size="17" />
      <p>{{ walletError }}</p>
      <button class="ghost-key" type="button" aria-label="Dismiss wallet error" @click="walletError = ''">
        <UiIcon name="close" :size="15" />
      </button>
    </div>
    <div v-if="notice && !modalOpen && !walletError && !selected" class="press-toast" role="status">
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
      <button v-if="canUndoSavedChange" class="press-link toast-undo" type="button" @click="undoSavedChange">
        Undo
      </button>
      <button class="ghost-key" type="button" aria-label="Dismiss notification" @click="dismissNotice">
        <UiIcon name="close" :size="15" />
      </button>
    </div>
  </div>
</template>
