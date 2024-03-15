<template>
  <div v-if="isActive" data-e2e-type="request-statistics-tab" :class="{'blur-loading-row': loading}">
    <div class="container-fluid">
      <div class="row mt-4" v-if="statisticsPerLanguageCombination.length">
        <div class="col-12">
          <h6 data-e2e-type="request-number">Request #: {{ request.no }}</h6>
          <h6 data-e2e-type="analysis-created-at">Analysis created at: {{ analysisCreatedAt }}</h6>
          <div class="mt-4">
            <div v-if="!areAllLanguageCombinationsSelected" class="d-inline-block pts-no-text-select">
              <input
                data-e2e-type="select-all-statistics-checkbox"
                id="select-all"
                type="checkbox"
                class="pts-clickable"
                :checked="areAllLanguageCombinationsSelected"
                @click="selectAllLanguageCombinations">
              <label for="select-all" class="pts-clickable select-all">
                Select All
              </label>
            </div>
            <div v-else class="d-inline-block pts-no-text-select">
              <input
                id="reset-all"
                type="checkbox"
                class="pts-clickable"
                :checked="areAllLanguageCombinationsSelected"
                @click="resetSelectedLanguageCombinations">
              <label for="reset-all" class="pts-clickable select-all">
                Reset All
              </label>
            </div>
            <button
              data-e2e-type="export-to-pdf-btn"
              class="ml-2"
              @click="openExportModal"
              :disabled="!selectedLanguageCombinations.size">
              <i class="fas fa-file-pdf"></i>
              Export to PDF
            </button>
          </div>
        </div>
      </div>
      <div class="row text-center pts-no-text-select" v-if="isTabNameVisible">
        <div
          v-for="{name: tabName} in allTabs"
          :data-e2e-type="`${tabName}-statistics-tab`"
          :key="tabName"
          class="tab pts-clickable"
          :class="[ tab.name === tabName ? 'active' : '', allTabs.length === 1 ? 'col-12' : 'col-6']"
          @click="$emit('selectTab', tabName)">
          <span class="text-capitalize">{{tabName}}</span> statistics
        </div>
      </div>
      <statistics-per-language-combination
        v-for="({languageCombination, statisticsPerProvider}) in statisticsPerLanguageCombination"
        :key="languageCombination"
        :statistics-per-provider="statisticsPerProvider"
        :language-combination="languageCombination"
        :is-selected="selectedLanguageCombinations.has(languageCombination)"
        :is-expanded="expandedLanguageCombinations.has(languageCombination)"
        :tab-name="tab.name"
        @on-select="toggleLanguageCombination"
        @on-toggle-view="toggleLanguageCombinationView"
        @update-exportable-statistics="updateExportableStatistics"
      />
      <h6 v-if="!statisticsPerLanguageCombination.length" class="text-center text-danger mt-3">No analytics data found!</h6>
      <statistics-export-modal
        ref="statisticsExportModal"
        :export-data="exportableStatistics"
        :request-no="request.no"
        :tab-name="tab.name"
        @export-success="resetSelectedLanguageCombinations"/>
    </div>
  </div>
</template>

<script src="./statistics-tab.js"></script>
<style lang="scss" scoped src="./statistics-tab.scss"></style>
