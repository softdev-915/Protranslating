<template>
  <div class="menubar">
    <div class="menubar-group" v-if="!isProdEnv">
      <button
        type="button"
        class="btn btn-small btn-secondary"
        :disabled="isLoadingLocal"
        @click="$emit('lock-segments')"
        v-if="canReadLockConfig"
        data-e2e-type="editor-lock-segments">
        Lock segments
        <i v-if="isLoadingLocal" class="fas fa-spinner in-progress"></i>
      </button>
      <div class="dropdown d-inline-block">
        <button
          class="btn btn-small btn-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          data-e2e-type="editor-confirm-all"
          :disabled="isLoadingLocal"
          @click="toggleConfirmAllDropdown"
          aria-expanded="false">
          Confirm all
          <i v-if="isLoadingLocal" class="fas fa-spinner in-progress"></i>
        </button>
        <div
          class="dropdown-menu"
          style="position: fixed; top: auto; left: auto; display: block;"
          v-show="isConfirmAllDropdownVisible">
          <a class="dropdown-item" href="#" @click="confirmSegments('CONFIRMED_BY_TRANSLATOR')" data-e2e-type="editor-confirm-all-translator">Translator</a>
          <a class="dropdown-item" href="#" @click="confirmSegments('CONFIRMED_BY_EDITOR')" data-e2e-type="editor-confirm-all-editor">Editor</a>
          <a class="dropdown-item" href="#" @click="confirmSegments('CONFIRMED_BY_QA_EDITOR')" data-e2e-type="editor-confirm-all-qa">QA Editor</a>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-small btn-secondary"
        :disabled="isLoadingLocal"
        @click="ignoreAllIssues"
        data-e2e-type="editor-ignore-all">
        Ignore all issues
        <i v-if="isLoadingLocal" class="fas fa-spinner in-progress"></i>
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-secondary"
        title="Run QA"
        @click="runQa"
        :disabled="isEditorEmpty || isPipelineInProgress || isPipelinesLoading"
        data-e2e-type="editor-run-qa-btn">
        Run QA
        <i v-show="isQaInProgress" class="fas fa-spinner in-progress"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-secondary"
        :class="{ 'button-error': hasQaIssues, 'filter-on': isFilterOn('withQaIssues', true) }"
        title="QA Report"
        :disabled="isQaReportLoading || isEditorEmpty || isPipelineInProgress || !hasQaIssues"
        @click="toggleFilter('withQaIssues', true)"
        data-e2e-type="editor-qa-report-btn">
        QA Report
        <i v-show="isQaReportLoading" class="fas fa-spinner in-progress"></i>
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-secondary type-rt"
        :class="{ 'filter-on': isCommonFilterOn('repetitions', true) }"
        title="Toggle repetitions"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-matched-results-rt-btn"
        @click="toggleCommonFilter('repetitions', true)">
        RP
      </button>
      <button
        type="button"
        class="btn btn-small btn-secondary type-mt"
        :class="{ 'filter-on': isFilterOn('type', 'mt') }"
        title="Machine-translated segments"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-matched-results-mt-btn"
        @click="toggleFilter('type', 'mt')">
        MT
      </button>
      <button
        type="button"
        class="btn btn-small btn-secondary type-ht"
        :class="{ 'filter-on': isFilterOn('type', ['ht', 'tm']) }"
        title="Human-translated segments"
        :disabled="isEditorEmpty || isPipelineInProgress"
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
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-locked-segments-btn"
        @click="toggleFilter('locked', true)">
        <i class="fas fa-lock"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ 'filter-on': isFilterOn('locked', false) }"
        title="Show unlocked segments"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-unlocked-segments-btn"
        @click="toggleFilter('locked', false)">
        <i class="fas fa-unlock"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        title="Search"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-search-btn"
        @click="$emit('search')">
        <i class="fas fa-search"></i>
      </button>
    </div>
    <div class="menubar-group">
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ toggled: displayOptions.areAllTagsAsNumbers }"
        title="Toggle tags"
        @click="updateDisplayOptions('areAllTagsAsNumbers', !displayOptions.areAllTagsAsNumbers)"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-toggle-tags-btn">
        <i class="fas fa-code"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ expanded: displayOptions.tagsExpanded }"
        title="Expand/contract tags"
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-expand-tags-btn"
        @click="updateDisplayOptions('tagsExpanded', !displayOptions.tagsExpanded)">
        <i class="fas fa-tags"></i>
      </button>
      <button
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        :class="{ toggled: displayOptions.areNonPrintingCharsShown }"
        title="Show/hide non-printing characters"
        :disabled="isEditorEmpty || isPipelineInProgress"
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
        :disabled="isEditorEmpty || isPipelineInProgress"
        data-e2e-type="editor-segments-btn"
        @click="toggleFilter('status', 'UNCONFIRMED')">
        <i class="fas fa-check"></i>
      </button>
    </div>
  </div>
</template>

<script src="./editor-menubar.js"></script>
