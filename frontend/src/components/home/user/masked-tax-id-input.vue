<template>
  <div>
    <input type="text" data-e2e-type="taxId" :value="maskedValue" @input="setValue" :class="className" @focus="retrievePlainValue" @blur="resetMaskedValue" v-if="!readOnly">
    <span v-else>{{maskedValue}}</span>
  </div>
</template>

<script src="./masked-tax-id-input.js"></script>
