<template>
  <div class="portalcat-editor-search" data-e2e-type="editor-search">
    <div class="editor-search-header">
      <p class="m-0 d-inline">{{ title }}</p>
    </div>
    <div class="editor-search-content">
      <div class="row justify-content-center">
        <div class="col-4">
          <input
            v-model="searchParams.sourceText"
            ref="sourceInput"
            placeholder="Source..."
            class="form-control"
            type="text"
            data-e2e-type="editor-search-source">
          <div class="row mt-2" v-show="isExpanded">
            <div class="col-auto">
              <div class="form-check form-check-inline">
                <label class="form-check-label">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="searchParams.showOnlyMatching"
                    data-e2e-type="editor-search-show-matching-segments">
                  Show Matching Segments Only
                </label>
              </div>
            </div>
            <div class="col-auto">
              <div class="form-check form-check-inline">
                <label class="form-check-label">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="searchParams.isCaseSensitive"
                    data-e2e-type="editor-search-case-sensitive">
                  Case-sensitive
                </label>
              </div>
            </div>
          </div>
          <div class="row mt-2" v-show="isExpanded">
            <div class="col-auto filter" data-e2e-type="editor-search-type">
              Type:
              <button type="button" :class="{ active: searchParams.origin === '' }" @click="setOrigin('')">All</button>
              <button type="button" class="type-mt" :class="{ active: searchParams.origin === 'mt' }" @click="setOrigin('mt')">MT</button>
              <button type="button" class="type-ht" :class="{ active: searchParams.origin === 'ht' }" @click="setOrigin('ht')">HT</button>
            </div>
            <div class="col-auto filter" data-e2e-type="editor-search-status">
              Status:
              <button type="button" :class="{ active: searchParams.status === '' }" @click="setStatus('')">All</button>
              <button
                type="button"
                :class="{ active: searchParams.status === 'confirmed-translator' }" @click="setStatus('confirmed-translator')">
                <i class="fas fa-check status-confirmed-translator"></i>
              </button>
              <button
                type="button"
                :class="{ active: searchParams.status === 'confirmed-editor' }" @click="setStatus('confirmed-editor')">
                <i class="fas fa-check-double status-confirmed-editor"></i>
              </button>
              <button
                type="button"
                :class="{ active: searchParams.status === 'confirmed-qa' }" @click="setStatus('confirmed-qa')">
                <i class="fas fa-check-double status-confirmed-qa"></i>
              </button>
              <button
                type="button"
                :class="{ active: searchParams.status === 'unlocked' }" @click="setStatus('unlocked')">
                <i class="fas fa-unlock"></i>
              </button>
              <button
                type="button"
                :class="{ active: searchParams.status === 'locked' }" @click="setStatus('locked')">
                <i class="fas fa-lock status-locked"></i>
              </button>
            </div>
          </div>
          <div class="row mt-3" v-show="isExpanded">
            <div class="col-5">
              <flat-pickr
                placeholder="From..."
                v-model="searchParams.fromDate"
                :config="datepickerOptions"
                class="form-control"
                data-e2e-type="editor-search-from-date"/>
            </div>
            <div class="col-5">
              <flat-pickr
                placeholder="To..."
                v-model="searchParams.toDate"
                :config="datepickerOptions"
                class="form-control"
                :class="{ 'has-danger': !isValidToDate }"
                data-e2e-type="editor-search-to-date"/>
            </div>
          </div>
          <div class="row mt-2" v-show="isExpanded">
            <div class="col-5">
              <simple-basic-select
                :options="users"
                :format-option="formatUserOptions"
                v-model="searchParams.userId"
                placeholder="Linguist..."
                data-e2e-type="editor-search-linguist-dropdown"/>
            </div>
            <div class="col-5" v-if="!omitFields.includes('requests')">
              <request-multi-select
                placeholder="Request(s)..."
                @select="onRequestSelected"
                :selected-options="searchParams.requests"
                data-e2e-type="editor-search-requests-dropdown"/>
            </div>
          </div>
        </div>
        <div class="col-auto filter" v-show="isExpanded">
          <div class="d-flex flex-column align-items-center">
            <div class="mb-1">
              <button
                type="button"
                :class="{ active: searchParams.strategy === 'and' }"
                @click="setMatchStrategy('and')"
                data-e2e-type="editor-search-and">AND</button>
            </div>
            <div>
              <button
                type="button"
                :class="{ active: searchParams.strategy === 'not' }"
                @click="setMatchStrategy('not')"
                data-e2e-type="editor-search-not">NOT</button>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div>
            <input
              v-model="searchParams.targetText"
              placeholder="Target..."
              class="form-control"
              type="text"
              data-e2e-type="editor-search-target">
          </div>
          <div class="mt-2" v-show="isExpanded">
            <input
              v-model="searchParams.replaceWith"
              :disabled="!canEdit"
              placeholder="Replace with..."
              class="form-control"
              type="text"
              data-e2e-type="editor-search-replace-with">
          </div>
        </div>
        <div class="col-auto">
          <div class="row">
            <div class="col-auto">
              <div class="next-prev-controls">
                <a
                  href="#"
                  @click.prevent="setCurrentResult(currentResultIndex - 1)"
                  :aria-disabled="areResultsEmpty || isCurrentFirst"
                  :tabindex="!areResultsEmpty ? 0 : -1"
                  :class="{ disabled: areResultsEmpty || isCurrentFirst }"
                  class="btn btn-link prev"
                  title="Previous"
                  data-e2e-type="editor-search-previous">
                  <i class="fas fa-chevron-left"></i>
                </a>
                <a
                  href="#"
                  @click.prevent="setCurrentResult(currentResultIndex + 1)"
                  :aria-disabled="areResultsEmpty || isCurrentLast"
                  :tabindex="!areResultsEmpty ? 0 : -1"
                  :class="{ disabled: areResultsEmpty || isCurrentLast }"
                  class="btn btn-link next"
                  title="Next"
                  data-e2e-type="editor-search-next">
                  <i class="fas fa-chevron-right"></i>
                </a>
              </div>
              <template v-if="areResultsAvailable">
                <p class="text-center" v-if="areResultsEmpty" data-e2e-type="editor-search-results">No results found</p>
                <p class="text-center" v-else data-e2e-type="editor-search-results">{{ currentResultIndex + 1 }} of {{ searchResults.length }}</p>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="row justify-content-center mt-3">
        <div class="col-auto">
          <button
            type="button"
            :disabled="!isValidSearch"
            @click="onSearch"
            data-e2e-type="editor-search-start">Search</button>
          <button
            type="button"
            v-show="isExpanded"
            :disabled="!canEdit || !canReplace"
            @click="$emit('replace', { params: searchParams, scope: 'one' })"
            data-e2e-type="editor-search-replace">
            Replace
          </button>
          <button
            type="button"
            v-show="isExpanded"
            :disabled="!canEdit || !canReplace"
            @click="$emit('replace', { params: searchParams, scope: 'all' })"
            data-e2e-type="editor-search-replace-all">
            Replace All
          </button>
          <button
            type="button"
            @click="onSearchClear"
            data-e2e-type="editor-search-clear">Clear</button>
        </div>
      </div>
      <div class="row justify-content-end">
        <div class="col-auto">
          <a
            href="#"
            @click.prevent="toggleExpanded"
            class="btn btn-link" 
            title="Advanced search"
            data-e2e-type="editor-search-expand">
            <i class="fas" :class="isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./editor-search.js"></script>
<style lang="scss" scoped src="./editor-search.scss"></style>
