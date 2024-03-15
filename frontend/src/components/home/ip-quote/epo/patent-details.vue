<template>
  <ip-card-section>
    <h4 class="body__header">Patent Details</h4>
    <p class="body__text" data-e2e-type="counts-text">
      Your Patent details based on the patent number entered. Review the
      fields below and edit if necessary.
    </p>
    <div class="patent-details">
      <ip-date-input
        required
        placeholder="Requested Delivery Date"
        data-e2e-type="requested-delivery-date"
        v-model="details.requestedDeliveryDate"
      />
      <ip-input
        placeholder="Reference Number (Optional)"
        data-e2e-type="reference-number"
        v-model="details.referenceNumber"
      />
    </div>
    <h4 v-if="!isOrder" class="body__header mt-3" data-e2e-type="counts-title">Counts</h4>
    <div class="counts-wrapper" :class="{'mt-0': isOrder}">
      <template v-if="!isOrder">
        <ip-input
          type="number"
          required
          placeholder="Description Word Count"
          data-e2e-type="description-word-count"
          v-model="details.descriptionWordCount"
        />
        <ip-input
          type="number"
          required
          placeholder="Claims Word Count"
          data-e2e-type="claims-word-count"
          v-model="details.claimWordCount"
        />
        <ip-input
          v-if="!translationOnly"
          type="number"
          required
          placeholder="Description Page Count"
          data-e2e-type="description-page-count"
          v-model="details.descriptionPageCount"
        />
        <ip-input
          v-if="!translationOnly"
          type="number"
          required
          placeholder="Claims Page Count"
          data-e2e-type="claims-page-count"
          v-model="details.claimsPageCount"
        />
        <ip-input
          v-if="!translationOnly"
          type="number"
          required
          placeholder="Number of Claims"
          data-e2e-type="number-of-claims"
          v-model="details.numberOfClaims"
        />
        <div class="ip-field">
          <ip-input
            type="number"
            placeholder="Drawings Page Count"
            data-e2e-type="drawings-page-count"
            v-model.number="details.drawingsPageCount"
          />
          <div v-if="!details.drawingsPageCount" class="ip-field__help">
            <p class="ip-tooltip">
              If the Drawings Word Count is not known, our operations team
              will update this after you submit your quote.
            </p>
            <p class="remark" data-e2e-type="drawings-page-count-remark mt-2">Enter estimated value (if known)</p>
          </div>
        </div>
        <div class="ip-field">
          <ip-input
            type="number"
            placeholder="Drawings Word Count"
            data-e2e-type="drawings-word-count"
            v-model="details.drawingsWordCount"
          />
          <div class="ip-field__help">
            <p class="ip-tooltip">
              If the Drawings Word Count is not known, our operations team
              will update this after you submit your quote.
            </p>
            <p class="remark" data-e2e-type="drawings-word-count-remark">Enter estimated value (if known)</p>
          </div>
        </div>
      </template>
    </div>
    <div v-if="!isB1Available" class="mt-5">
      <p class="body__text" data-e2e-type="b1-disclaimer">
        •  As B1 is not available these values are being calculated from {{value.kind}}
      </p>
    </div>
    <div v-if="showAnnuityQuotationCheckbox" class="mt-5 annuity-quotation-section">
      <h4 class="body__header" data-e2e-type="epo-annuity-quotation-header">Annuity Quotation</h4>
      <div class="mt-2">
        <label for="epoRequireAnnuityQuotation">
          <input
            id="epoRequireAnnuityQuotation"
            data-e2e-type="epo-annuity-quotation-required"
            type="checkbox"
            v-model="details.isAnnuityQuotationRequired">
          <span>Annuity Quotation Required</span>
        </label>
      </div>
    </div>
  </ip-card-section>
</template>

<script src="./patent-details.js"> </script>
<style scoped lang="scss" src="./patent-details.scss"></style>