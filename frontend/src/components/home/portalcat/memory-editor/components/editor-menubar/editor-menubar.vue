<template>
  <div class="menubar">
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-secondary type-mt"
        :class="{ 'filter-on': isFilterOn('type', 'mt') }"
        title="Machine-translated segments"
        data-e2e-type="editor-matched-results-mt-btn"
        @click="toggleFilter('type', 'mt')">
        MT
      </button>
      <button
        type="button"
        class="btn btn-small btn-secondary type-ht"
        :class="{ 'filter-on': isFilterOn('type', ['ht', 'tm']) }"
        title="Human-translated segments"
        data-e2e-type="editor-matched-results-ht-btn"
        @click="toggleFilter('type', ['ht', 'tm'])">
        HT
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ 'filter-on': isFilterOn('locked', true) }"
        title="Show locked segments"
        data-e2e-type="editor-locked-segments-btn"
        @click="toggleFilter('locked', true)">
        <i class="fas fa-lock"></i>
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        title="Toggle tags"
        @click="updateDisplayOptions('areAllTagsAsNumbers', !displayOptions.areAllTagsAsNumbers)"
        data-e2e-type="editor-toggle-tags-btn">
        <i class="fas fa-code"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        title="Show/hide non-printing characters"
        @click="updateDisplayOptions('areNonPrintingCharsShown', !displayOptions.areNonPrintingCharsShown)"
        data-e2e-type="editor-characters-btn">
        <i class="fas fa-paragraph"></i>
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ 'filter-on': isFilterOn('status', 'UNCONFIRMED') }"
        title="Show unconfirmed segments"
        data-e2e-type="editor-segments-btn"
        @click="toggleFilter('status', 'UNCONFIRMED')">
        <i class="fas fa-check"></i>
      </button>
    </div>
  </div>
</template>

<script src="./editor-menubar.js"></script>