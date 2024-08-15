<template>
  <div>
    <input type="text" id="payment-gateway-secret" data-e2e-type="lsp-payment-gateway-secret" @input="setValue" :value="maskedValue" class="form-control" @focus="retrievePlainValue" @blur="resetMaskedValue">
  </div>
</template>

<script src="./masked-payment-gateway-secret-input.js"></script>