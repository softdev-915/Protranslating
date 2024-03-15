<template>
  <div data-e2e-type="rates-grid-container" :class="{'blur-loading-row': loading}">
    <div class="container-fluid py-2 pl-1 mb-2 rates-header">
      <h6 class="mb-0">Rates</h6>
    </div>
    <div
      class="col-12 col-xl-6 actions pl-0 pb-2"
      data-e2e-type="rate-actions-container"
      v-if="canEdit">
      <input
        type="checkbox"
        data-e2e-type="rate-select-all-checkbox"
        v-model="allRatesSelected"
        @click="selectAllRates">
      <div class="col-5 col-sm-3 pl-1 d-inline">
        <label class="pl-1" for="select-all-rates">Select All</label>
      </div>
      <div class="col-6 col-sm-6 d-inline">
        <div class="icons-container d-inline" v-if="canEdit">
          <button
            data-e2e-type="rate-copy-button"
            title="Copy Rates"
            @click.prevent="copySelectedRates()"
            class="fas fa-clone"/>
          <button
            data-e2e-type="rate-paste-button"
            title="Paste Rates"
            @click.prevent="pasteRates()"
            class="fas fa-paste"/>
          <button
            data-e2e-type="rate-delete-button"
            title="Delete Rates"
            @click.prevent="deleteRates()"
            class="fas fa-close"/>
          <button
            data-e2e-type="rate-add-button"
            title="Add Rate"
            @click.prevent="addRate()"
            class="fas fa-plus"/>
          <button
            data-e2e-type="show-rate-filters-button"
            class="fas fa-filter"
            :title="filtersExpanded ? 'Hide filters' : 'Show filters'"
            @click="filtersExpanded = !filtersExpanded"/>
        </div>
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
      </div>
      <div class="row">
        <div class="col-12">
          <h6>Sort by</h6>
          <hr class="mt-0" />
        </div>
        <div class="col-12 col-md-4 col-lg-3 mb-2">
          <basic-select
            data-e2e-type="sort-by-select"
            placeholder="Creation Date"
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
    <div class="row pb-3" v-if="canEdit">
      <div class="col-12" v-if="hasDuplicatedRates" data-e2e-type="rate-error-message">
        <span class="text-danger">Errors: Rates contain duplicated data</span>
      </div>
      <div class="col-md-5">
        <div class="row pl-0 ml-0 align-items-center">
          <div class="col-xs-1"/>
          <div class="entity-manage col">
            <div>
              <p>Source Language</p>
            </div>
            <div>
              <button
                :data-e2e-type="'manage-list-language-button'"
                class="btn btn-small btn-primary"
                @click="manage('language-manage')">Manage</button>
            </div>
          </div>
          <div class="entity-manage col">
            <div>
              <p>Target Language</p>
            </div>
            <div>
              <button
                :data-e2e-type="'manage-list-language-button'"
                class="btn btn-small btn-primary"
                @click="manage('language-manage')">Manage</button>
            </div>
          </div>
          <div class="entity-manage col">
            <div>
              <p>Ability</p>
            </div>
            <div>
              <button
                :data-e2e-type="'manage-list-ability-button'"
                class="btn btn-small btn-primary"
                @click="manage('ability-manage')">Manage</button>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-7 pl-1">
        <div class="row">
          <div class="entity-manage col p-0">
            <div>
              <p>Breakdown</p>
            </div>
            <div>
              <button
                :data-e2e-type="'manage-list-breakdown-button'"
                class="btn btn-small btn-primary"
                @click="manage('breakdown-manage')">Manage</button>
            </div>
          </div>
          <div class="entity-manage col pl-0 number-col">
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
                :data-e2e-type="'manage-list-currency-button'"
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
                :data-e2e-type="'manage-list-translation-unit-button'"
                class="btn btn-small btn-primary"
                @click="manage('translation-unit-manage')">Manage</button>
            </div>
          </div>
          <div class="entity-manage col">
            <div>
              <p>Internal Department</p>
            </div>
            <div>
              <button
                :data-e2e-type="'manage-list-internal-department-button'"
                class="btn btn-small btn-primary"
                @click="manage('internal-department-manage')">Manage</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- HEADER -->
    <div v-if="rates && !loading" data-e2e-type="rates-grid-rows">
      <div v-for="(rate, index) in ratesPage" :key="rate.vueKey">
        <rate-detail
          :currencies="currencies"
          :breakdowns="breakdowns"
          :translationUnits="translationUnits"
          :internal-departments="internalDepartments"
          :abilities="abilities"
          v-model="ratesPage[index]"
          :selected="isRateSelected(rate)"
          :canEdit="canEdit"
          :uncollapsed-rate="uncollapsedRate"
          @collapse-all-rates="onCollapseAllRates"
          @select-rate="selectRate"
          @rate-detail-validation="onRateDetailValidation"/>
      </div>
      <div class="py-3" v-show="rates.length > ratesPerPage">
        <b-pagination
          size="sm"
          v-model="currentPageIndex"
          :per-page="ratesPerPage"
          :total-rows="rates.length"/>
      </div>
    </div>
  </div>
</template>
<script src="./rate-grid.js"/>
<style lang="scss" src="./rate-grid.scss"/>
