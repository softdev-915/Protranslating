<template>
  <b-modal hide-header-close ref="modal" size="lg" class="run-statistics-modal">
    <div slot="modal-header" class="modal-actions">
      <h6 class="pull-left">Locked Segments</h6>
    </div>
    <div slot="default">
      <div
        ref="container"
        class="container"
        data-e2e-type="run-statistics-modal">
        <div class="row">
          <div class="col-12">
            <label>Include Locked Segments in</label>
          </div>
          <div class="col-12">
            <label for="includeInClientStatistics">
              <input
                data-e2e-type="client-statistics"
                id="includeInClientStatistics"
                name="includeInClientStatistics"
                type="checkbox"
                v-model="value.includeInClientStatistics"/>
              <span>Client Statistics</span>
            </label>
          </div>
          <div class="col-12">
            <label for="includeInProviderStatistics">
              <input
                data-e2e-type="provider-statistics"
                id="includeInProviderStatistics"
                name="includeInProviderStatistics"
                type="checkbox"
                v-model="value.includeInProviderStatistics"/>
              <span>Provider Statistics</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="modal-actions">
      <button
        class="btn btn-primary pull-right mr-2"
        :disabled="isDisabled"
        @click="runStatistics"
        data-e2e-type="run-statistics">
        Run Statistics
      </button>
      <button
        class="btn btn-secondary pull-right mr-2"
        @click="close"
        data-e2e-type="cancel-statistics">
        Cancel
      </button>
    </div>
  </b-modal>
</template>

<script src="./run-statistics-modal.js"></script>
<style scoped lang="scss" src="./run-statistics-modal.scss"></style>
<style>
.run-statistics-modal .modal-dialog{
  max-width: 400px;
}
</style>
