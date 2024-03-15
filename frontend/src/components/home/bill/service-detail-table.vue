<template>
  <div class="w-100">
    <div class="text-primary ml-1 mb-2">Service Details</div>
    <div class="table-container">
      <table class="table-sm table pts-data-table table-stacked table-hover table-striped table-bordered scroll">
        <thead class="hidden-sm-down">
          <tr>
            <th v-for="(c, i) in tableColumns" :key="i">{{c}}</th>
          </tr>
        </thead>
        <tbody>
            <tr v-for="(serviceDetail, index) in serviceDetails" :key="index" data-e2e-type="bill-service-detail-row">
               <td v-if="canEdit">
                <expense-account-selector
                  :format-option="formatExpenseAccountSelectOption"
                  v-model="serviceDetail.expenseAccountNo"
                  :fetch-on-created="true"
                  data-e2e-type="bill-service-detail-expense-account"/>
              </td>
              <td v-if="!canEdit && canReadAll" data-e2e-type="bill-service-detail-expense-account-readonly"> {{serviceDetail.expenseAccountNo}}</td>
              <td data-e2e-type="bill-service-detail-expense-task-amount-readonly"> {{readableAmount(serviceDetail.taskAmount)}} </td>
              <td v-if="canEdit">
                <internal-department-selector
                  :format-option="formatInternalDepartmentSelectOption"
                  v-model="serviceDetail.accountingDepartmentId"
                  :fetch-on-created="true"
                  data-e2e-type="bill-service-detail-internal-department"/>
              </td>
              <td v-else-if="!canEdit && canReadAll" data-e2e-type="bill-service-detail-accountingDeparment-readonly"> {{serviceDetail.accountingDepartmentId}} </td>
              <td data-e2e-type="bill-service-detail-task-description-readonly"> {{serviceDetail.taskDescription}} </td>
              <td data-e2e-type="bill-service-detail-recipient-readonly"> {{serviceDetail.recipient}} </td>
              <td data-e2e-type="bill-service-detail-reference-number-readonly"> {{serviceDetail.referenceNumber}} </td>
            </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./service-detail-table.js"></script>
