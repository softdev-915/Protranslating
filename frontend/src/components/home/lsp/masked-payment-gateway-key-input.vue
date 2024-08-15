<template>
  <div>
    <input type="text" id="payment-gateway-key" data-e2e-type="lsp-payment-gateway-key" @input="setValue" :value="maskedValue" class="form-control" @focus="retrievePlainValue" @blur="resetMaskedValue">
  </div>
</template>

<script src="./masked-payment-gateway-key-input.js"></script>