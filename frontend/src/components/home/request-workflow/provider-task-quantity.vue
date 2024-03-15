<template>
  <div class="row provider-task-quantity">
    <div class="col-12 p-0">
      <input
        placeholder="Quantity"
        type="number"
        v-model="quantity.amount"
        v-if="canEditTask"
        :disabled="!canEditQuantity"
        class="form-control form-control-sm quantity-input"
        data-e2e-type="workflow-provider-task-quantity" />
      <template v-else>{{quantity.amount}}</template>
    </div>
    <div
      class="provider-task-unit col-12"
      data-e2e-type="workflow-provider-task-unit">
      <div class="row p-0 justify-content-center" v-if="canEditTask">
        <div class="col-12">
          <simple-basic-select
            placeholder="Unit"
            v-if="canEditTask"
            v-model="quantity.amount"
            class="form-control non-focusable"
            :disabled="!canEditQuantity"
            :options="unitList"/>
          <div class="row button-group action-buttons justify-content-center mt-1">
            <button @click.prevent="addUnit" class="fas fa-plus"></button>
            <button @click.prevent="deleteUnit" class="fas fa-close"></button>
          </div>
        </div>
      </div>
      <template v-else>
        {{quantity.units}}
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./provider-task-quantity.scss"></style>

<script src="./provider-task-quantity.js"></script>
