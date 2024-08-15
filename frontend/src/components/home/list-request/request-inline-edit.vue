<template>
  <div class="pts-grid-edit-modal" :class="{'blur-loading-row': loadingRequest || saving}" @keydown.ctrl.83.prevent.stop="onSave">
    <div>
      <progress-upload
        confirmationMessage='You are about to cancel uploading the file. Are you sure?'
        @confirm="cancelUpload"
      />
      <div slot="default" :class="requestContainerClasses" data-e2e-type="request-edit-body">
        <div id="requestDetailForm" class="container-fluid" :class="{'pts-non-editable-form': !inputEnabled}">
          <section>
            <input type="hidden" name="requestId" :value="requestEntity._id">
            <div class="row" v-if="!isNewRecord">
              <div class="col-12">
                <b-alert :show="canReadPortalCatFinalFiles && areAllFinalFilesGenerated" data-e2e-type="request-download-all-target-files">All linguistic tasks for all workflows have been completed. <a :href="finalFilesUrl" class="download-all-target-files">Click here to download all final files.</a></b-alert>
              </div>
              <div class="col-12 col-md-6">
                <b>Request No.</b>
                <span data-e2e-type="request-no">{{requestEntity.no}}</span>
              </div>
              <div v-if="lsp.supportsIpQuoting" class="col-6 col-md-3">
                <b>Request Type</b>
                <span data-e2e-type="request-type-name">{{ requestType.name }}</span>
              </div>
            </div>
            <div class="row mt-2" v-if="!canOnlyReadRequestAssignedTask">
              <div class="col-12">
                <h6>Contact Details</h6>
                <hr>
              </div>
            </div>

            <div class="row">
              <div class="col-12 col-md-6">
                <div class="row">
                  <div class="col-12" :class="{'has-danger': !isValidCompany}" v-if="isNewRecord && (canEditCompany || canCreateEditRequestCompany)">
                    <label class="d-block">
                      <span class="pts-required-field">*</span>Company
                    </label>
                    <company-ajax-basic-select
                      data-e2e-type="company-select"
                      :selected-option="selectedCompany"
                      :required="true"
                      :fetch-on-created="false"
                      :load-pre-selected-option="hasRequestTemplate"
                      :is-disabled="areAllInputsDisabled"
                      :select="'_id name parentCompany mandatoryRequestContact availableTimeToDeliver isMandatoryExternalAccountingCode pcSettings'"
                      @select="onCompanySelected"
                    />
                  </div>
                  <div class="col-12 pl-0" v-else-if="canReadOwnCompanyRequest">
                    <div class="row align-items-center">
                      <label class="col-2 form-check-label">Company</label>
                      <div class="col-10" data-e2e-type="company-read-only">{{ companyHierarchy }}</div>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div v-if="isNewRecord && !userIsContact" class="col-12"
                    :class="{'blur-loading-row' : loadingContacts, 'has-danger': !isValidContact }"
                    data-e2e-type="contact-container">
                    <label class="d-block">
                    <span
                      v-show="mandatoryRequestContact"
                      data-e2e-type="mandatory-request-contact"
                      class="pts-required-field">*</span> Contact
                    </label>
                    <contact-select
                      id="contactSelect"
                      v-model="requestEntity.contact"
                      :company-id="companyId"
                      :fetchOnCreated="false"
                      :only-hierarchy="true"
                      :is-disabled="areAllInputsDisabled"
                      @contacts-loaded="onContactLoaded($event)" />
                  </div>
                  <div class="col-12 pl-0" v-else-if="canReadOwnCompanyRequest">
                    <div class="row align-items-center">
                      <label class="col-2 form-check-label" for="contactName">Contact</label>
                      <div class="col-10" id="contactName">{{ contactName }} </div>
                    </div>
                  </div>
                </div>

                <div class="row align-items-center">
                  <div class="col-12 pl-0" v-if="!(isNewRecord && !userIsContact) && canReadOwnCompanyRequest">
                    <div class="row align-items-center">
                      <label class="col-2 form-check-label">Email</label>
                      <div id="contactEmail" class="col-10">{{ contactEmail }} </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-6" v-if="!isNewRecord && !userIsContact && canReadAllRequests && !isTaskViewRoute && !loadingRequest">
                <div class="row" v-if="showGrossProfitCalculator">
                  <div class="col-12">
                    <h6 data-e2e-type="gross-profit-calculator-label">Gross profit calculator</h6>
                    <div class="row">
                      <div class="col-4 font-weight-bold">
                        Invoice total
                      </div>
                      <div class="col-8" data-e2e-type="workflow-invoice-grand-total">
                        {{ localCurrency.isoCode }} {{ invoiceTotal | toCurrency }}
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="row">
                      <div class="col-4 font-weight-bold">
                        Projected Cost Total
                      </div>
                      <div class="col-8" data-e2e-type="workflow-projected-cost-grand-total">
                        {{ localCurrency.isoCode }} {{ projectedCostTotal | toCurrency }}
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="row">
                      <div class="col-4 font-weight-bold">
                        Projected GP%
                      </div>
                      <div class="col-8" data-e2e-type="workflow-projected-cost-gp-total">
                        {{ projectedGP }}%
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="row">
                      <div class="col-4 font-weight-bold">
                        Actual Billable Cost Total
                      </div>
                      <div class="col-8" data-e2e-type="workflow-bill-grand-total">
                        {{ localCurrency.isoCode }} {{ billTotal | toCurrency }}
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="row">
                      <div class="col-4 font-weight-bold">
                        Actual GP%
                      </div>
                      <div class="col-8" data-e2e-type="workflow-bill-gp-grand-total">
                        {{ billGP }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="row">
            <div class="col-12 font-weight-bold">
              <h6>Request Details</h6>
              <hr>
            </div>
          </div>

          <div class="row align-items-center" v-if="!isNewRecord && status === 'Cancelled' || status === 'Completed'">
            <div class="col-12 col-md-6">
              <div v-if="status === 'Completed'">
                <b>Last Completed At:</b>
                <span data-e2e="last-completed-at">
                  {{ localDate(requestEntity.completedAt, 'YYYY-MM-DD HH:mm') }}
                </span>
              </div>
              <div v-if="status === 'Cancelled'">
                <b>Last Cancelled At:</b>
                <span data-e2e="last-cancelled-at">
                  {{ localDate(requestEntity.cancelledAt, 'YYYY-MM-DD HH:mm') }}
                </span>
              </div>
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-12 col-md-6" :class="{'has-danger': !isValidTitle}">
              <label for="title">
                <span class="pts-required-field">*</span> Title
              </label>
              <input
                v-if="canShowInput"
                id="title"
                v-validate="'required'"
                type="text"
                name="title"
                :disabled="isWorkflowInEditMode || isRequestCompleted"
                v-model.trim="requestEntity.title"
                class="form-control" />
              <div data-e2e-type="request-title-read-only" v-else>{{ requestEntity.title}}</div>
            </div>

            <div class="col-12 col-md-6" id="status" v-if="canEditStatus">
              <label>
                <span class="pts-required-field">*</span> Status
              </label>
              <request-status-select
                :class="{'has-danger': !isValidStatus }"
                :value="requestEntity.status"
                :format-option="formatStatusOption"
                @change="onStatusSelected"
                :disabled="isWorkflowInEditMode || isRequestCompleted"
                class="non-focusable"
                placeholder="Select status"
                :options="requestStatusesList" />
            </div>

            <div v-else-if="!isNewRecord" class="col-12 col-md-6" data-e2e-type="request-status-read-only">
              <label>Status</label>
              <div>{{ requestEntity.status}}</div>
            </div>
          </div>

          <div class="row">
            <div class="col-12 col-md-6">
              <div>
                <label class="pt-2">Project Managers</label>
                <div id="requestProjectManagers" v-if="canEditProjectManagersList">
                  <project-manager-multi-select
                    v-model="requestEntity.projectManagers"
                    :fetch-on-created="false"
                    placeholder="Select Project Managers"
                    title="Project manager list"
                    :is-disabled="userIsContact || areAllInputsDisabled" />
                </div>
                <div v-else-if="(canReadOwnCompanyRequest || canReadRequestAssignedTask) && !isNewRecord" data-e2e-type="request-project-manager-list-read-only">
                  {{projectManagersSelected}}
                </div>
              </div>
              <div :class="{'has-danger': !isValidInternalDepartment}" v-if="!userIsContact && canReadInternalDepartments">
                <label class="pt-2">
                  <span class="pts-required-field">*</span> LSP Internal Department
                </label>
                <internal-department-selector
                  :class="{'has-danger': !isValidInternalDepartment}"
                  :format-option="formatInternalDepartmentSelectOption"
                  :empty-option="{ text: '', value: {} }"
                  :is-disabled="!canEditAll || areAllInputsDisabled"
                  :fetch-on-created="true"
                  data-e2e-type="request-internal-department-select"
                  placeholder="Select LSP Internal Department"
                  v-model="requestEntity.internalDepartment"/>
              </div>
            </div>
            <div class="col-12 col-md-6 align-items-start h-100">
              <div class="service-delivery-types-required" v-if="!userIsContact && canEditServiceAndDeliveryType">
                <label for="servicedeliverytyperequired">
                  Service/Delivery type required
                </label>
                <input
                  type="checkbox"
                  class="ml-2"
                  data-e2e-type="service-delivery-type-required-checkbox"
                  :disabled="isWorkflowInEditMode || requestEntity.isQuoteApproved"
                  v-model="requestEntity.serviceDeliveryTypeRequired" />
              </div>
              <div class="row">
                <div class="col-12 col-md-6 service-type" v-if="requestEntity.serviceDeliveryTypeRequired && canEditServiceAndDeliveryType">
                  <label class="pt-2">Service Type</label>
                  <service-type-ajax-basic-select
                    data-e2e-type="service-type-select"
                    :empty-option="{ text: '', value: null }"
                    :is-disabled="isWorkflowInEditMode || requestEntity.isQuoteApproved"
                    placeholder="Service type"
                    v-model="requestEntity.serviceTypeId"
                  />
                </div>
                <div class="col-12 col-md-6 delivery-type" v-if="requestEntity.serviceDeliveryTypeRequired && canEditServiceAndDeliveryType">
                  <label class="pt-2">Delivery Type</label>
                  <delivery-type-ajax-basic-select
                    data-e2e-type="delivery-type-select"
                    :empty-option="{ text: '', value: null }"
                    :is-disabled="isWorkflowInEditMode || requestEntity.isQuoteApproved"
                    :selected-service-type="requestEntity.serviceTypeId"
                    placeholder="Delivery type"
                    v-model="requestEntity.deliveryTypeId"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="row align-items-center" v-if="canReadExternalAccountingCodes">
            <div class="col-12 col-md-6" :class="{'has-danger': isExternalAccountingCodeRequired && !isValidExternalAccountingCode}">
              <label class="pt-2" data-e2e-type="external-accounting-code-label">
                <span v-if="isExternalAccountingCodeRequired" class="pts-required-field" data-e2e-type="mandatory-external-accounting-code">*</span> External Accounting Code
              </label>
              <external-accounting-code-select
                :is-disabled="!canEditExternalAccountingCode"
                :fetch-on-created="false"
                :selected-option="selectedExternalAccountingCode"
                data-e2e-type="request-external-accounting-code"
                placeholder="Select External Accounting Code"
                :filter="{ 'company._id': companyId }"
                @select="onExternalAccountingCodeSelected"/>
            </div>
          </div>

          <div class="row align-items-center" v-if="canReadCompetenceLevels && !userIsContact">
            <div class="col-12 col-md-6">
              <label><span class="pts-required-field">*</span> Competence Levels </label>
              <div>
                <competence-level-selector
                  data-e2e-type="request-competence-level"
                  placeholder="Select Competence Levels"
                  :is-disabled="!canReadCompetenceLevels || areAllInputsDisabled"
                  :fetch-on-created="false"
                  :return-full-option="true"
                  :class="{'has-danger': !isValidCompetenceLevels}"
                  v-model="requestEntity.competenceLevels"/>
              </div>
            </div>
          </div>

          <div class="row" v-if="hasRole({ oneOf: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'] })">
            <div class="col-12 col-md-6">
              <label>Opportunities</label>
                <opportunity-ajax-basic-select
                  :fetch-on-created="false"
                  :filter="opportunityFilter"
                  :selected-option="opportunitySelected"
                  :is-disabled="areAllInputsDisabled"
                  @select="onOpportunitySelected"
                  data-e2e-type="opportunity-selector"/>
            </div>
          </div>
          <div class="row" v-if="requestEntity.opportunityNo" data-e2e-type="opportunity-no">
            {{requestEntity.opportunityNo}}
          </div>

          <div class="row align-items-center">
            <div class="col-12 col-md-6" v-if="salesRepName">
              <label for="salesRepName">Sales Rep</label>
              <input
                id="salesRepName"
                data-e2e-type="request-sales-rep-read-only"
                readonly
                :value="salesRepName"
                class="form-control" />
            </div>
            <div class="col-12 col-md-6" v-if="!isNewRecord && !userIsContact && canReadAll">
              <label for="repSignOff">
                Rep Sign Off
              </label>
              <input
                id="repSignOff"
                :disabled="!canEditAll || !canEditOwnCompanyRequest || areAllInputsDisabled"
                type="checkbox"
                class="ml-2"
                data-e2e-type="rep-sign-off-checkbox"
                v-model="requestEntity.repSignOff" />
            </div>
          </div>

          <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
            <div class="col-12 col-md-6">
              <label>Also deliver to</label>
              <div v-if="canEditAlsoDeliverTo && companyId" id="otherContactSelect">
                <contact-select
                  v-model="requestEntity.otherContact"
                  :availableContacts="nullOrContacts"
                  :showIfNoCompany="false"
                  :companyId="companyId"
                  :fetchOnCreated="false"
                  :is-disabled="areAllInputsDisabled"
                  :filter="contactFilter"/>
              </div>
              <div v-else>
                <input
                  data-e2e-type="request-also-deliver-to-read-only"
                  class="form-control"
                  :value="otherContactName"
                  readonly />
              </div>
            </div>
            <div class="col-12 col-md-6" data-e2e-type="request-other-cc">
              <label>Other CC</label>
              <div :class="{'has-danger': otherCCDanger}">
                <comma-separated-email-selector
                  v-if="canEditOtherCC"
                  v-model="requestEntity.otherCC"
                  :readOnly="areAllInputsDisabled"
                  @email-selector-validated="onOtherCCValidation($event)"/>
                <div data-e2e-type="request-other-cc-read-only" v-else>
                  <input
                    class="form-control"
                    :value="requestEntity.otherCC.join(', ')"
                    readonly />
                </div>
              </div>
            </div>
          </div>

          <div class="row align-items-center" v-if="!userIsContact && !canOnlyReadRequestAssignedTask">
            <div class="col-4" :class="{'has-danger': !isValidQuoteCurrency }">
              <label for="request-currency" class="d-block">
                <span v-if="canEditCurrency" class="pts-required-field">*</span> Request currency
              </label>
              <currency-selector
                id="request-currency"
                :format-option="formatCurrencySelectOption"
                :currencies-available="currencyList"
                v-model="selectedRequestCurrency"
                :disabled="!canEditCurrency || areAllInputsDisabled"
                :is-error="!isValidQuoteCurrency"
                data-e2e-type="request-currency-select"
                placeholder="Request Currency"
                title="Request currency">
              </currency-selector>
            </div>
          </div>

          <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
            <div class="col-12 col-md-6" data-e2e-type="request-purchase-order">
              <div class="row">
                <div class="col-2">
                  <label for="poRequired"><span v-show="requestEntity.poRequired" class="pts-required-field">*</span> PO</label>
                </div>
                <div class="col-10 text-right">
                  <label for="poRequired">
                    PO required?
                    <input
                      id="poRequired"
                      :disabled="!canEditPurchaseOrder || isWorkflowInEditMode"
                      type="checkbox"
                      data-e2e-type="request-po-required"
                      v-model="requestEntity.poRequired" />
                  </label>
                </div>
              </div>
              <input
                v-if="canEditPurchaseOrder"
                data-e2e-type="request-po"
                :class="{ 'has-danger': !isValidPo }"
                type="text"
                :disabled="!isPoRequired || isWorkflowInEditMode"
                v-model.trim="requestEntity.purchaseOrder"
                class="form-control" />
              <div v-else data-e2e-type="request-po-read-only"> {{ requestEntity.purchaseOrder }}</div>
            </div>
            <div v-if="lsp.supportsIpQuoting" class="col-12 col-md-6" data-e2e-type="request-reference-number">
              <div class="row">
                <div class="col-12">
                  <label>Reference Number</label>
                </div>
              </div>
              <input
                id="referenceNumber"
                data-e2e-type="referenceNumber"
                type="text"
                :disabled="areAllInputsDisabled"
                v-model.trim="requestEntity.referenceNumber"
                class="form-control" />
            </div>
          </div>

          <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
            <div class="col-12 col-md-6">
              <div class="row align-items-center m-0 pt-2 target-date-container">
                <div class="col-12 col-md-5" v-if="canShowInput">
                  <label><span class="pts-required-field">*</span> Target date and time</label>
                  <div>
                    <flatpickr
                      data-e2e-type="request-target-date-picker"
                      :value="requestEntity.deliveryDate"
                      @input="onDeliveryDateChange($event)"
                      :config="datepickerOptions"
                      :disabled="canEditTimeToDeliver || areAllInputsDisabled"
                      class="form-control"
                      :class="{'has-danger': !isValidDeliveryDate}"
                    />
                  </div>
                </div>
                <div class="col-12 col-md-5" v-else>
                  <label>Target date and time</label>
                  <div data-e2e-type="target-date-read-only">
                    {{ localDate(requestEntity.deliveryDate, 'YYYY-MM-DD HH:mm') }}
                  </div>
                </div>
                <div class="col-12 col-md-2 arrow" >
                  <i class="fas fa-compress converging-arrows"/>
                </div>
                <div class="col-12 col-md-5">
                  <label
                    :class="{'time-to-deliver': !canEditTimeToDeliver}"
                    for="timeToDeliver">
                    <span
                      v-if="canEditTimeToDeliver"
                      class="pts-required-field">
                    *
                    </span>
                    Time to deliver
                  </label>
                  <div :class="{'has-danger': !isValidTimeToDeliver}">
                    <simple-basic-select
                      data-e2e-type="time-to-deliver"
                      v-model="requestEntity.timeToDeliver"
                      :disabled="!canEditTimeToDeliver || !inputEnabled"
                      :options="availableTimeToDeliver"
                      allowSelectedNotInList
                      id="timeToDeliver"/>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6" v-if="canReadTurnaroundTime">
              <label
                for="turnaroundTime"
                data-e2e-type="turnaround-time-notes"
                >
                Turnaround time notes
              </label>
              <div data-e2e-type="turnaround-time">
                <input
                  id="turnaroundTime"
                  v-if="canEditTurnaroundTime"
                  type="text"
                  v-model.trim="requestEntity.turnaroundTime"
                  class="form-control"
                  :disabled="userIsContact || !canEditTurnaroundTime || areAllInputsDisabled" />
                <span v-else-if="canReadOwnCompanyRequest">{{ requestEntity.turnaroundTime }}</span>
              </div>
            </div>
          </div>
          <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
            <div class="col-12 col-md-6">
              <div class="row align-items-center">
                <div class="col-md-7" v-if="requestEntity.requireQuotation">
                  <label for="requestQuoteDueDatePicker">
                    <span class="pts-required-field">*</span>
                    Quote Target Date & Time
                  </label>
                  <div v-if="!inputEnabled">
                    {{ localDate(requestEntity.quoteDueDate, 'YYYY-MM-DD HH:mm') }}
                  </div>
                </div>
                <div :class="{'col-md-5 text-right': requestEntity.requireQuotation, 'col-md-5': !requestEntity.requireQuotation}">
                  <label for="requireQuotation">
                    Quote required?
                    <input
                      id="requireQuotation"
                      type="checkbox"
                      v-model="requestEntity.requireQuotation"
                      :disabled="!canEditRequireQuotation" />
                  </label>
                </div>
              </div>
              <div v-if="canEditQuoteDueDate">
                <flatpickr
                  id="requestQuoteDueDatePicker"
                  data-e2e-type="quote-due-date-picker"
                  :value="localQuoteDueDate"
                  @input="onQuoteDueDateChange($event)"
                  :config="datepickerOptions"
                  :disabled="areAllInputsDisabled"
                  class="form-control"
                  :class="{'has-danger': !isValidQuoteDueDate}" />
              </div>
              <div class="col-12 col-md-6 mt-3" v-if="requestEntity.requireQuotation && requestEntity.isQuoteApproved">
                <b>Quote Approval Date:</b>
                <span data-e2e-type="quote-approval-date">
                  {{ localDate(requestEntity.quoteApprovalDate, 'YYYY-MM-DD HH:mm') }}
                </span>
              </div>
              <div class="mt-2" v-if="requestEntity.requireQuotation">
                <div class="row align-items-center">
                  <div class="col-12" v-if="canReadExpectedQuoteCloseDate">
                    <label for="requestQuoteExpectedCloseDatePicker">
                      <span class="pts-required-field">*</span>
                      Quote Expected Close Date
                    </label>
                    <div v-if="!canEditExpectedQuoteCloseDate">
                      {{ localDate(requestEntity.expectedQuoteCloseDate, 'YYYY-MM-DD HH:mm') }}
                    </div>
                  </div>
                </div>
                <div v-if="canEditExpectedQuoteCloseDate">
                  <flatpickr
                    id="requestQuoteExpectedCloseDatePicker"
                    data-e2e-type="quote-expected-close-date-picker"
                    :value="localExpectedQuoteCloseDate"
                    @input="onExpectedQuoteCloseDateChange($event)"
                    :config="datepickerOptions"
                    class="form-control"
                    :class="{'has-danger': !isValidExpectedQuoteCloseDate}" />
                </div>
              </div>
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-12 col-md-6" v-if="!isTaskViewRoute && !userIsContact && canReadRequest && isRequestTypeExists && !lsp.supportsIpQuoting">
              <label>Request type</label>
                <request-type-select
                  data-e2e-type="requestType"
                  :fetch-on-created="false"
                  :disabled="!canEditAll || areAllInputsDisabled"
                  v-model="requestEntity.requestType"
                  allowSelectedNotInList />
            </div>

            <div class="col-12 my-2"  :class="{'has-danger': !isValidDataClassification }" v-if="canReadDataClassification">
              <label for="request-data-classification" data-e2e-type="data-classification-label" class="d-block">
                <span class="pts-required-field">*</span> Data Classification
              </label>
              <simple-basic-select
                v-model="requestEntity.dataClassification"
                :disabled="!canEditDataClassification || areAllInputsDisabled"
                :is-error="!isValidDataClassification"
                :options="dataClassificationSelectOptions"
                placeholder="Select Data Classification"
                data-e2e-type="dataClassification"/>
              <span
                v-show="!isValidDataClassification"
                class="data-classification-error"
                data-e2e-type="dataClassificationError"
              >The Data Classification field is required.</span>
            </div>

            <div class="col-12 col-md-6" v-if="!isTaskViewRoute && !userIsContact && canReadRequest && !lsp.supportsIpQuoting">
              <label for="referenceNumber">Reference No.</label>
              <div>
                <input
                  id="referenceNumber"
                  type="text"
                  class="form-control"
                  data-e2e-type="referenceNumber"
                  :disabled="!canEditAll || areAllInputsDisabled"
                  v-model="requestEntity.referenceNumber" />
              </div>
            </div>
          </div>
          <div class="row align-items-center" v-if="canSeeWorkflowType">
            <div class="col-12 col-md-6">
              <label>Workflow type</label>
              <basic-select
                :is-disabled="!canChangeWorkflowType || areAllInputsDisabled"
                :options="workflowTypes"
                :selected-option="{ value: requestEntity.workflowType, text: requestEntity.workflowType }"
                @select="onWorkflowTypeSelect"
                data-e2e-type="workflow-type"
                placeholder="Select workflow type"
              />
            </div>
          </div>
          <div class="row align-items-center" v-if="!isNewRecord && !canReadOnlyOwnTask">
            <div class="col-12 col-md-6">
              <label for="requestInvoiceStatusInput">Request Invoice Status</label>
              <input
                id="requestInvoiceStatusInput"
                type="text"
                class="form-control"
                data-e2e-type="request-invoice-status-readonly"
                :disabled="areAllInputsDisabled"
                :value="requestEntity.requestInvoiceStatus"
                readonly/>
            </div>
          </div>
          <div v-if="!isNewRecord && !userIsContact">
            <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
              <div class="col-12 col-md-6">
                <label class="d-block">Invoice to Company</label>
                <company-ajax-basic-select
                  data-e2e-type="invoice-company-select"
                  :selected-option="selectedInvoiceToCompany"
                  :fetch-on-created="false"
                  :select="'_id name parentCompany'"
                  @select="onInvoiceToCompanySelected"
                  :is-disabled="areAllInputsDisabled"
                />
              </div>
            </div>
            <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
              <div class="col-12 col-md-6">
                <label for="invoiceToContactSelect">Invoice to Contact</label>
                <contact-select
                  id="invoiceToContactSelect"
                  v-model="requestEntity.invoiceContact"
                  data-e2e-type="invoice-contact-select"
                  :companyId="selectedInvoiceToCompany.value"
                  :fetchOnCreated="false"
                  :is-disabled="areAllInputsDisabled"
                  @contacts-loaded="onContactLoaded($event)">
                </contact-select>
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-12 col-md-6" v-if="canReadDeliveryMethods">
                <label for="deliveryMethod">Delivery Method</label>
                <div>
                  <delivery-method-selector
                    id="deliveryMethod"
                    data-e2e-type="delivery-method-selector"
                    placeholder="Select Delivery Method"
                    :disabled="!inputEnabled"
                    :fetch-on-created="false"
                    v-model="requestEntity.deliveryMethod">
                  </delivery-method-selector>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label>Translation tools</label>
                <div data-e2e-type="request-cat-tool-select" v-if="canEditAll">
                  <cat-tool-select
                    :show-deleted="false"
                    v-model="requestEntity.catTool"
                    :filter="catToolFilter"
                    :is-disabled="areAllInputsDisabled"
                    placeholder="Select Translation tool"
                    title="Translation Tool list">
                  </cat-tool-select>
                </div>
                <div data-e2e-type="request-cat-tool-read-only" v-else>
                  {{ requestEntity.catTool }}
                </div>
              </div>
            </div>

            <div class="row align-items-center" v-if="!canOnlyReadRequestAssignedTask">
              <div class="col-12 col-md-6">
                <label for="software-requirement">Software Requirement</label>
                <div v-if="canReadSoftwareRequirements">
                  <software-requirement-selector
                    id="software-requirement"
                    :returnFullOption="true"
                    :fetch-on-created="false"
                    data-e2e-type="software-requirement-selector"
                    placeholder="Select Software Requirement"
                    :is-disabled="!inputEnabled"
                    v-model="requestEntity.softwareRequirements">
                  </software-requirement-selector>
                </div>
              </div>
            </div>

            <div class="row align-items-center" v-if="canReadDocumentTypes">
              <div class="col-12 col-md-6">
                <label for="document-type">Document Types</label>
                <div>
                  <document-type-selector
                    id="document-type"
                    data-e2e-type="document-type-selector"
                    placeholder="Select Document Type"
                    :is-disabled="!inputEnabled"
                    :fetch-on-created="false"
                    v-model="requestEntity.documentTypes">
                  </document-type-selector>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="canContactReadCatTool"
            class="col-12 p-2">
            <label>Translation tools</label>
            <div data-e2e-type="request-cat-tool-read-only">
              {{ requestEntity.catTool }}
            </div>
          </div>
          <div v-if="!userIsContact && (canEditRequestTask || canReadInternalComments)">
            <request-task
              :disabled="!canEditAll || areAllInputsDisabled"
              :isValidCommentsLength="isValidInternalCommentsLength"
              :maxCommentsLength="maxCommentsLength"
              :request="requestEntity" />
          </div>

          <div class="row align-items-center" v-if="canEditComments || canReadRequest">
            <label class="col-12 form-check-label">
              <span class="pts-required-field">*</span> Instructions and Comments
            </label>
            <div class="col-12" id="commentsContainer">
              <div class="container-fluid pts-no-padding" :class="{'has-danger': !isValidComments}" data-e2e-type="instructions-and-comments">
                <div class="editor-container">
                  <rich-text-editor
                    :disabled="!canEditComments || areAllInputsDisabled"
                    v-model.trim="comments"
                    placeholder="Comments"
                  ></rich-text-editor>
                </div>
                <span class="form-control-feedback" v-show="!isValidCommentsLength">Maximum comment length is {{ maxCommentsLength }} characters</span>
              </div>
            </div>
          </div>

          <section v-if="!userIsContact">
            <div class="row mt-1" v-if="!canOnlyReadRequestAssignedTask">
              <div class="col-12">
                <a @click="toggleInterpretingSpecificSectionCollapse" data-e2e-type="interpreting-specific-section-expand-icon" title="Expand/Collapse tasks">
                  <i class="pts-clickable fas" :class="toggleCollapseIconClass" aria-hidden="true"></i>
                </a>
                <h6 class="mt-1">Interpreting Specific</h6>
                <hr>
              </div>
              <hr>
            </div>
            <div v-if="!isInterpretingSpecificSectionCollapsed">
            <div class="row">
              <div class="col-12 col-md-6" v-if="!isTaskViewRoute">
                <label>
                  <span class="pts-required-field"></span> Request expected start date time
                </label>
                <flatpickr
                  :disabled="!inputEnabled"
                  data-e2e-type="request-expected-start-date-picker"
                  v-model="requestEntity.expectedStartDate"
                  @input="onExpectedStartDateChange($event)"
                  :config="datepickerOptions"
                  class="form-control" />
              </div>
              <div class="col-12 col-md-6" v-if="!isTaskViewRoute">
                <label for="expectedDurationTimeInput">
                  <span class="pts-required-field"></span>
                  Expected duration time (Hours)
                </label>
                <input
                  id="expectedDurationTimeInput"
                  type="number"
                  class="form-control"
                  :class="{'red-text': calculatedExpectedDurationTime < 0}"
                  :disabled="shouldDisableExpectedDurationTime || areAllInputsDisabled"
                  data-e2e-type="request-expected-duration-time"
                  v-model.number="calculatedExpectedDurationTime">
              </div>
            </div>

            <div v-if="!isNewRecord">
              <div class="row" v-if="!isTaskViewRoute">
                <div class="col-12 col-md-6">
                  <label class="d-block">Request actual START date time</label>
                  <flatpickr
                    :disabled="!inputEnabled"
                    data-e2e-type="request-actual-start-date-picker"
                    @input="onActualStartDateChange($event)"
                    v-model="requestEntity.actualStartDate"
                    :config="datepickerOptions"
                    class="form-control" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="d-block">Request actual END date time</label>
                  <flatpickr
                    :disabled="!inputEnabled"
                    data-e2e-type="request-actual-delivery-date-picker"
                    @input="onActualDeliveryDateChange($event)"
                    v-model="requestEntity.actualDeliveryDate"
                    :config="datepickerOptions"
                    class="form-control" />
                </div>
              </div>

              <div class="row" v-if="canReadAllRequests">
                <div class="col-12 col-md-6">
                  <label for="schedulingCompany">
                    Scheduling Company
                  </label>
                  <company-ajax-basic-select
                    v-if="canShowInput"
                    id="schedulingCompany"
                    :fetch-on-created="false"
                    data-e2e-type="scheduling-company-selector"
                    :selected-option="selectedSchedulingCompany"
                    :select="'_id name hierarchy'"
                    :is-disabled="areAllInputsDisabled"
                    @select="onSchedulingCompanySelected"/>
                  <div v-else data-e2e-type="scheduling-company-read-only">
                    <input
                      type="number"
                      class="form-control"
                      data-e2e-type="scheduling-company-read-only"
                      :value="selectedSchedulingCompany.hierarchy"
                      readonly />
                  </div>
                </div>
              </div>

              <div class="row" v-if="canReadAllRequests">
                <div class="col-12 col-md-6">
                  <label class="d-block" for="schedulingContactSelect">
                    Scheduling Contact
                  </label>
                  <contact-select
                    id="schedulingContactSelect"
                    v-if="_.has(schedulingCompany, '_id')"
                    v-model="schedulingContact"
                    data-e2e-type="scheduling-contact"
                    :companyId="schedulingCompany._id"
                    :fetchOnCreated="false"
                    :showIfNoCompany="false"
                    :is-disabled="!inputEnabled || !hasSchedulingCompany"
                    @contacts-loaded="onContactLoaded($event)">
                  </contact-select>
                </div>
              </div>

              <div class="row" v-if="!isTaskViewRoute">
                <div class="col-12">
                  <label class="d-block">Scheduling Status</label>
                  <scheduling-status-select
                    placeholder="Scheduling status"
                    data-e2e-type="schedulingStatus"
                    :fetch-on-created="false"
                    :disabled="!canEditAll || areAllInputsDisabled"
                    v-model="schedulingStatus">
                  </scheduling-status-select>
                </div>
              </div>

              <div class="row">
                <div class="col-12 col-md-6">
                  <label class="d-block">Location of the request</label>
                  <location-select
                    v-if="!requestDetailsVisible || inputEnabled"
                    data-e2e-type="request-location"
                    entity-name="Request Location"
                    v-model="requestEntity.location"
                    :locationsAvailable="locationsAvailable"
                    :is-disabled="!inputEnabled"
                    :fetch-on-created="false"
                    :return-full-option="true"/>
                  <div v-else-if="canReadLocation" data-e2e-type="request-location-read-only">
                    <p>
                      {{ requestEntity.location.name }}<br>
                      {{ requestEntity.location.address }}, {{ requestEntity.location.suite }}<br>
                      {{ requestEntity.location.city }}, {{ requestEntity.location.state }} {{ requestEntity.location.zip }}<br>
                      {{ requestEntity.location.country }}<br>
                      {{ requestEntity.location.phone }}
                    </p>
                  </div>
                </div>
                <div class="col-12 col-md-6" v-if="canReadAllRequests">
                  <label class="d-block">Insurance company</label>
                  <company-ajax-basic-select
                    v-if="canShowInput"
                    data-e2e-type="insurance-company"
                    :selected-option="selectedInsuranceCompany"
                    :fetch-on-created="false"
                    :select="'_id name parentCompany'"
                    :is-disabled="areAllInputsDisabled"
                    @select="onInsuranceCompanySelected"/>
                  <div v-else>
                    <input
                      type="number"
                      class="form-control"
                      :value="selectedInsuranceCompany.hierarchy"
                      readonly />
                  </div>
                </div>
              </div>
              <div class="row" v-if="!canOnlyReadRequestAssignedTask">
                <div class="col-12 col-md-6">
                  <label for="adjuster-textarea">Adjuster</label>
                  <textarea id="adjuster-textarea" data-e2e-type="adjuster" :disabled="areAllInputsDisabled" v-model="requestEntity.adjuster" class="form-control"/>
                </div>
                <div class="col-12 col-md-6">
                  <label for="memo-textarea">Memo</label>
                  <textarea id="memo-textarea" data-e2e-type="memo" :disabled="areAllInputsDisabled" v-model="requestEntity.memo" class="form-control"/>
                </div>
              </div>
              <div class="row" v-if="canReadAllRequests">
                <div class="col-12 col-md-6">
                  <label class="d-block">Partners</label>
                  <multi-direct-company-select
                    :selected-options="selectedPartners"
                    @select="onPartnerSelect"
                    :fetch-on-created="false"
                    :is-disabled="!inputEnabled"
                    data-e2e-type="partner-multi-select"/>
                </div>
              </div>

              <div class="row" v-if="!isTaskViewRoute && canReadRequest">
                <div class="col-12 col-md-6">
                  <label for="recipient-input" class="d-block">Recipient</label>
                  <input
                    id="recipient-input"
                    type="text"
                    data-e2e-type="recipient"
                    class="form-control"
                    :disabled="areAllInputsDisabled"
                    v-model="requestEntity.recipient"/>
                </div>
              </div>
              <div class="row">
                <div class="col-3" v-if="canReadAll">
                  <label class="d-block">Company notes</label>
                  <textarea data-e2e-type="company-notes" :readonly="true" :disabled="isWorkflowInEditMode" v-model="requestEntity.company.notes" class="form-control" />
                </div>
                <div class="col-3" v-if="!canOnlyReadRequestAssignedTask">
                  <label class="d-block">Department notes</label>
                  <textarea data-e2e-type="request-department-notes" :disabled="areAllInputsDisabled" v-model="requestEntity.departmentNotes" class="form-control" />
                </div>
                <div class="col-3" v-if="!canOnlyReadRequestAssignedTask">
                  <label class="d-block" for="assignmentStatus">Assignment Status</label>
                    <assignment-status-selector
                      v-if="canShowInput"
                      id="assignmentStatus"
                      data-e2e-type="assignment-status-select"
                      placeholder="Select Assignment Status"
                      :disabled="!inputEnabled"
                      v-model="requestEntity.assignmentStatus" />
                  <div v-else data-e2e-type="request-assignment-status-read-only">{{ assignmentStatusName }}</div>
                </div>
                <div class="col-3" v-if="!canOnlyReadRequestAssignedTask">
                  <div class="row">
                    <div class="col-12">
                      <label for="late">Late</label>
                      <input
                        id="late"
                        :disabled="!inputEnabled"
                        type="checkbox"
                        class="ml-2"
                        data-e2e-type="request-late"
                        v-model="requestEntity.late" />
                    </div>
                    <div class="col-12">
                      <label for="rush">Rush</label>
                      <input
                        id="rush"
                        :disabled="!inputEnabled"
                        type="checkbox"
                        class="ml-2"
                        data-e2e-type="request-rush"
                        v-model="requestEntity.rush" />
                    </div>
                    <div class="col-12">
                      <label for="complaint">Complaint/Nonconformance</label>
                      <input
                        id="complaint"
                        :disabled="!inputEnabled"
                        type="checkbox"
                        class="ml-2"
                        data-e2e-type="request-complaint"
                        v-model="requestEntity.complaint" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="row" v-if="!isTaskViewRoute && canReadRequest">
                <div class="col-12 col-md-6">
                  <label for="number-rooms-input" class="d-block">Number of rooms</label>
                  <input
                    id="number-rooms-input"
                    type="number"
                    min="0"
                    data-e2e-type="rooms"
                    class="form-control"
                    :disabled="areAllInputsDisabled"
                    v-model.number="requestEntity.rooms">
                </div>
                <div class="col-12 col-md-6">
                  <label for="number-attendees-input" class="d-block">Number of attendees</label>
                  <input
                    id="number-attendees-input"
                    type="number"
                    min="0"
                    data-e2e-type="attendees"
                    class="form-control"
                    :disabled="areAllInputsDisabled"
                    v-model.number="requestEntity.atendees">
                </div>
              </div>
            </div>
            </div>
          </section>

          <section v-if="isRequestTypeIP">
            <div class="row mt-4">
              <div class="col-12 d-flex align-items-center">
                <h6 class="ip-details-title">IP Details</h6>
                <button
                  v-if="canEditIpDetails"
                  class="ml-4 btn ip-edit-button"
                  type="button"
                  data-e2e-type="edit-ip-details-button"
                  @click="onQuoteEditOpen"
                  >Edit
                </button>
              </div>
              <div class="col-12">
                <hr >
              </div>
            </div>
            <ip-details
              :requestId="requestEntity._id"
              :patent="requestEntity.ipPatent"
              :isIpOrder="isIpOrder"
              :quoteCurrencyIsoCode="originalRequest.quoteCurrency.isoCode"
              :canReadAll="canReadAll"
              :createdBy="requestEntity.createdBy"
              @patent-updated="onPatentUpdate"
              @update-counts="updateCounts"
            />
          </section>
          <div class="row mt-4" v-if="(canUploadFiles || canDownloadSourceFiles || canReadOwnCompanyRequest)">
            <div class="col-12">
              <h6 data-e2e-type="request-language-combinations-label">
                {{ isRequestTypeIP && !canReadAll ? 'Source Documents' : 'Language Combinations and Source Documents' }}
              </h6>
              <hr>
            </div>
            <div class="col-12" data-e2e-type="request-language-combinations" v-if="requestEntity.languageCombinations.length > 0">
              <request-language-combination
                class="language-combination-container"
                data-e2e-type="request-language-combination"
                ref="languageCombination"
                v-for="(languageCombination, index) in requestEntity.languageCombinations" :key="languageCombination._id || index"
                :value="languageCombination"
                :index="index"
                :request="requestEntity"
                :company-id="companyId"
                :source-documents-columns="sourceDocumentsColumns"
                :default-source-language="defaultSourceLanguage"
                :can-edit-all="canEditAll || (canCreate && isNewRecord)"
                :can-upload-files="canUploadFiles"
                :can-download-files="canDownloadSourceFiles"
                :is-single-language-combination="isSingleLanguageCombination"
                :isRequestTypeIP="isRequestTypeIP"
                :canReadAll="canReadAll"
                :non-removable-values="workflowLanguageSet"
                :class="{ danger: languageCombination.hasDanger }"
                @restricted-option-removal="onRestrictedLanguageCombinationRemoval"
                :isAutoScanWorkflow="isAutoScanWorkflow"
                :is-workflow-in-edit-mode="isWorkflowInEditMode"
                :is-user-ip-allowed="isUserIpAllowed"
                :is-portal-cat="isPortalCat"
                :is-cat-import-running="isCatImportRunning"
                :imported-cat-files="importedCatFiles"
                @run-cat-import="runCatImport"
                @input="onLanguageCombinationUpdate($event, index)"
                @upload-file="onFileUpload"
                @delete-document="onDocumentDelete"
                @add-language-combination="onAddLanguageCombination()"
                @delete-language-combination="onDeleteLanguageCombination(index)"
                @preferred-language-combination-selected="onSelectedPreferredLanguageCombination(index, $event)">
              </request-language-combination>
            </div>
          </div>
          <div v-if="canReadCustomFields" class="row">
            <div class="accordion col-12">
              <div class="accordion-item" data-e2e-type="expand-custom-fields-button" :class="{'active-accordion' : isCustomFieldAccordionActive}">
                  <div class="accordion-header"  data-e2e-type="custom-fields-label"  @click="isCustomFieldAccordionActive = !isCustomFieldAccordionActive">
                      <h6 data-e2e-type="custom-fields-label">Custom fields <span>(max. 5)</span> </h6>
                      <span class="accordion-arrow material-symbols-rounded">expand_more</span>
                    </div>
                    <hr>
                  <div class="accordion-content">
                    <custom-field-list
                      v-model="requestEntity.customStringFields"
                      @remove-custom-field="onCustomFieldDeletion"
                      :is-disabled="!canEditCustomFields"
                    />
                  </div>
              </div>
            </div>
          </div>
          <div
            v-if="isPortalCat"
            class="d-flex justify-content-end">
            <button
                class="btn btn-outline-primary mr-3"
                @click="navigateToStatistics"
                :disabled="!(canReadStatistics && hasRequestAnalysis)"
                data-e2e-type="portalcat-statistics">
              <i class="fas fa-bar-chart fa-fw"></i>
              Statistics
            </button>
            <button
              class="btn btn-success mr-1"
              @click="openRunStatisticsModal"
              :disabled="!canRunStatistics"
              data-e2e-type="run-portalcat-statistics">
              <i
                v-if="isRequestAnalysisRunning"
                class="fas fa-spinner fa-pulse fa-fw"></i>
              <i
                v-else
                class="fas fa-play fa-fw"></i>
              Run Statistics
            </button>
          </div>
          <div class="col-12 mt-3" v-if="canReadFinalFiles">
              <h6>Final documents</h6>
              <hr>
          </div>
          <div class="row" v-if="canReadFinalFiles">
            <div class="col-12" id="finalFiles" data-e2e-type="request-final-files">
              <div class="pts-font-bold final-files" v-if="canDownloadFinalFiles && hasFinalDocumentsToDownload">
                <button
                  data-e2e-type="download-all-final-file"
                  v-if="canDownloadFinalFiles && hasFinalDocumentsToDownload"
                  v-show="!downloading"
                  :disabled="areAllInputsDisabled"
                  @click="triggerDownload($event)"
                  class="pts-clickable btn request-upload-document-button pull-right">
                  <a :href="`/get-file?url=${requestZipFinalFileURL}`" class="download-button-link">
                    Download All Final Files
                    <i class="fas fa-file-archive-o"></i>
                  </a>
                </button>
                <span class="pull-right saving-spinner" v-show="downloading">
                  <i class="fas fa-spinner fa-pulse fa-fw"></i>
                </span>
                <iframe-download
                  v-if="canDownloadFinalFiles || canDownloadSourceFiles"
                  ref="iframeDownload"
                  :url="requestZipFinalFileURL"
                  @download-finished="onDownloadFinished()"
                  @download-error="onIframeDownloadError($event)"
                ></iframe-download>
              </div>
              <request-files
                :useIframeDownload="false"
                ref="finalDocuments"
                :entityId="requestEntity._id"
                :documents="finalDocuments"
                :visibleColumns="finalDocumentsColumns"
                :service="requestService"
                :canDelete="false"
                :urlResolver="documentUrlResolver"
                :canDownload="isUserIpAllowed"
                :company-id="companyId">
              </request-files>
            </div>
          </div>
          <div class="row align-items-center" v-if="!isNewRecord && canReadActivities">
            <div class="col-12">
              <h5>Activities</h5>
              <h6 data-e2e-type="manageActivity" class="p-md-4">
                <a :href="activitiesLink" @click="manageActivity($event)">
                  <u>View Request Activities</u>
                </a>
              </h6>
            </div>
          </div>
          <div slot="modal-footer" class="form-actions">
            <button
              class="btn btn-secondary pull-right"
              id="close"
              v-show="!saving && !loadingRequest && !uploading"
              @click="closeRequest">Close
            </button>
            <div v-if="canSaveRequest">
              <button
                class="btn btn-primary pull-right mr-2"
                data-e2e-type="request-save-button"
                :disabled="isSaveButtonDisabled"
                @click="save"
                id="save"
                v-show="!saving && !loadingRequest && !uploading"
              >
                Save
              </button>
            </div>
            <button
              id="request-clone-btn"
              v-if="canCloneRequest"
              class="pts-clickable btn request-clone-button pull-right mr-2"
              @click="onCloneRequest"
              >Clone Request<i class="fas ml-1 fa-file" />
            </button>
            <button
              v-show="showQuoteDetailButton"
              v-if="canReadQuotes"
              class="btn btn-primary pull-right mr-2"
              data-e2e-type="quote-detail-button"
              @click="onQuoteDetailOpen"
              :disabled="!canReadQuotes">
            Quote Detail
          </button>
            <span class="pull-right saving-spinner" v-show="saving || uploading">
              <i class="fas fa-spinner fa-pulse fa-fw"></i>
            </span>
          </div>
          <div class="row w-100 mt-3 ml-1" v-if="isWorkflowsVisible">
            <div class="col-12">
              <h6 data-e2e-type="workflows-header">
                Workflows<span v-if="canReadWorkflowsCount">: {{ workflowsCount }} in total</span>
              </h6>
            </div>
            <div
              id="workflows"
              class="col-12 p-0 pl-2"
              :class="{'red-border': !isValidWorkflowList }">
              <workflow-list
                v-model="requestEntity"
                :request-analysis="requestAnalysis"
                :user-is-contact="userIsContact"
                :is-valid-request="isValidRequest"
                :is-request-without-workflows-valid="isRequestWithoutWorkflowsValid"
                :original-request="originalRequest"
                :is-foreign-currency-request="isForeignCurrencyRequest"
                :has-request-changed="hasRequestChanged"
                :are-workflows-loading="areWorkflowsLoading"
                :edited-workflow-ind="editedWorkflowIndex"
                @workflow-update="onWorkflowUpdate"
                @quote-detail-open="onQuoteDetailOpen"
                :pc-errors="pcErrors"
                :saveRequest="save"
                :is-portal-cat="isPortalCat"
                :is-cat-import-running="isCatImportRunning"
                :is-user-ip-allowed="isUserIpAllowed"
                @document-upload="onWorkflowTaskDocumentUpload"
                @workflows-validation="onWorkflowsValidation"
                @workflow-changed="onWorkflowChange"
                @workflows-loading="onWorkflowsLoading"
                @on-ability-list="onAbilityList"
                @document-delete="onDocumentDelete"
                @request-refresh="_refreshEntity"
                @request-save="saveRequest" />
            </div>
          </div>
        </div>
        <confirm-dialog
          :data-e2e-type="confirmDialogType"
          :container-class="'medium-dialog'"
          cancel-text="No"
          :confirmation-message="confirmDialogMessage"
          :confirmation-title="confirmDialogTitle"
          @confirm="onDialogConfirm"
          @cancel="onDialogConfirm"
          ref="confirmDialog"
        />
        <run-statistics-modal
          ref="runStatisticsModal"
          v-model="pcLockedSegments"
          :is-disabled="!canRunStatistics"
          @run-statistics="runStatistics"
        />
      </div>
    </div>
  </div>
</template>

<script src="./request-inline-edit.js"></script>

<style scoped lang="scss" src="./request-inline-edit.scss"></style>
<style lang="scss" src="./request-inline-edit_global.scss"></style>
