<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="portalcat-resources-widget">
    <template slot="icon">
      <i :class="iconClass" title="Resources" data-e2e-type="widget-icon"></i>
    </template>

    <div class="portalcat-resources">
      <div class="portalcat-resources-search-box">
        <div class="search-box-header mb-2">
          <strong>Suggestions</strong>
          <a href="#" @click.prevent="toggleSuggestionsExpanded" class="btn btn-link">
            <i class="float-right align-top fas" :class="isSuggestionsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </a>
        </div>
        <div class="search-box-content" v-if="isSuggestionsExpanded" data-e2e-type="suggestions-container">
          <i v-if="suggestionsAreLoading" data-e2e-type="suggestions-loader" class="fas fa-spinner in-progress"></i>
          <template v-else-if="suggestions">
            <template v-if="suggestions.length">
              <search-result
                v-for="(resource, index) of suggestions"
                @resource-apply="onResourceApply(index, suggestions)"
                :resource="resource"
                :key="resource._id"
                :isMinimizable="true">
              </search-result>
            </template>
            <p v-else data-e2e-type="suggestions-empty" class="text-center">No matches were found.</p>
          </template>
        </div>
        <div class="search-box-header mb-2">
          <strong>Search Resources</strong>
          <a href="#" @click.prevent="toggleSearchExpanded" class="btn btn-link">
            <i class="float-right align-top fas" :class="isSearchExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </a>
        </div>
        <div class="search-box-content" v-show="isSearchExpanded">
          <form @submit.prevent="onSearchSubmit">
            <div class="row align-items-center">
              <div class="form-group col-9">
                <input
                  placeholder="Search"
                  class="form-control form-control-sm"
                  type="text"
                  name="search-term"
                  data-e2e-type="resources-search-input"
                  v-model="searchParams.text" />
              </div>
              <div class="form-group col-auto">
                <button type="submit" data-e2e-type="resources-search-btn" :disabled="isSearchLoading || !isSearchTextValid">
                  Search
                  <i v-if="isSearchLoading" data-e2e-type="search-loader" class="fas fa-spinner in-progress"></i>
                </button>
              </div>
            </div>
          </form>

          <div class="search-filters mb-2">
            <div class="form-check form-check-inline">
              <label class="form-check-label">
                <input
                  class="form-check-input"
                  type="radio"
                  name="resources-search-in"
                  value="source"
                  data-e2e-type="search-in-source-checkbox"
                  v-model="searchParams.searchIn" />
                Source
              </label>
            </div>
            <div class="form-check form-check-inline">
              <label class="form-check-label">
                <input
                  class="form-check-input"
                  type="radio"
                  name="resources-search-in"
                  value="target"
                  data-e2e-type="search-in-target-checkbox"
                  v-model="searchParams.searchIn" />
                Target
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="portalcat-resources-search-results">
        <div class="search-results-header">
          <div class="row mb-3 align-items-center justify-content-between">
            <div class="col">
              <ul class="nav nav-tabs">
                <li class="nav-item" data-e2e-type="resources-search-tab">
                  <a class="nav-link" :class="{ active: activeTab === 'tm' }" @click="activateTab('tm')" href="#">Translation Memory</a>
                </li>
                <li class="nav-item" data-e2e-type="resources-search-tab">
                  <a class="nav-link" :class="{ active: activeTab === 'tb' }" @click="activateTab('tb')" href="#">Termbase</a>
                </li>
              </ul>
            </div>
            <div class="col-auto">
              <a href="#" @click.prevent="toggleResultsExpanded" class="btn btn-link">
                <i class="float-right align-top fas" :class="isResultsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </a>
            </div>
          </div>
        </div>
        <div class="search-result-content" v-show="isResultsExpanded" data-e2e-type="search-results-container">
          <template v-if="activeTab === 'tm'">
            <template v-if="areTmHistoryResultsAvailable">
              <template v-if="tmHistoryResults.length">
                <search-result
                  v-for="(resource, index) of tmHistoryResults"
                  @resource-apply="onResourceApply(index, tmHistoryResults)"
                  :resource="resource"
                  :key="resource._id"/>
              </template>
              <p class="text-center" v-else data-e2e-type="search-results-empty">No results found</p>
            </template>
          </template>
          <template v-if="activeTab === 'tb'">
            <template v-if="areTbHistoryResultsAvailable">
              <template v-if="tbHistoryResults.length">
                <tb-search-result
                  v-for="(resource, index) of tbHistoryResults"
                  @resource-apply="onResourceApply(index, tbHistoryResults)"
                  :resource="resource"
                  :key="resource._id"/>
              </template>
              <p class="text-center" v-else data-e2e-type="search-results-empty">No results found</p>
            </template>
          </template>
        </div>
      </div>
    </div>
  </widget>
</template>

<script src="./resources.js"></script>
<style lang="scss" src="./resources.scss"></style>
