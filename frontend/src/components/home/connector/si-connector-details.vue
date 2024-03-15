<template>
  <div data-e2e-type="si-connector-details">
    <div class="row mt-3">
      <div class="col-12 mt-1">
        <h6 class="d-inline-block mr-4 mt-2 section-header">SI Connector Sync</h6>
        <hr class="my-1" />
      </div>
    </div>
    <div class="row mb-3">
      <div class="col-12 col-sm-6 col-md-3">
          <label for="lastSyncDate" data-e2e-type="si-connector-last-sync-date-label">Last sync date</label>
          <utc-flatpickr
            class="form-control"
            id="lastSyncDate"
            v-model="siConnector.connectorEndedAt"
            :config="flatPickrConfig"
            :disabled="true"
            data-e2e-type="si-connector-last-synced-date"
            :format="format"
          />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
          <label for="error" data-e2e-type="si-connector-error-label">Sync Error</label>
          <input
            class="form-control"
            id="error"
            name="error"
            v-model="errorMessage"
            data-e2e-type="si-connector-error"
            disabled>
      </div>
      <div class="col-6 col-md-2 col-lg-1">
        <div class="checkbox-area">
          <input
            class="form-control"
            id="synced"
            name="isSynced"
            type="checkbox"
            v-model="siConnector.isSynced"
            data-e2e-type="si-connector-synced"
            disabled>
          <label for="synced" data-e2e-type="si-connector-synced-label">Synced</label>
        </div>
      </div>
      <div class="col-6 col-md-2 col-lg-1">
        <div class="checkbox-area">
          <input
            class="form-control"
            id="isMocked"
            name="isMocked"
            type="checkbox"
            v-model="siConnector.isMocked"
            data-e2e-type="si-connector-mocked"
            disabled>
          <label for="synced">Mocked</label>
        </div>
      </div>
      <div class="col-12 col-md-1" v-if="siConnector.isVoided">
        <div class="d-inline-block">
          <label for="synced">Voided</label>
          <input
            class="form-control"
            name="isVoided"
            type="checkbox"
            v-model="siConnector.isVoided"
            data-e2e-type="si-connector-voided"
            disabled>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./si-connector-details.js"></script>
<style scoped lang="scss">
.section-header{
  font-size: 18px;
  font-weight: 400;
}
.checkbox-area{
  display: flex;
  height: 100%;
  align-items: center;
  padding-top: 25px;
  input, label{
    display: inline-block;
    margin: 0;
    width: auto;
  }
  label{
    margin-left: 10px;
  }
}
</style>
