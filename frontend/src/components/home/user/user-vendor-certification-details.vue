<template>
  <div data-e2e-type="certification-details-container">
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Certification</div>
      <div class="col-12 col-md-3">
        <certification-selector
          v-model="certification"
          :disabled="readOnly"
          :certificationsAvailable="certificationsAvailable"
          data-e2e-type="certification-selector" />
      </div>
      <div class="col-12 col-md-2 offset-md-1">Expiration date</div>
      <div class="col-12 col-md-3">
        <utc-flatpickr
          ref="expirationDateFlatpikr"
          @on-change="onExpirationDateChange"
          v-model="expirationDate"
          :config="{ allowInput: true, minDate: 'today' }"
          class="form-control"
          data-e2e-type="certification-expiration-date" />
      </div>
      <div class="col-12 col-md-1">
        <button
          class="fas fa-plus"
          title="Add Certification"
          @click="addCertification()"
          data-e2e-type="certification-add-button">
        </button>
      </div>
    </div>
    <div class="row align-items-center certification-list">
      <div
        class="col-12"
        v-for="(certification, idx) in selectedCertifications"
        :key="idx">
          <div class="row align-items-center pl-0 pr-0">
            <div class="col-3 offset-2 certification-name">
              <span>{{ certification.name }}</span>
            </div>
            <div class="col-3 offset-3 certification-expiration-date">
              <span>{{ localExpirationDates[idx] }}</span>
            </div>
            <div class="col-1">
              <button
                title="Delete Certification"
                @click="deleteCertification(idx)"
                class="fas fa-close"
                data-e2e-type="certification-remove-button">
              </button>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./user-certification-details.scss"></style>

<script src="./user-vendor-certification-details.js"></script>
