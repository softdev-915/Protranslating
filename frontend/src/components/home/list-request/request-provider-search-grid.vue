<template>
  <div class="container-fluid" data-e2e-type="provider-search">
    <button class="pts-clickable btn mb-4" data-e2e-type="request-ppo-provider-search-button" @click="fetchTableData">
      Search Provider
      <i class="fas fa-search"></i>
    </button>
    <div class="row">
      <div class="col-12">
        <server-pagination-grid
          forceQueryParams
          :query="query"
          ref="providerSearchGrid"
          grid-name="providerSearchGrid"
          title="Provider Search"
          key-prop="_id"
          data-e2e-type="request-ppo-provider-search-grid"
          :row-selection="true"
          :service="service"
          row-selection-title="Select"
          :can-create="false"
          :can-export="false"
          :can-sort-by-select="!isNewOffer"
          :selected-rows="value"
          :css-row-class="cssRowClass"
          :components="components"
          :row-selection-disabled="rowSelectionDisabled"
          :custom-pagination-entries="customPaginationEntries"
          @grid-data-loaded="onPpoSearchGridLoaded"
          @row-selected="onRowSelected"
          @all-rows-selected="onAllRowsSelected"/>
      </div>
    </div>

  </div>
</template>

<script src="./request-provider-search-grid.js"></script>
<style lang="scss" src="./request-provider-search-grid.scss"></style>
