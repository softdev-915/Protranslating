<template>
  <div class="container-fluid pl-1" data-e2e-type="request-workflows" :class="{'readOnly': workflowContactView, 'blur-loading-row': isLoading }">
    <workflow-buttons
      v-if="!workflowContactView"
      :can-edit-all="canEditAll"
      :can-delete="!hasUndeletableSelectedWorkflows"
      :is-workflow-in-edit-mode="isWorkflowInEditMode"
      :all-workflows-selected="allWorkflowsSelected"
      :is-valid-request="isValidRequest"
      :is-cat-import-running="isCatImportRunning"
      :is-request-completed="isRequestCompleted"
      :is-request-delivered="isRequestDelivered"
      :is-portal-cat="isPortalCat"
      :company-id="companyId"
      @workflow-add="onWorkflowAdd(-1)"
      @workflow-copy="onWorkflowCopy"
      @workflow-delete="onWorkflowDelete(-1)"
      @workflow-paste="onWorkflowPaste"
      @workflow-select-all="onWorkflowSelectAll"
      @workflow-provider-task-toggle-sections="onWorkflowProviderTaskSectionToggle" />
    <workflow-templates-section
      :request="request"
      :selected-workflows="workflowsSelected"
      :is-workflow-in-edit-mode="isWorkflowInEditMode"
      :on-request-update="onRequestRefresh"
      :has-request-changed="hasRequestChanged"
      @save-request="() => onRequestSave(true)"
      @reset-request="resetRequest"
      @expand-workflows="expandWorkflows"/>
    <div>
      <import-analysis-modal
        :id="request._id"
        :is-visible="isAnalysisModalVisible"
        :request="request"
        :request-analysis="requestAnalysis"
        :parse-func="parseFunc"
        @on-analysis-modal-hidden="isAnalysisModalVisible = false"
      />
      <div
        v-for="(workflow, index) in workflows"
        :key="workflow._id || index"
        class="row pb-3"
        :class="{'workflow-detail': !workflowContactView}">
        <workflow-detail-contact-view
          v-if="workflowContactView"
          :workflow-index="index"
          :is-collapsed="workflowsCollapsedState[index]"
          :request="request"
          :workflow="workflow"
          :abilities="abilities"
          :company="requestCompany"
          @workflow-collapsed="onCollapseChange(index, $event)"
          >
        </workflow-detail-contact-view>
        <workflow-detail
          v-else-if="index === editedWorkflowIndex"
          :value="workflow"
          :abilities="abilities"
          :breakdowns="breakdowns"
          :translationUnits="translationUnits"
          :is-foreign-currency-request="isForeignCurrencyRequest"
          :company="requestCompany"
          :exchange-rate="request.exchangeRate"
          :original-request="originalRequest"
          :is-collapsed="workflowsCollapsedState[index]"
          :workflow-selected="workflowsSelected.indexOf(index) !== -1"
          :request-source-language-list="requestSourceLanguageList"
          :request-target-language-list="requestTargetLanguageList"
          :request-delivery-date="utcRequestDeliveryDate"
          :scheduling-company="schedulingCompany"
          :read-date="request.readDate"
          :request-id="request._id"
          :request="request"
          :company-rates="companyRates"
          :toggled-sections="toggledSections"
          :workflow-task-files-modal-state="workflowTaskFilesModalState"
          :is-portal-cat="isPortalCat"
          :pc-errors="pcErrors"
          :workflow-index="index"
          :is-user-ip-allowed="isUserIpAllowed"
          @on-workflow-tasks-load="onWorkflowTasksLoad(index, $event)"
          @workflow-move="onWorkflowMove(index, $event)"
          @workflow-selected="onWorkflowSelected(index, $event)"
          @input="onWorkflowUpdate(index, $event)"
          @users-loading="onUsersLoading"
          @basic-cat-tool="onBasicCatTool"
          @workflow-create="onWorkflowCreate(index)"
          @workflow-save="onWorkflowSave(index)"
          @workflow-cancel="onWorkflowCancel(index, $event)"
          @workflow-edit="onWorkflowEdit(index, $event)"
          @workflow-collapsed="onCollapseChange(index, $event)"
          @workflow-delete="onWorkflowDelete(index)"
          @workflow-add="onWorkflowAdd(index)"
          @workflow-changed="onWorkflowChange"
          @workflow-file-show="onWorkflowFileShow(index, $event)"
          @workflow-note-edit="onWorkflowNoteEdit(index, $event)"
          @show-confirm-dialog="onConfirmDialogShow"
          @show-analysis-modal="onShowAnalysisModal"
          @workflow-assign-trigger-modal="onWorkflowAssignTriggerModal($event)"
          @workflow-linguistic-task-provider-selected="onWorkflowLinguisticTaskProviderSelected($event)"
          @workflow-reflow-trigger-modal="onWorkflowReflowTriggerModal($event)">
        </workflow-detail>
        <workflow-detail-read-only
          v-else
          :workflow="workflow"
          :is-foreign-currency-request="isForeignCurrencyRequest"
          :is-reqeust-completd="isRequestCompleted"
          :is-request-delevered="isRequestDelivered"
          :is-valid-request="isValidRequest"
          :is-request-without-workflows-valid="isRequestWithoutWorkflowsValid"
          :is-valid-workflow-list="isValid"
          :is-valid="validState[index]"
          :original-request="originalRequest"
          :request="request"
          :is-collapsed="workflowsCollapsedState[index]"
          :workflow-selected="workflowsSelected.indexOf(index) !== -1"
          :request-id="request._id"
          :is-workflow-in-edit-mode="isWorkflowInEditMode"
          :toggled-sections="toggledSections"
          :is-portal-cat="isPortalCat"
          :is-cat-import-running="isCatImportRunning"
          :is-user-ip-allowed="isUserIpAllowed"
          :pc-errors="pcErrors"
          @workflow-edit="onWorkflowEdit(index, $event)"
          @workflow-move="onWorkflowMove(index, $event)"
          @workflow-collapsed="onCollapseChange(index, $event)"
          @workflow-add="onWorkflowAdd(index)"
          @workflow-selected="onWorkflowSelected(index, $event)">
        </workflow-detail-read-only>
      </div>
    </div>
    <div v-if="canShowAddWorkflowButton" class="row pl-3">
      <button
          title="Add Workflow"
          :disabled="!canAddWorkflow"
          :class="{'pts-not-allowed': !canAddWorkflow}"
          data-e2e-type="workflow-add-button-from-list"
          @click.prevent="onWorkflowAdd(-1)"
      >Workflow <i class="fas fa-plus"></i></button>
    </div>
    <div class="row mt-2 workflow-detail workflow-detail-grand-total" v-if="isGrandTotalsVisible">
      <div class="col-12 workflow-main-container">
        <div class="row pb-0 flex-nowrap header mb-2">
          <div
            class="col-2 pl-3 workflow-language-container workflow-container">
            <div class="row">
              <div class="col-12 font-weight-bold">Grand total</div>
              <div
                class="col-12 mt-2 font-weight-bold"
                data-e2e-type="request-exchange-rate">
                Foreign Amount (Exchange Rate={{
                  request.exchangeRate.toFixed(5)
                }})
              </div>
            </div>
          </div>
          <div class="col-10 pl-2">
            <div class="row flex-nowrap">
              <div class="col-2 task-ability-container"></div>
              <div class="col-10">
                <div class="row pl-0 flex-nowrap">
                  <div
                    class="col-6 header-container invoice-container pr-2"
                    v-show="toggledSections.invoiceVisible">
                    <div class="row flex-nowrap font-weight-bold">
                      <div class="col-12 text-right">
                        <span
                          class="d-block"
                          data-e2e-type="request-grand-total">{{ localCurrency.isoCode }}
                          {{ request.invoiceTotal | toCurrency }}</span>
                        <span
                          class="d-block mt-2"
                          data-e2e-type="request-foreign-grand-total">{{ quoteCurrency }}
                          {{ request.foreignInvoiceTotal | toCurrency }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    class="col-6 header-container projected-cost-container pr-2"
                    v-show="toggledSections.projectedCostVisible">
                    <div class="row flex-nowrap">
                      <div class="col-12 text-right font-weight-bold">
                        <span class="d-block">{{ localCurrency.isoCode }}
                          {{ request.projectedCostTotal | toCurrency }}</span>
                        <span class="d-block mt-2">{{ quoteCurrency }}
                          {{
                            request.foreignProjectedCostTotal | toCurrency
                          }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    class="col-6 header-container pr-2"
                    v-if="toggledSections.billVisible">
                    <div class="bill-container text-right">
                      <div class="row flex-nowrap font-weight-bold">
                        <div class="col-10 provider-task-bill-container">
                          <span
                            class="d-block"
                            data-e2e-type="request-bill-total">
                            {{ localCurrency.isoCode }}
                            {{ request.billTotal | toCurrency }}
                          </span>
                          <span class="d-block mt-2">{{ quoteCurrency }}
                            {{ request.foreignBillTotal | toCurrency }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="workflowContactView && canReadAllQuote && canReadFinancialFields && notDeletedWorkflows.length > 0" class="row pl-xl-0 pr-xl-0 pt-2 pb-3 workflow-detail">
      <div class="col-12">
        <div class="row pts-font-bold pb- header">
          <div class="col-lg-2 col-xxl-2 col-sm-2">
            <div class="row">
              <div class="col-12 font-weight-bold">Grand total</div>
            </div>
          </div>
          <div class="col-11">
            <div class="row flex-nowrap header-detail">
              <div class="col-1"></div>
              <div class="col-1"></div>
              <div class="col-1"></div>
              <div class="col-12">
                <div class="row flex-nowrap">
                  <div class="col-1"></div>
                  <div class="col-11">
                    <div class="row flex-nowrap">
                      <div class="col-1"></div>
                      <div class="col-1"></div>
                      <div class="col-1"></div>
                      <div class="col-1"></div>
                      <div class="col-1"></div>
                      <div class="col-1"></div>
                      <div class="col-1 pl-3">
                        <span data-e2e-type="workflow-grand-invoice-total">{{ localCurrency.isoCode }}
                          {{ request.invoiceTotal | toCurrency }}</span>
                      </div>
                      <div class="col-1">{{ localCurrency.isoCode }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <workflow-files-download v-model="downloadingDocs" />
    <workflow-files-modal
      v-model="workflowFiles"
      :request="request"
      :is-valid-request="isValidRequest"
      :downloading-docs="downloadingDocs"
      @workflow-task-files-modal-state="onWorkflowTaskFilesModalStateChange"
      @document-upload="onDocumentUpload"
      @request-refresh="onRequestRefresh"
      @request-save="onRequestSave" />
    <workflow-notes-modal v-model="workflowNote" @workflow-note-updated="onWorkflowNoteUpdate"/>
    <workflow-assign-modal
      :request="request"
      :segments-modal-data="segmentsModalData"
      :workflow-imported-files="workflowImportedFiles"
      @save-request="saveRequest"
      @close-modal="onWorkflowAssignTriggerModal(null)"/>
    <workflow-assign-segments-evenly-modal
      :request="request"
      :assignSegmentsEvenlyModalData="assignSegmentsEvenlyModalData"
      :workflow-imported-files="workflowImportedFiles"
      @save-workflow="onWorkflowSave"
      @close-modal="assignSegmentsEvenlyModalData = null"/>
    <workflow-reflow-modal
      :modal-data="workflowReflowModalData" />
    <confirm-dialog
      data-e2e-type="workflow-list-confirm-dialog"
      :cancelText="confirmDialogCancelText"
      :confirmationMessage="confirmDialogMessage"
      :confirmationTitle="confirmDialogTitle"
      container-class="medium-dialog"
      @confirm="onDialogConfirm"
      @cancel="onDialogConfirm"
      ref="confirmDialog" />
  </div>
</template>

<style lang="scss" scoped src="./workflow-list.scss"></style>

<script src="./workflow-list.js"></script>
