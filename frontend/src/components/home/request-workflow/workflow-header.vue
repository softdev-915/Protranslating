<template>
  <div
    class="row pts-font-bold pb-0 header"
    :class="{ disabled: collapsed && this.showCollapseIcon }">
    <div class="col-2 workflow-language-container">
      <div class="row">
        <div class="col-12" data-e2e-type="workflow-title">Workflow
          <a v-if="showCollapseIcon" @click="toggleCollapse" data-e2e-type="workflow-expand-button" title="Expand/Collapse tasks">
            <i class="pts-clickable fas" :class="taskToggleIconClass" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>
    <div
      class="col-10"
      v-show="!collapsed || !this.showCollapseIcon"
      v-if="!readOnlyWorkflow">
      <div class="row flex-nowrap">
        <div class="col-2 task-ability-container" data-e2e-type="task-title">Task</div>
        <div class="col-10">
          <div class="row pl-0 flex-nowrap">
            <div
              class="col-6 header-container invoice-container"
              data-e2e-type="invoice-header"
              v-show="toggledSections.invoiceVisible && canReadInvoiceSection">
              <div>
                <div class="row flex-nowrap">
                  <div class="col-12 text-center">Invoice</div>
                </div>
                <div class="row flex-nowrap task-invoice">
                  <div class="col-1"></div>
                  <div class="col-1">Show</div>
                  <div class="col-3">Breakdown</div>
                  <div class="col-3">Units/Quantity</div>
                  <div class="col-3">Rate <div v-if="isForeignCurrencyRequest">({{localCurrency.isoCode}}/{{foreignCurrency}})</div></div>
                  <div class="col-1 pl-0">Amount</div>
                </div>
              </div>
            </div>
            <div
              class="col-6 header-container projected-cost-container"
              data-e2e-type="projected-cost-header"
              v-if="
                canReadProjectedCost && toggledSections.projectedCostVisible
              ">
              <div class="row flex-nowrap">
                <div class="col-12 text-center">Projected cost</div>
              </div>
              <div class="row pl-0 flex-nowrap">
                <div class="col-3">Breakdown</div>
                <div class="col-3">Units/Quantity</div>
                <div class="col-3">Rate</div>
                <div class="col-3">Amount</div>
              </div>
            </div>
            <div class="col-6 header-container">
              <div class="bill-container" data-e2e-type="provider-container">
                <div class="row flex-nowrap">
                  <div class="col-6 workflow-provider-tool-container">
                    <div class="row flex-nowrap workflow-provider-task p-0">
                      <div class="col-10 workflow-provider-container pl-1" data-e2e-type="provider-task-provider-title">Provider</div>
                      <div class="col-2 pl-1" data-e2e-type="provider-task-tools-title">Tools</div>
                    </div>
                  </div>
                  <div
                    class="col-12 provider-task-bill-container"
                    data-e2e-type="bill-header"
                    v-if="toggledSections.billVisible && canReadBillSection">
                    <div>
                      <div class="row flex-nowrap">
                        <div class="col-12 text-center" data-e2e-type="bill-title">Bill</div>
                      </div>
                      <div class="row flex-nowrap" data-e2e-type="bill-columns">
                        <div class="col-3">Breakdown</div>
                        <div class="col-3">Units/Quantity</div>
                        <div class="col-3">Rate</div>
                        <div class="col-3">Amount</div>
                        <div class="col-1"></div>
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
</template>

<style lang="scss" src="./workflow-header.scss"></style>

<script src="./workflow-header.js"></script>
