<template>
  <div>
    <div class="mb-2">
      <button
        class="btn btn-primary"
        @click="ratesExpanded = !ratesExpanded"
        data-e2e-type='rates-grid-toggle-button'>{{ ratesExpanded ? 'Hide Rates' : 'Show Rates'}}</button>
    </div>
    <div
      data-e2e-type="rates-grid-container"
      :class="{'blur-loading-row': loading}"
      v-if="ratesExpanded">
      <div class="container-fluid py-2 mb-2 rates-header">
        <h6 class="mb-0">Rates</h6>
      </div>
      <div class="col-12 py-2 px-0" v-if="hasDuplicatedRates" data-e2e-type="rate-error-message">
        <div class="rates-error">
          <i class="fas far fa-exclamation-circle"></i>
          <span>Error: Rates contain duplicated data</span>
        </div>
      </div>
      <div class="row actions pl-3 pb-2" data-e2e-type="rate-actions-container" v-if="canEdit">
        <input
          type="checkbox"
          data-e2e-type="rate-select-all-checkbox"
          v-model="allRatesSelected"
          @click="selectAllRates">
        <div class="col-1 pl-2 d-flex align-items-center">
          <span for="select-all-rates">Select All</span>
        </div>
        <div class="col-3 pl-2 d-flex align-items-center" v-if="canEdit">
          <div class="d-flex">
            <button
              data-e2e-type="rate-copy-button"
              title="Copy Rates"
              @click.prevent="copySelectedRates()"
              class="fas fa-copy mr-1"/>
            <button
              data-e2e-type="rate-paste-button"
              title="Paste Rates"
              @click.prevent="pasteRates"
              class="fas fa-paste mr-1"/>
            <button
              data-e2e-type="rate-delete-button"
              title="Delete Rates"
              @click.prevent="deleteRates()"
              class="fas fa-close mr-1"/>
            <button
              data-e2e-type="rate-add-button"
              title="Add Rate"
              @click.prevent="addRate()"
              class="fas fa-plus mr-1"/>
            <button
              data-e2e-type="show-rate-filters-button"
              class="fas fa-filter"
              :title="filtersExpanded ? 'Hide filters' : 'Show filters'"
              @click="filtersExpanded = !filtersExpanded"/>
          </div>
        </div>
        <div class="col-12 col-md-6 text-md-right text-left ml-auto">
          <button
            class="btn btn-primary"
            @click="manageVendorMinimumCharge"
            data-e2e-type="rates-grid-vendor-minimum-charge">
            Vendor Minimum Charge Rates grid
          </button>
        </div>
      </div>
      <div data-e2e-type="rates-grid-filters-container" v-show="filtersExpanded">
        <div class="row">
          <div class="col-12">
            <h6>Filters</h6>
            <hr class="mt-0" />
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <ability-selector
              data-e2e-type="filter-by-ability-select"
              title="Abilities Filter"
              placeholder="Ability"
              v-model="abilityFilter"
              :abilities-available="abilityFilterOptions"
              :fetch-on-created="false"/>
          </div>
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <language-selector
              title="Source language filter"
              placeholder="Src Language"
              data-e2e-type="filter-by-source-language-select"
              v-model="srcLanguageFilter"
              :options="sourceLanguageFilterOptions"
              allow-custom-options
              :fetch-on-created="false"/>
          </div>
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <language-selector
              title="Target language filter"
              placeholder="Tgt Language"
              data-e2e-type="filter-by-target-language-select"
              v-model="tgtLanguageFilter"
              :options="targetLanguageFilterOptions"
              allow-custom-options
              :fetch-on-created="false"/>
          </div>
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <cat-tool-select
              data-e2e-type="filter-by-cat-tool-select"
              title="Tool list filter"
              placeholder="Tool"
              v-model="catToolFilter"
              :show-deleted="false"
              :tools-available="toolFilterOptions"
              :fetch-on-created="false"/>
          </div>
        </div>
        <div v-show="false" class="row">
          <div class="col-12">
            <h6>Sort by</h6>
            <hr class="mt-0" />
          </div>
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <basic-select
              data-e2e-type="sort-by-select"
              placeholder="No sort"
              :options="sortOptions"
              :selectedOption="sort.key"
              @select="onSortKeyChange"/>
          </div>
          <div class="col-12 col-md-4 col-lg-3 mb-2">
            <basic-select
              data-e2e-type="sort-order-select"
              :options="sortOrderOptions"
              :selectedOption="sort.order"
              @select="onSortOrderChange"/>
          </div>
        </div>
      </div>
      <!-- HEADER -->
      <div
        v-if="canEdit"
        class="row px-3 py-0 mt-2 rate-header-container"
        data-e2e-type="rate-header-container">
        <div class="entity-manage col-2">
          <div>
            <p>Ability</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-ability-button"
              class="btn btn-small btn-primary"
              @click="manage('ability-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Source language</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-language-button"
              class="btn btn-small btn-primary"
              @click="manage('language-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Target language</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-language-button"
              class="btn btn-small btn-primary"
              @click="manage('language-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Internal department</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-internal-department-button"
              class="btn btn-small btn-primary"
              @click="manage('internal-department-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Tool</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-cat-tool-button"
              class="btn btn-small btn-primary"
              @click="manage('cat-tool-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Company</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-company-button"
              class="btn btn-small btn-primary"
              @click="manage('company-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Breakdown</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-breakdown-button"
              class="btn btn-small btn-primary"
              @click="manage('breakdown-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Rate</p>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Currency</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-currency-button"
              class="btn btn-small btn-primary"
              @click="manage('currency-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Unit</p>
          </div>
          <div>
            <button
              data-e2e-type="manage-list-translation-unit-button"
              class="btn btn-small btn-primary"
              @click="manage('translation-unit-manage')">Manage</button>
          </div>
        </div>
        <div class="entity-manage col">
          <div>
            <p>Action</p>
          </div>
        </div>
      </div>
      <div v-if="rates && !loading" class="mt-2" data-e2e-type="rates-grid-rows">
        <rate-detail
          v-for="(rate, index) in ratesPage"
          :key="rate.vueKey"
          v-model="ratesPage[index]"
          :selected="isRateSelected(rate)"
          :canEdit="canEdit"
          :user-abilities="userAbilities"
          :user-internal-departments="userInternalDepartments"
          :user-cat-tools="userCatTools"
          :user-language-combinations="userLanguageCombinations"
          :uncollapsed-rate="uncollapsedRate"
          :is-duplicate="isRateDuplicate(rate)"
          :abilities="abilities"
          @rate-detail-validation="onRateDetailValidation"
          @select-rate="selectRate"
          @collapse-all-rates="onCollapseAllRates"
          @collapse-active-rate="onCollapseActiveRate"
          @on-rate-saving="onRateSaving"
          @on-rate-drafting="onRateDrafting"
          @rate-has-changed="onRateChanged" />
        <div
          class="row justify-content-center justify-content-md-end"
          v-show="rates.length > ratesPerPage">
          <div class="col-12 col-md-2 p-0 text-end">
            <b-pagination
              size="sm"
              v-model="currentPageIndex"
              :per-page="ratesPerPage"
              :total-rows="rates.length"
              data-e2e-type="rate-grid-pagination"/>
          </div>
        </div>
      </div>
    </div>
    <confirm-dialog
      ref="deleteRatesDialog"
      data-e2e-type="rate-grid-delete-dialog"
      container-class="medium-dialog"
      confirmationTitle="Warning"
      confirmationMessage="Warning: This will delete selected rate for this provider. Are you sure?"
      cancelText="No"
      @confirm="ratesDeletionHandler"
      @cancel="ratesDeletionHandler" />
  </div>
</template>

<script src="./rate-grid.js"></script>
<style lang="scss" src="./rate-grid.scss"></style>
