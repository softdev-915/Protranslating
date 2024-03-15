<template>
  <div class="pts-grid-edit-modal" data-e2e-type="payment-edit" :class="{ 'blur-loading-row': httpRequesting }">
    <div slot="default" data-e2e-type="ar-payment-edit-body">
      <div class="container-fluid mb-4">
        <h6 class="d-inline-block mr-4">Payment Options</h6>
        <hr class="mt-1 mb-2" />
        <div class="row">
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block required">Payment Source</label>
            <simple-basic-select
              data-e2e-type="ar-payment-source"
              :options="sourceOptions"
              v-model="payment.sourceType"
              :disabled="!isNew"
            />
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block required">Payment Target</label>
            <simple-basic-select
              data-e2e-type="ar-payment-target"
              :options="targetOptions"
              v-model="payment.targetType"
              :disabled="!isNew"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3 mb-2" v-if="isDirectPayment">
            <label class="d-block required">Payment Method</label>
            <payment-method-select
              data-e2e-type="ar-payment-method-select"
              v-if="isEditable"
              v-model="payment.method"
              :disabled="!isDirectPayment"
              :format-option="formatters.paymentMethod"
            />
            <input
              v-else
              data-e2e-type="ar-payment-method-read-only"
              type="text"
              disabled
              class="form-control"
              :value="paymentMethodName"
            >
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block required">Company</label>
            <company-select
              v-if="isNew"
              data-e2e-type="ar-payment-company-select"
              :selected-option="selectedCompany"
              :is-disabled="!isNew"
              @select="onCompanySelect"
            />
            <input
              v-else
              data-e2e-type="ar-payment-company-read-only"
              type="text"
              disabled
              class="form-control"
              :value="payment.company.hierarchy"
            >
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block" v-if="isNew">Company Balance</label>
              <currency-input
                v-if="isNew"
                disabled
                class="form-control"
                :currency="null"
                @change="() => false"
                :precision="2"
                :value="balanceInSelectedCurrency"
                data-e2e-type="ar-payment-company-balance"
              />
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3 mb-2 radio-btns-wrapper" v-if="isDirectPayment && canReadAll && isEditable">
            <label class="d-block required">Account type</label>
            <div class="d-flex align-items-center">
              <input
                type="radio"
                v-model="accountType"
                class="form-control"
                value="Bank Account"
                data-e2e-type="ar-payment-account-type-bank-account"
              >
              <label class="mb-0 ml-1">Bank Account</label>
            </div>
            <div class="d-flex align-items-center">
              <input
                type="radio"
                v-model="accountType"
                class="form-control"
                value="Undeposited Funds Account Identifier"
                data-e2e-type="ar-payment-account-type-und-funds"
              >
              <label class="mb-0 ml-1">Undeposited Funds Account Identifier</label>
            </div>
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="isDirectPayment && canReadAll && isBankAccountSelected">
            <label class="d-block required">{{ accountType }}</label>
            <simple-basic-select
              v-if="isEditable"
              v-model="payment.bankAccount"
              :options="bankAccountOptions"
              :disabled="!isDirectPayment"
              :format-option="formatters.bankAccount"
              data-e2e-type="ar-payment-bank-account-select"
            />
            <input
              v-else
              type="text"
              disabled
              class="form-control"
              :value="bankAccountName"
              data-e2e-type="ar-payment-bank-account-read-only"
            >
          </div>
          <div class="col-12 col-md-3 mb-2" v-if="isDirectPayment && canReadAll && !isBankAccountSelected">
            <label class="d-block required">Undeposited Funds Account Identifier</label>
            <input
              type="text"
              disabled
              class="form-control"
              :value="undepositedAccountIdentifier"
              data-e2e-type="ar-payment-und-funds-value"
            >
          </div>
          <div class="col-12 col-md-3 mb-2">
            <label class="d-block required">Currency</label>
            <currency-select
              v-if="isNew"
              v-model="payment.accounting.currency"
              :fetch-on-created="false"
              :currenciesAvailable="currencies"
              :format-option="formatters.currency"
              :is-disabled="!isNew || !isBankAccountSelected"
              data-e2e-type="ar-payment-currency-select"
            />
            <input
              v-else
              type="text"
              disabled
              class="form-control"
              :value="payment.accounting.currency.isoCode"
              data-e2e-type="ar-payment-currency-read-only"
            >
          </div>
        </div>
        <si-connector-details v-model="payment.siConnector" v-if="!isNew" />
      </div>
      <div class="container-fluid mb-4">
        <h6 class="d-inline-block mr-4">Payment Details</h6>
        <hr class="mt-1 mb-2" />
        <div class="row">
          <div class="col-12 col-md-3 mb-3" v-if="!isNew">
            <label class="d-block">AR Payment ID</label>
            <input
              class="form-control"
              disabled
              :value="payment._id"
              data-e2e-type="ar-payment-id"
            />
          </div>
          <div class="col-12 col-md-3 mb-3">
            <label class="d-block required">Receipt Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="payment.receiptDate"
              :disabled="!isEditable"
              data-e2e-type="ar-payment-receipt-date"
            />
          </div>
          <div class="col-12 col-md-3 mb-3" v-if="isDirectPayment">
            <label class="d-block required">Document Payment Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="payment.date"
              :disabled="!isEditable"
              data-e2e-type="ar-payment-document-payment-date"
            />
          </div>
          <div class="col-12 col-md-3 mb-3" v-if="isDirectPayment">
            <label class="d-block">Document Number</label>
            <input
              type="text"
              class="form-control"
              v-model="payment.docNo"
              :disabled="!isEditable || !isDirectPayment"
              data-e2e-type="ar-payment-document-number"
            >
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6 mb-3">
            <label class="d-block">Description</label>
            <input
              type="text"
              class="form-control"
              v-model="payment.description"
              :disabled="!isEditable"
              data-e2e-type="ar-payment-description"
            >
          </div>
          <div class="col-12 col-md-3 mb-3" >
            <label v-if="!isNew" class="d-block">Attachments</label>
            <attachments-modal
              v-if="!isNew"
              v-model="payment.attachments"
              :service="_service()"
              :entity-id="entityId"
              data-e2e-type="ar-payment-attachments"
            />
          </div>
          <div class="col-0 col-md-3 mb-3" v-if="isDirectPayment"/>
          <div class="col-12 col-md-3 mb-3" v-if="isDirectPayment">
            <label class="d-block">Payment Amount</label>
            <currency-input
              class="form-control"
              v-model="payment.accounting.amount"
              :disabled="!isNew || !isDirectPayment"
              :currency="null"
              :precision="2"
              data-e2e-type="ar-payment-amount"
            />
          </div>
          <div class="col-12 col-md-3 mb-3" v-if="isDirectPayment && canReadAll">
            <label class="d-block">Exchange Rate</label>
            <currency-input
              disabled
              class="form-control"
              :currency="null"
              @change="() => false"
              :precision="5"
              :value="exRate"
              data-e2e-type="ar-payment-exchange-rate"
            />
          </div>
          <div class="col-12 col-md-3 mb-3" v-if="isDirectPayment && canReadAll">
            <label class="d-block">Local Amount</label>
            <currency-input
              disabled
              class="form-control"
              :currency="null"
              @change="() => false"
              :precision="2"
              :value="localAmount"
              data-e2e-type="ar-payment-local-amount"
            />
          </div>
        </div>
      </div>
      <div class="container-fluid mb-4" v-if="!isDirectPayment">
        <p class="d-inline-block m-0 font-weight-bold">Payment Entries</p>
        <hr class="my-1" />
        <div class="row">
          <div class="col-12 col-md-3 mb-3">
            <label class="d-block required">Source Entity</label>
            <simple-basic-select
              v-if="isNew"
              v-model="payment.source"
              :options="sourceEntities"
              :format-option="formatters.sourceEntity"
              :disabled="!isNew"
              data-e2e-type="ar-payment-entries-source-select"
            />
            <input
              v-else
              type="text"
              disabled
              class="form-control"
              :value="payment.source"
              data-e2e-type="ar-payment-entries-source-read-only"
            >
          </div>
          <div class="col-12 col-md-3 mb-3" v-if="isNew">
            <label class="d-block required">Available</label>
            <currency-input
              disabled
              class="form-control"
              :currency="null"
              @change="() => false"
              :precision="2"
              :value="availableSourceAmount"
              data-e2e-type="ar-payment-entries-available"
            />
          </div>
          <div class="col-12 col-md-3 mb-3" :class="{ 'has-danger': notValidAmount  }">
            <label class="d-block required">{{ isNew ? 'Credits To Apply' : 'Applied' }}</label>
            <currency-input
              class="form-control"
              :disabled="!isNew"
              :currency="null"
              :precision="2"
              v-model="payment.accounting.amount"
              data-e2e-type="ar-payment-entries-applied"
            />
          </div>
        </div>
      </div>
      <div class="container-fluid mb-4" v-if="isNew">
        <h6 class="d-inline-block m-0 font-weight-bold">Available Invoices and Debit Memos</h6>
        <hr class="my-1" />
        <div class="my-4">
          <table class="table table-sm table-bordered table-striped table-hover table-stacked">
            <thead class="hidden-xs-down">
              <tr>
                <th>Number</th>
                <th>Currency</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Balance</th>
                <th>Amount Allocated</th>
              </tr>
            </thead>
            <tbody data-e2e-type="ar-payment-memos-body">
              <tr
                v-for="entry of targetEntities"
                :key="entry._id"
                data-e2e-type="ar-payment-memos-row"
              >
                <td>
                  <b class="hidden-sm-up">Number:</b>
                  <span data-e2e-type="ar-payment-memos-row-number">{{ entry.no }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Currency:</b>
                  <span data-e2e-type="ar-payment-memos-row-currency">{{ appliedCurrencyISO }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Date:</b>
                  <span data-e2e-type="ar-payment-memos-row-date">{{ entry.date }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Due Date:</b>
                  <span data-e2e-type="ar-payment-memos-row-due-date">{{ entry.dueDate }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Total Amount:</b>
                  <span data-e2e-type="ar-payment-memos-row-total-amount">{{ entry.amount }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Balance:</b>
                  <span data-e2e-type="ar-payment-memos-row-balance">{{ entry.balance }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Amount Allocated:</b>
                  <currency-input
                    class="form-control w-100"
                    :class="{ 'has-danger': !isLineItemValid(entry) }"
                    :currency="null"
                    :precision="2"
                    v-model="entry.applied"
                    data-e2e-type="ar-payment-memos-row-amount-allocated"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot v-if="targetEntities.length">
              <tr>
                <th colspan="4" class="hidden-xs-down"></th>
                <th>Subtotals</th>
                <th data-e2e-type="ar-payment-memos-subtotal">{{ debitSubtotals }}</th>
                <th>
                  <currency-input
                    disabled
                    class="w-100 form-control"
                    :currency="null"
                    @change="() => false"
                    :precision="2"
                    :value="allocatedAmount"
                    data-e2e-type="ar-payment-memos-allocated-amount"
                  />
                </th>
              </tr>
              <tr>
                <th colspan="5"></th>
                <td>Allocation Remaining Amount</td>
                <th>
                  <currency-input
                    disabled
                    class="w-100 form-control"
                    :currency="null"
                    @change="() => false"
                    :precision="2"
                    :value="allocationRemainingAmount"
                    data-e2e-type="ar-payment-memos-remaining-amount"
                  />
                </th>
              </tr>
              <tr>
                <th colspan="5"></th>
                <td>Total Payment Amount</td>
                <th>
                  <currency-input
                    disabled
                    class="w-100 form-control"
                    placeholer="0"
                    :currency="null"
                    @change="() => false"
                    :precision="2"
                    :value="payment.accounting.amount"
                    data-e2e-type="ar-payment-memos-total-amount"
                  />
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="container-fluid mb-4" v-else>
        <div class="row">
          <div class="my-4 p-3">
            <table class="table table-sm table-bordered table-striped table-hover table-stacked">
              <thead class="hidden-xs-down">
                <tr>
                  <th>Applied to</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Applied Amount</th>
                </tr>
              </thead>
              <tbody data-e2e-type="ar-payment-target-body">
                <tr
                  v-for="tgt of payment.target"
                  :key="tgt.no"
                  data-e2e-type="ar-payment-target-row"
                >
                  <td>
                    <b class="hidden-sm-up">Applied to:</b>
                    <span data-e2e-type="ar-payment-target-row-applied-to">{{ tgt.no }}</span>
                  </td>
                  <td>
                    <b class="hidden-sm-up">Date:</b>
                    <span data-e2e-type="ar-payment-target-row-date">{{ tgt.date }}</span>
                  </td>
                  <td>
                    <b class="hidden-sm-up">Due Date:</b>
                    <span data-e2e-type="ar-payment-target-row-due-date">{{ tgt.dueDate }}</span>
                  </td>
                  <td>
                    <b class="hidden-sm-up">{{ isDirectPayment ? 'Amount' : 'Applied Amount' }}:</b>
                    <span data-e2e-type="ar-payment-target-row-amount">{{ tgt.amount | toCurrency }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" data-e2e-type="ar-payment-close-btn" @click="close">Close</button>
        <void-modal v-if="canVoid && payment.siConnector.isSynced" :details="voidDetails" @submit="voidPayment"/>
        <button
          v-if="isEditable"
          class="btn btn-primary pull-right mr-2"
          data-e2e-type="ar-payment-save-btn"
          @click="save"
          :disabled="!isPaymentValid"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./ar-payment-edit.js" />
<style lang="scss" scoped src="./ar-payment-edit.scss"></style>
