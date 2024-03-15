<template>
  <div class="pts-grid-edit-modal" data-e2e-type="invoice-edit-body" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center" v-if="!isNew">
          <div class="col-12 col-md-1 pr-0">Invoice No.</div>
          <div class="col-12 col-md-11" data-e2e-type="invoice-no">{{ invoice.no }}</div>
        </div>

        <section class="pt-1">
          <div class="row align-items-center">
            <div class="col-12">
              <h5>Invoice options</h5>
              <hr/>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12" v-if="isInvoiceBeingCreated">
              <h6 class="red" data-e2e-type="invoice-creation-progress">Invoice Post Completion Progress: {{ invoice.creationProgress }}</h6>
              <hr/>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-3" :class="{'has-danger': !isValidCompany }">
              <label class="d-block required" for="company">
                Invoice to Company
              </label>
              <company-ajax-basic-select
                v-if="isNew"
                id="company"
                name="company"
                data-e2e-type="company-select"
                :selected-option="selectedCompany"
                :required="true"
                :fetch-on-created="true"
                :is-disabled="!isNew"
                :select="'_id name parentCompany billingInformation.billingTerm'"
                @select="onCompanySelected"
                :filter="{isSynced: true}"/>
              <input
                v-else
                disabled
                type="text"
                :value="invoice.company.hierarchy"
                class="form-control"
                data-e2e-type="company-readonly">
            </div>
            <div class="col-12 col-md-3" :class="{'has-danger': !isValidContact }">
              <label class="d-block required" for="contact">
                Invoice to Contact
              </label>
              <contact-select
                v-if="isNew"
                id="contact"
                data-e2e-type="contact-select"
                v-model="invoice.contact"
                :companyId="selectedCompanyId"
                :is-disabled="!isNew || !selectedCompanyId"
                :synced="true"
                :fetch-on-created="!isNew"
                only-hierarchy
              />
              <input
                v-else
                disabled
                type="text"
                :value="contactName"
                class="form-control"
                data-e2e-type="contact-readonly">
            </div>
            <div class="col-12 col-md-3" :class="{'has-danger': !isValidCurrency }">
              <label class="d-block required" for="currency">
                Currency
              </label>
              <currency-selector
                id="currency"
                data-e2e-type="currency-select"
                v-if="isNew"
                v-model="invoice.accounting.currency"
                :fetch-on-created="false"
                :key="availableCurrencies.key"
                :currenciesAvailable="availableCurrencies.options"
                :is-disabled="!isNew"
                :format-option="currencyFormatter"/>
              <input
                v-else
                type="text"
                data-e2e-type="currency-readonly"
                class="form-control"
                disabled
                :value="invoice.accounting.currency.isoCode"/>
            </div>
            <div class="col-12 col-md-3">
              <label class="d-block" for="purchaseOrder">
                PO Number
              </label>
              <simple-basic-select
                v-if="isNew"
                id="purchaseOrder"
                data-e2e-type="purchase-order-select"
                v-model="invoice.purchaseOrder"
                :options="purchaseOrderOptions"
                :placeholder="poExist ? '' : 'PO numbers not available'"
                :disabled="!poExist || !isNew"/>
              <input
                v-else
                type="text"
                class="form-control"
                data-e2e-type="purchase-order-readonly"
                disabled
                :value="poNumber"/>
            </div>
          </div>
        </section>

        <div v-if="isInvoiceOptionsSectionsValid">
          <si-connector-details v-if="!isNew" v-model="invoice.siConnector" />
          <section class="pt-1">
            <div class="row align-items-center">
              <div class="col-12">
                <h5>Invoice Details</h5>
                <hr/>
              </div>
            </div>
            <div v-if="!isNew" class="row align-items-center">
              <div class="col-12 col-md-3">
                <label class="d-block" for="invoiceTotal">
                  Invoice Total
                </label>
                <currency-input
                  id="invoiceTotal"
                  class="form-control"
                  :precision="2"
                  :currency="null"
                  data-e2e-type="invoice-total"
                  :value="invoice.accounting.amount"
                  disabled />
              </div>
              <div class="col-12 col-md-3">
                <label class="d-block" for="invoicePaid">
                  Invoice Amount Paid
                </label>
                <currency-input
                  id="invoicePaid"
                  class="form-control"
                  :precision="2"
                  :currency="null"
                  data-e2e-type="invoice-paid"
                  :value="invoice.accounting.paid"
                  disabled />
              </div>
              <div class="col-12 col-md-3">
                <label class="d-block" for="invoiceBalance">
                  Invoice Balance
                </label>
                <currency-input
                  id="invoiceBalance"
                  class="form-control"
                  :precision="2"
                  :currency="null"
                  :value="invoice.accounting.balance"
                  data-e2e-type="invoice-balance"
                  disabled />
              </div>
              <div class="col-12 col-md-3">
                <label class="d-block" for="invoiceStatus">
                  Status
                </label>
                <input
                  id="invoiceStatus"
                  class="form-control"
                  data-e2e-type="invoice-status"
                  type="text"
                  :value="invoice.status"
                  readonly/>
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidBillingTerm }">
                <label class="d-block required" for="billingTerm">
                  Billing Term
                </label>
                <simple-basic-select
                  v-if="canEdit"
                  id="billingTerm"
                  data-e2e-type="billing-term-select"
                  title="Billing term's list"
                  placeholder="Billing terms"
                  :value="selectedBillingTerm"
                  :options="billingTermOptions"
                  :format-option="formatDefaultSelectOption"
                  @select="onBillingTermSelected"
                  />
                <input
                  v-else
                  class="form-control"
                  data-e2e-type="billing-term-readonly"
                  :value="selectedBillingTerm.text"
                  readonly/>
              </div>
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidContactEmail }">
                <label class="d-block required" for="contactEmail">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  class="form-control"
                  data-e2e-type="contact-email"
                  type="email"
                  :value="contactEmail"
                  readonly/>
              </div>
              <div class="col-12 col-md-6" :class="{'has-danger': !isValidContactBillingAddress }">
                <label class="d-block required" for="contactBillingAddress">
                  Contact Billing Address
                </label>
                <input
                  id="contactBillingAddress"
                  class="form-control"
                  data-e2e-type="contact-billing-address"
                  type="text"
                  :value="contactBillingAddress"
                  readonly/>
              </div>
            </div>

            <div class="row align-items-center">
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidDate }">
                <label class="d-block required" for="startDate">
                  Date
                </label>
                <utc-flatpickr
                  id="startDate"
                  class="form-control"
                  data-e2e-type="invoice-start-date-picker"
                  v-model="invoice.date"
                  :config="datepickerOptions"
                  :disabled="!canEdit"/>
              </div>
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidDueDate }">
                <label class="d-block required" for="dueDate">
                  Due Date
                </label>
                <utc-flatpickr
                  id="dueDate"
                  data-e2e-type="invoice-due-date-picker"
                  class="form-control"
                  v-model="invoice.dueDate"
                  :config="datepickerOptions"
                  :disabled="!canEdit"/>
              </div>
              <div v-if="canReadAll" class="col-12 col-md-3" :class="{'has-danger': !isValidGlPostingDate }">
                <label class="d-block required" for="glPostingDate">
                  GL Posting Date
                </label>
                <utc-flatpickr
                  id="glPostingDate"
                  class="form-control"
                  data-e2e-type="invoice-gl-posting-date-picker"
                  v-model="invoice.glPostingDate"
                  :config="datepickerOptions"
                  :disabled="!canEdit"/>
              </div>
              <div v-if="canReadAll" class="col-12 col-md-3">
                <label for="postOutOfPeriod">Post out of Period
                  <input
                    id="postOutOfPeriod"
                    class="pts-clickable"
                    data-e2e-type="post-out-of-period"
                    type="checkbox"
                    v-model="invoice.postOutOfPeriod"
                    :disabled="!canEditPostOutOfPeriod || isInvoiceBeingCreated"/>
                </label>
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-12 col-md-6">
                <label class="d-block" for="description">
                  Description
                </label>
                <input
                  id="description"
                  class="form-control"
                  data-e2e-type="invoice-description"
                  type="text"
                  v-model="invoice.description"
                  :disabled="!hasOneOfEditRoles"/>
              </div>
              <div class="col-12 col-md-3">
                <label class="d-block" for="salesRep">
                  Sales rep
                </label>
                <input
                  id="salesRep"
                  class="form-control"
                  data-e2e-type="sales-rep"
                  :value="salesRep"
                  readonly/>
              </div>
              <div class="col-12 col-md-3" v-if="!isNew">
                <label class="d-block" for="invoice-attachments">Attachments</label>
                <attachments-modal
                  id="invoice-attachments"
                  data-e2e-type="invoice-attachments"
                  v-model="invoice.attachments"
                  :service="_service()"
                  :entity-id="entityId"/>
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-12 col-md-3">
                <label class="d-block" for="revRecStartDate">Rev. Rec. Start Date</label>
                <input
                  id="revRecStartDate"
                  class="form-control"
                  data-e2e-type="rev-rec-start-date-readonly"
                  :value="revRecStartDate"
                  readonly/>
              </div>
              <div class="col-12 col-md-3">
                <label class="d-block" for="revRecEndDate">Rev. Rec. End Date</label>
                <input
                  id="revRecEndDate"
                  class="form-control"
                  data-e2e-type="rev-rec-end-date-readonly"
                  :value="revRecEndDate"
                  readonly/>
              </div>
            </div>
          </section>

          <section class="pt-1" v-if="canReadAll">
            <div class="row align-items-center">
              <div class="col-12">
                <h5>Templates</h5>
                <hr/>
              </div>
            </div>
            <div class="row">
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidInvoiceTemplate }">
                <label class="d-block required" for="invoiceTemplateSelect">
                  Invoice Template
                </label>
                <simple-basic-select
                  id="invoiceTemplateSelect"
                  data-e2e-type="invoice-template-select"
                  :value="selectedInvoiceTemplate"
                  :options="invoiceTemplateOptions"
                  :format-option="formatDefaultSelectOption"
                  @select="onInvoiceTemplateSelected"/>
              </div>
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidEmailTemplate }">
                <label class="d-block required" for="invoiceEmailTemplateSelect">
                  Invoice Email Template
                </label>
                <simple-basic-select
                  id="invoiceEmailTemplateSelect"
                  data-e2e-type="invoice-email-template-select"
                  :value="selectedEmailTemplate"
                  :options="emailTemplateOptions"
                  :format-option="formatDefaultSelectOption"
                  @select="onEmailTemplateSelected"/>
              </div>
            </div>
          </section>

          <section class="pt-1" v-if="!isNew && !isInvoiceBeingCreated">
            <div class="row align-items-center">
              <div class="col-12">
                <h5>Activities</h5>
              </div>
              <div class="col">
                <h6 class="pts-clickable p-md-4" @click="toActivityGrid($event)">
                  <a href="/activities" data-e2e-type="manageActivity">
                    <u>View/Create Activity</u>
                  </a>
                </h6>
              </div>
            </div>
          </section>

          <section class="pt-1">
            <div class="row align-items-center">
              <div class="col-12">
                <h5>Entries</h5>
                <hr/>
                <div class="row">
                  <div class="col-12">
                    <button
                      :disabled="isInvoiceBeingCreated"
                      data-e2e-type="show-entries-btn"
                      class="btn btn-secondary pull-right mr-2"
                      @click="isVisibleEntriesGrid = !isVisibleEntriesGrid">
                      {{ isVisibleEntriesGrid ? 'Hide' : 'Show' }} entries
                    </button>
                    <button
                      v-show="!wasCsvImported && !isInvoiceBeingCreated && invoice.status !== 'Posted'"
                      data-e2e-type="import-entries-btn"
                      class="btn btn-secondary pull-right mr-2"
                      @click="triggerEntriesUpload">
                      Import entries
                    </button>
                    <form ref="importEntriesForm" type="hidden">
                      <input type="file" name="entriesCsvFile" class="hidden" accept=".csv" @change="uploadCsvWithEntries($event)" ref="csvEntriesImportedFile" />
                    </form>
                  </div>
                </div>
                <big-data-set-grid
                  v-if="isNew"
                  ref="arInvoiceEntriesGrid"
                  grid-name="ar-invoice-entries"
                  title="arInvoiceEntries"
                  data-e2e-type="entries-grid"
                  key-prop="_id"
                  class="ar-invoice-entries-grid"
                  tableClass="fixed-header"
                  :mainQuery="mainQuery"
                  :key="entriesKey"
                  :service="arInvoiceEntriesService"
                  :can-create="false"
                  :can-toggle="!wasCsvImported"
                  :row-selection="isNew"
                  :selectedRows="checkedEntriesIds"
                  :active-rows="activeRows"
                  :is-pagination-enabled="false"
                  :has-import-link="false"
                  selectedRowCheckProperty="_id"
                  @grid-row-toggle="onGridRowToggle($event)"
                  @grid-data-imported="onGridDataImported"
                  @row-selected="onRowSelected"
                  @all-rows-selected="onSelectAll"
                  @grid-data-loaded="onGridDataLoaded"/>
                <server-pagination-grid
                  v-else
                  ref="arInvoiceEntriesGrid"
                  grid-name="ar-invoice-entries"
                  title="arInvoiceEntries"
                  data-e2e-type="entries-grid"
                  key-prop="_id"
                  class="ar-invoice-entries-grid"
                  tableClass="fixed-header"
                  :mainQuery="mainQuery"
                  :key="entriesKey"
                  :active-rows="activeRows"
                  :service="arInvoiceEntriesService"
                  :can-create="false"
                  :can-toggle="true"
                  :is-pagination-enabled="true"
                  selectedRowCheckProperty="_id"
                  @grid-row-toggle="onGridRowToggle($event)"
                  @row-selected="onRowSelected"
                  @grid-data-loaded="onGridDataLoaded"/>
              </div>
            </div>
            <div class="row pl-4 pr-4">
              <div class="col-12 col-md-2">
                <span>
                  <span class="pts-font-bold">Grand Total </span>
                  <span data-e2e-type="entries-grand-total">
                    {{ amount | currency(`${foreignCurrency} `, 2) }}
                  </span>
                </span>
              </div>
              <div class="col-12 col-md-2" v-if="canReadAll">
                <span>
                  <span class="pts-font-bold">Exchange Rate </span>
                  <span data-e2e-type="entries-exchange-rate">
                    {{ exchangeRate.toFixed(5) }}
                  </span>
                </span>
              </div>
              <div class="col-12 col-md-2" v-if="canReadAll">
                <span>
                  <span class="pts-font-bold">Local Amount </span>
                  <span data-e2e-type="entries-local-amount">
                    {{ localAmount | currency(`${baseCurrency} `, 2) }}
                  </span>
                </span>
              </div>
              <div class="col-12 col-md-2" v-if="canReadAll">
                <span>
                  <span class="pts-font-bold">No. Selected Entries </span>
                  <span data-e2e-type="selected-entries-number">
                    {{ checkedEntriesIds.length }}
                  </span>
                </span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>

    <div slot="modal-footer" class="form-actions">
      <hr/>
      <div class="ml-3 mr-3 d-flex justify-content-between">
        <div>
          <button
            class="btn btn-primary"
            data-e2e-type="preview-btn"
            :disabled="isNew || isInvoiceBeingCreated"
            @click="preview"
          >
            Preview and Send Invoice
          </button>
        </div>
        <div class="d-flex">
          <invoice-reverse-modal
            v-if="isReverseModalVisible"
            class="mr-2"
            :invoice="invoice"
            @invoice-refresh="_refreshEntity"
          />
          <cc-payment-modal
            v-if="canMakePayment"
            class="mr-2"
            :entity-id="entityId"
            :entity-contact-id="invoice.contact._id"
            :amount="invoice.accounting.balance"
            :currency="invoice.accounting.currency.isoCode"
            :entity-no="invoice.no"
            :entity-status="invoice.status"
            :isSynced="invoice.siConnector.isSynced"
            data-e2e-type="invoice-payment-modal"
          />
          <button
            class="btn btn-secondary mr-2"
            data-e2e-type="cancel-btn"
            @click="cancel"
          >Cancel
          </button>
          <button
            :disabled="isSaveButtonDisabled"
            data-e2e-type="save-btn"
            class="btn btn-primary pull-right mr-2"
            @click="save"
          >Save
          </button>
        </div>
      </div>
    </div>

  </div>

</template>

<script src="./ar-invoice-edit.js"></script>

<style lang="scss" src="./invoice-preview/invoice-preview.scss"></style>

<style lang="scss" src="./ar-invoice-edit.scss"></style>
