<template>
  <div class="pts-grid-edit-modal" :class="{ 'blur-loading-row': httpRequesting }">
    <div slot="default" data-e2e-type="ar-adjustment-edit-body">
      <div class="container-fluid mb-4">
        <h6 class="d-inline-block mr-4">Adjustment Options</h6>
        <hr class="mt-1 mb-2" />
        <div class="row">
          <div class="col-12 col-md-3">
            <label class="d-block required">Adjustment Type</label>
            <simple-basic-select
              v-if="canEdit"
              v-model="adjustment.type"
              :options="adjustmentTypes"
              data-e2e-type="ar-adjustment-type-select"/>
            <input
              v-else
              disabled
              class="form-control"
              :value="adjustment.type"
              data-e2e-type="ar-adjustment-type-read-only"/>
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Invoice to Company</label>
            <company-ajax-basic-select
              v-if="canEdit"
              :fetch-on-created="false"
              :selected-option="selectedCompany"
              @select="handleCompanySelection"
              data-e2e-type="ar-adjustment-company-select"/>
            <input
              v-else
              disabled
              class="form-control"
              :value="adjustment.company.hierarchy"
              data-e2e-type="ar-adjustment-company-read-only"/>
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Invoice to Contact</label>
            <contact-select
              v-if="canEdit"
              v-model="adjustment.contact"
              :format-option="contactFormatOption"
              :companyId="selectedCompany.value"
              :fetch-on-created="false"
              data-e2e-type="ar-adjustment-contact-select"/>
            <input
              v-else
              disabled
              class="form-control"
              :value="contactName"
              data-e2e-type="ar-adjustment-contact-read-only"/>
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Currency</label>
            <currency-selector
              v-if="canEdit"
              v-model="adjustment.accounting.currency"
              :fetch-on-created="false"
              :currenciesAvailable="currencies"
              :format-option="currencyFormatter"
              data-e2e-type="ar-adjustment-currency-select"/>
            <input
              v-else
              disabled
              class="form-control"
              :value="adjustment.accounting.currency.isoCode"
              data-e2e-type="ar-adjustment-currency-read-only"/>
          </div>
        </div>
      </div>
      <div class="container-fluid mb-4" v-if="!isNew">
        <si-connector-details v-model="adjustment.siConnector" />
      </div>
      <div class="container-fluid mb-4">
        <h6 class="d-inline-block mr-4">Adjustment Details</h6>
        <hr class="mt-1 mb-2" />
        <div class="row">
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block required">{{ adjustment.type }} Total</label>
            <currency-input
              disabled
              class="form-control"
              :precision="2"
              :value="amount"
              :currency="null"
              @change="() => false"
              data-e2e-type="ar-adjustment-total"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block required">{{ adjustment.type }} Paid</label>
            <currency-input
              disabled
              class="form-control"
              :precision="2"
              :value="amountPaid"
              :currency="null"
              @change="() => false"
              data-e2e-type="ar-adjustment-paid"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block required">{{ adjustment.type }} Available</label>
            <currency-input
              disabled
              class="form-control"
              :precision="2"
              :value="balance"
              :currency="null"
              @change="() => false"
              data-e2e-type="ar-adjustment-available"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block required">Status</label>
            <input
              disabled
              class="form-control"
              :value="adjustment.status"
              data-e2e-type="ar-adjustment-status">
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block required">Adjustment Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="adjustment.date"
              :config="datepickerOptions"
              :disabled="!canEdit"
              data-e2e-type="ar-adjustment-date"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="canReadAll">
            <label class="d-block required">GL Posting Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="adjustment.glPostingDate"
              :config="datepickerOptions"
              :disabled="!canEdit"
              data-e2e-type="ar-adjustment-gl-posting-date"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block">Applied To</label>
            <input
              type="text"
              class="form-control"
              v-model="adjustment.appliedTo"
              disabled
              data-e2e-type="ar-adjustment-applied-to">
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block">Reference Invoice Number</label>
            <invoice-select
              v-if="canEdit"
              v-model="adjustment.invoiceNo"
              :fetch-on-created="false"
              :company-id="selectedCompanyId"
              :currency-id="selectedCurrencyId"
              :format-option="invoiceFormatOption"
              :invoices="invoiceOptions"
              @entries-input="onEntriesInput"
              data-e2e-type="ar-adjustment-ref-invoice-number-select"/>
            <input
              v-else
              disabled
              class="form-control"
              :value="adjustment.invoiceNo"
              data-e2e-type="ar-adjustment-ref-invoice-number-read-only"/>
          </div>
          <div class="col-12 col-md-6 mb-2" >
            <label class="d-block">Description</label>
            <input
              type="text"
              class="form-control"
              v-model="adjustment.description"
              :disabled="!canEdit"
              data-e2e-type="ar-adjustment-description">
          </div>
          <div class="col-0 col-md-6 mb-2"></div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block required">Adjustment Number</label>
            <input
              disabled
              class="form-control"
              :value="adjustment.no"
              data-e2e-type="ar-adjustment-number">
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="isNew">
            <label class="d-block required">Amount</label>
              <currency-input
                v-if="isNew"
                disabled
                class="form-control"
                :precision="2"
                :value="amount"
                :currency="null"
                @change="() => false"
                data-e2e-type="ar-adjustment-amount"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="canReadAll">
            <label class="d-block required">Exchange Rate</label>
            <currency-input
              disabled
              class="form-control"
              :precision="5"
              :currency="null"
              :value="exchangeRate"
              @change="() => false"
              data-e2e-type="ar-adjustment-exchange-rate"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="canReadAll">
            <label class="d-block required">Local Amount</label>
            <currency-input
              disabled
              class="form-control"
              :value="localAmount"
              :precision="2"
              :currency="null"
              @change="() => false"
              data-e2e-type="ar-adjustment-local-amount"/>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="!isNew">
            <label class="d-block">Attachments</label>
            <attachments-modal
              v-model="adjustment.attachments"
              :service="service"
              :entity-id="entityId"
              data-e2e-type="ar-adjustment-attachments"/>
          </div>
        </div>
      </div>
      <div class="container-fluid mb-4">
        <h6 class="d-inline-block mr-4">Entries</h6>
        <hr class="mt-1 mb-2" />
        <div class="row p-3">
          <table class="table table-sm table-bordered table-striped table-hover table-stacked">
            <thead class="hidden-xs-down">
              <tr>
                <th scope="col" style="width: 15%" v-if="canReadAll">GL Account No</th>
                <th scope="col" style="width: 15%"  v-if="canReadAll">Department ID</th>
                <th scope="col" style="width: 20%">Amount</th>
                <th scope="col">Memo</th>
                <th scope="col" v-if="isNew">Actions</th>
              </tr>
            </thead>
            <tbody data-e2e-type="ar-adjustment-entries-body">
              <tr v-if="entries.length === 0 && isNew">
                <td colspan="4" class="hidden-xs-only"/>
                <td>
                  <button
                    data-e2e-type="ar-adjustment-entries-add-button"
                    title="New Entry"
                    @click="addEntry(0, $event)"
                    class="fas fa-plus mr-1"/>
                </td>
              </tr>
              <tr
                v-for="(entry, i) of entries"
                :key="entry.vueKey"
                data-e2e-type="ar-adjustment-entry-row"
                @click="() => unlockEntry(entry)">
                <td v-if="canReadAll">
                  <b class="hidden-sm-up">GL Account No:</b>
                  <span
                    v-if="entry.isLocked"
                    data-e2e-type="ar-adjustment-entry-row-gl-account-read-only">
                    {{ entry.glAccountNo }}
                  </span>
                  <simple-basic-select
                    v-else
                    placeholder="Select GL Account"
                    v-model="entry.glAccountNo"
                    :options="revenueAccounts"
                    data-e2e-type="ar-adjustment-entry-row-gl-account-select"/>
                </td>
                <td v-if="canReadAll">
                  <b class="hidden-sm-up">Department ID:</b>
                  <span
                    v-if="entry.isLocked"
                    data-e2e-type="ar-adjustment-entry-row-department-read-only">
                    {{ entry.departmentId }}
                  </span>
                  <simple-basic-select
                    v-else
                    placeholder="Select Department ID"
                    v-model="entry.departmentId"
                    :format-option="({ departmentId}) => ({ text: departmentId, value: departmentId })"
                    :options="internalDepartments"
                    data-e2e-type="ar-adjustment-entry-row-department-select"/>
                </td>
                <td>
                  <b class="hidden-sm-up">Amount:</b>
                   <currency-input
                    class="form-control"
                    :valueRange="{ min: 0 }"
                    :disabled="entry.isLocked"
                    :currency="null"
                    :precision="2"
                    v-model="entry.amount"
                    data-e2e-type="ar-adjustment-entry-row-amount"/>
                </td>
                <td>
                  <b class="hidden-sm-up">Memo:</b>
                  <span
                    v-if="entry.isLocked"
                    data-e2e-type="ar-adjustment-entry-row-memo-read-only">
                    {{ entry.memo }}
                  </span>
                  <input
                    v-else
                    class="form-control"
                    placeholder="Type a memo"
                    v-model="entry.memo"
                    data-e2e-type="ar-adjustment-entry-row-memo-input">
                </td>
                <td>
                  <b class="hidden-sm-up">Actions:</b>
                  <div v-if="!entry.isLocked">
                    <i
                      data-e2e-type="ar-adjustment-entry-row-save-button"
                      class="fas fa-check text-success mx-1 pts-clickable"
                      @click="($event) => lockEntry(entry, $event)"/>
                    <i
                      data-e2e-type="ar-adjustment-entry-row-cancel-button"
                      class="fas fa-times text-danger mx-1 pts-clickable"
                      @click="deleteEntry(i)"/>
                  </div>
                  <div v-else-if="canEdit">
                    <button
                      data-e2e-type="ar-adjustment-entry-row-add-button"
                      title="New Entry"
                      @click="addEntry(i - adjustment.invoiceEntries.length, $event)"
                      class="fas fa-plus mr-1"/>
                    <button
                      data-e2e-type="ar-adjustment-entry-row-delete-button"
                      title="Delete Entry"
                      @click="deleteEntry(i)"
                      class="fas fa-trash fa-trash-o mr-1"/>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="container-fluid">
        <div class="d-flex justify-content-end">
            <button
              v-if="canEdit"
              data-e2e-type="ar-adjustment-save-btn"
              class="btn btn-primary"
              :disabled="!isValid"
              @click="showConfirmDialog">
              Save
            </button>
            <cc-payment-modal
              v-else-if="isDebitMemo"
              :entity-id="entityId"
              :amount="balance"
              :currency="adjustment.accounting.currency.isoCode"
              :entity-no="adjustment.no"
              :entity-status="adjustment.status"
              :entity-contact-id="adjustment.contact._id"
              :entity-company-hierarchy="adjustment.company.hierarchy"
              data-e2e-type="ar-adjustment-payment-modal"/>
            <button
              data-e2e-type="ar-adjustment-cancel-btn"
              class="btn btn-secondary ml-2"
              @click="close">
              Cancel
            </button>
        </div>
      </div>
    </div>
    <confirm-dialog
      @confirm="onConfirmSaving"
      ref="confirmDialog"
      data-e2e-type="ar-adjustment-confirmation-dialog"
      :container-class="'small-dialog'"
      confirmationTitle="Please confirm"
      confirmationMessage="You are about to adjust a company invoice. Would you like to continue?"/>
  </div>
</template>

<script src="./ar-adjustment-edit.js"></script>
