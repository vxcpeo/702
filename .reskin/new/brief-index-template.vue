<template>
  <section id="brief-index" class="board" aria-labelledby="index-title">
    <div class="board-head">
      <div>
        <p class="kicker">
          {{
            savedView
              ? "Your reading list"
              : activityView
                ? "Your briefs"
                : "The brief index"
          }}
        </p>
        <h2 id="index-title" class="board-title">{{ viewTitle }}</h2>
        <p class="board-note">{{ viewNote }}</p>
      </div>
      <div class="board-tools">
        <button
          class="press-link"
          type="button"
          :disabled="refreshing"
          @click="emit('retry')"
        >
          <UiIcon name="refresh" :size="14" />{{
            configured ? "Rescan the chain" : "Reload samples"
          }}
        </button>
        <button
          class="press-btn"
          type="button"
          aria-label="Post a brief"
          @click="emit('create')"
        >
          <span aria-hidden="true">Post a brief</span><UiIcon name="arrow" :size="15" />
        </button>
      </div>
    </div>

    <div class="query-bar" role="search" aria-label="Filter the brief index">
      <div class="search-plate">
        <UiIcon name="search" :size="18" />
        <input
          id="brief-search"
          ref="searchInput"
          class="search-input"
          type="search"
          :value="search"
          placeholder="Search titles, topics and scope"
          aria-label="Search briefs"
          autocomplete="off"
          @input="emit('update:search', $event.target.value)"
        />
        <button
          v-if="search"
          class="search-clear"
          type="button"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <UiIcon name="close" :size="14" />
        </button>
      </div>
      <label class="sort-plate" for="brief-order">
        <span>Order</span>
        <select
          id="brief-order"
          class="sort-select"
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
        class="press-link"
        type="button"
        :disabled="!filtered"
        @click="emit('reset')"
      >
        Reset
      </button>
    </div>

    <div class="sticker-row">
      <div class="sticker-group" role="group" aria-label="Filter by topic">
        <span class="sticker-label">Topics</span>
        <button
          v-for="topic in topics"
          :key="topic"
          class="sticker"
          type="button"
          :class="{ 'is-chosen': activeCategory === topic }"
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
      <div class="sticker-group" role="group" aria-label="Filter by state">
        <span class="sticker-label">Standing</span>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="sticker"
          type="button"
          :class="{ 'is-chosen': statusFilter === option.value }"
          :aria-pressed="statusFilter === option.value"
          @click="emit('update:statusFilter', option.value)"
        >
          {{ option.label }}<sup>{{ option.count }}</sup>
        </button>
      </div>
    </div>

    <div class="facts-band" role="group" aria-label="This edition at a glance">
      <div class="band-cell">
        <span class="band-label">Records</span>
        <span class="band-value">{{ pad(missions.length) }}</span>
      </div>
      <div class="band-cell">
        <span class="band-label">Open</span>
        <span class="band-value">{{ pad(openCount) }}<small>accepting evidence</small></span>
      </div>
      <div class="band-cell">
        <span class="band-label">Illustrative pool</span>
        <span class="band-value">{{ poolTotal }}<small>testnet SOL</small></span>
      </div>
      <div class="band-cell">
        <span class="band-label">Cluster</span>
        <span class="band-value">
          {{ cluster.toUpperCase() }}<small>{{
            configured ? "writes gated" : "preview only"
          }}</small>
        </span>
      </div>
      <p class="band-note">
        <UiIcon name="info" :size="16" />
        <span
          ><strong>{{ filtered ? "Filtered view." : "Full index." }}</strong>
          Every record here is an illustrative testnet brief: rewards carry no
          intended monetary value, nothing signs or sends a transaction, and each
          dossier reads pool, evidence and review state only.</span
        >
      </p>
    </div>

    <div v-if="loading" class="skeleton-strip" role="status">
      <span class="sr-only">Loading briefs…</span>
      <span v-for="n in 5" :key="n" class="skeleton-block" aria-hidden="true"></span>
    </div>

    <div v-else-if="loadError" class="board-empty" role="alert">
      <UiIcon name="info" :size="26" />
      <h3>The index could not be printed.</h3>
      <p>{{ loadError }}</p>
      <button class="press-btn" type="button" @click="emit('retry')">
        Try again<UiIcon name="refresh" :size="15" />
      </button>
    </div>

    <template v-else-if="missions.length">
      <ol class="card-wall" aria-label="Briefs">
        <li v-for="(mission, index) in missions" :key="mission.key || mission.id">
          <article class="record-card">
            <div class="card-top">
              <span class="card-no">{{ pad(index + 1) }}</span>
              <span class="card-topic">{{ mission.category }}</span>
            </div>
            <button
              :ref="(element) => setEntry(element, index)"
              class="card-open"
              type="button"
              :data-key="mission.key || mission.id"
              :aria-label="actionLabel(mission, index)"
              @click="emit('open', mission)"
              @keydown="handleEntryKey"
            >
              <span class="card-title">{{ mission.title }}</span>
              <span class="card-copy">{{ mission.description }}</span>
            </button>
            <div class="card-ground">
              <span class="card-pool"
                >{{ poolText(mission) }}<em>{{ symbolText(mission) }}</em></span
              >
              <span class="card-facts">
                <span>{{ deadlineText(mission) }}</span>
                <span class="card-state" :class="stateClass(mission)">{{
                  stateLabel(mission)
                }}</span>
              </span>
            </div>
            <div class="card-foot">
              <button
                class="card-keep"
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
            </div>
          </article>
        </li>
      </ol>
      <div class="board-foot" aria-live="polite">
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

    <div v-else class="board-empty">
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
              ? "Keep a brief from any entry and it stays on this device under the Ledgiva-saved key."
              : activityView
                ? "Connect the wallet you create briefs with, or post the first brief from this desk."
                : viewNote || "Reload the samples or post the first brief to open the index."
        }}
      </p>
      <button v-if="filtered" class="press-link" type="button" @click="emit('reset')">
        <UiIcon name="refresh" :size="14" />Reset view
      </button>
      <button
        v-else-if="activityView"
        class="press-btn"
        type="button"
        @click="emit('connect')"
      >
        <UiIcon name="wallet" :size="15" />Connect wallet
      </button>
      <button v-else class="press-btn" type="button" @click="emit('create')">
        <UiIcon name="plus" :size="15" />Post a brief
      </button>
    </div>
  </section>
</template>
