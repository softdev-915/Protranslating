<template>
  <div class="w-100">
    <div class="text-primary ml-1 mb-2">Bill Adjustments</div>
    <div class="table-container">
      <table class="table-sm table pts-data-table table-stacked table-hover table-striped table-bordered scroll">
        <thead class="hidden-sm-down">
          <tr>
            <th v-for="(c, i) in tableColumns" :key="i">{{c}}</th>
          </tr>
        </thead>
        <tbody>
            <tr v-for="(adjustment, index) in billAdjustments" :key="index">
              <td> {{adjustment.adjustmentNo}} </td>
              <td> {{adjustment.date}} </td>
              <td> {{adjustment.type}} </td>
              <td> {{adjustment.status}} </td>
              <td> {{adjustment.adjustmentBalance}} </td>
              <td> {{adjustment.adjustmentTotal}} </td>
            </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./bill-adjustment-table.js"></script>
