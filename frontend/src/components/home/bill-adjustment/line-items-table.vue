<template>
  <div class="mx-3 w-100">
    <div class="d-flex justify-content-between">
      <h6 class="font-weight-bold section-header">Entries</h6>
      <button class="btn btn-primary mb-2"
        data-e2e-type="entries-button"
        v-if="!disabled"
        @click="addEntry">
        Add entry
      </button>
    </div>
    <div class="table-container">
      <table class="table-sm table pts-data-table table-stacked table-hover table-striped table-bordered scroll"
      data-e2e-type="entries-table">
        <thead class="hidden-sm-down">
          <tr>
            <th v-for="(c, i) in tableColumns" :key="i">{{c}}</th>
          </tr>
        </thead>
        <tbody :class="hasScroll">
            <tr v-for="(lineItem, index) in lineItems" :key="index">
              <td v-if="canReadGlAccount">
                <div v-if="changingGlAccountNoFieldIndex === index" class="input-group input-group-sm my-3">
                  <simple-basic-select
                    class="col-md-4"
                    data-e2e-type="entry-gl-account-number"
                    v-model="newGlAccountNo"
                    :options="glAccounts"
                    :format-option="formatGlAccountOption"
                    placeholder="Choose GL Account" />
                  <div class="input-group-append ml-2">
                    <button class="btn btn-outline-primary" type="button" @click="onGlAccountNoSave">Save</button>
                  </div>
                </div>
                <div v-else>
                  <span v-if="lineItem.glAccountNo">{{ lineItem.glAccountNo.number }}</span>
                  <i
                    v-if="canEditLineItemList[index]"
                    class="fas fa-pencil pts-clickable mx-3"
                    aria-hidden="true"
                    @click="editGlAccountNo(index)"
                  ></i>
                </div>
              </td>
              <td v-if="canReadDepartmentId">
                <div v-if="changingDepartmentFieldIndex === index" class="row my-3">
                  <div class="col-9">
                    <simple-basic-select
                      data-e2e-type="entry-internal-department"
                      v-model="newDepartment"
                      :options="internalDepartments"
                      :format-option="formatDepartmentOption"
                      placeholder="Choose Internal Department" />
                  </div>
                  <div class="col-3">
                    <button class="btn btn-outline-primary"
                            type="button"
                            @click="onDepartmentSave"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div v-else>
                  <span v-if="lineItem.departmentId">{{ lineItem.departmentId.accountingDepartmentId }}</span>
                  <i
                    v-if="canEditLineItemList[index]"
                    class="fas fa-pencil pts-clickable mx-3"
                    aria-hidden="true"
                    @click="editDepartment(index)"
                  ></i>
                </div>
              </td>
              <td>
                <div v-if="changingAmountFieldIndex === index" class="input-group input-group-sm my-3">
                  <currency-input
                    data-e2e-type="entry-amount"
                    class="form-control"
                    v-model="newAmount"
                    :valueRange="{ min: 0 }"
                    :precision="2"
                    :currency="null" />
                  <div class="input-group-append">
                    <button class="btn btn-outline-primary" type="button" @click="onAmountSave">Save</button>
                  </div>
                </div>
                <div v-else>
                  <span>{{ `$${lineItem.amount.toFixed(2)}` }}</span>
                  <i
                    v-if="canEditLineItemList[index]"
                    class="fas fa-pencil pts-clickable mx-3"
                    aria-hidden="true"
                    @click="editAmount(index)"
                  ></i>
                </div>
              </td>
              <td>
                <div v-if="changingMemoFieldIndex === index" class="input-group input-group-sm my-3">
                  <input
                    data-e2e-type="entry-memo"
                    type="text" class="form-control"
                    placeholder="Write memo"
                    v-model="newMemo">
                  <div class="input-group-append">
                    <button class="btn btn-outline-primary" type="button" @click="onMemoSave">Save</button>
                  </div>
                </div>
                <div v-else>
                  <span>{{lineItem.memo}}</span>
                  <i
                    v-if="canEditLineItemList[index]"
                    class="fas fa-pencil pts-clickable mx-3"
                    aria-hidden="true"
                    @click="editMemo(index)"
                  ></i>
                </div>
              </td>
              <td v-if="!disabled">
                <i
                  class="pts-clickable fa-solid fa-trash fa-trash-o delete-icon"
                  data-e2e-type="delete-entry-icon"
                  @click="removeEntry(index)" />
              </td>
            </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./line-items-table.js"></script>
<style scoped>
.section-header{
  font-size: 18px;
  font-weight: 400;
}
</style>
