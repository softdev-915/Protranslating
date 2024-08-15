<template>
  <div>
    <template v-if="isEditEnabled">
      <div :class="{ 'has-danger': hasPaymentValueError }">
        <currency-input
          class="form-control"
          v-model="paymentValue"
          :precision="2"
          :currency="null"
          data-e2e-type="ap-payment-value"/>
        <span v-show="hasPaymentValueError" class="form-control-feedback">
          {{ error.paymentValue }}
        </span>
      </div>
      <button type="button" @click="save()" :disabled="!isValid" data-e2e-type="ap-payment-apply-button"><i class="fas fa-check"/></button>
      <button type="button" @click="cancel()" data-e2e-type="ap-payment-cancel-button"><i class="fas fa-times"/></button>
    </template>
    <template v-else-if="maxValue > 0">
      <span>{{ paymentValue | currency('$', 2) }}</span>
      <button v-show="isSelected" type="button" @click="onEdit()" data-e2e-type="ap-payment-edit-button"><i class="fas fa-pencil"/></button>
    </template>
  </div>
</template>

<script src="./ap-payment-value-edit.js"></script>
