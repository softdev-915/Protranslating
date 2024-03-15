<template>
  <div>
    <input name="taxId" type="text" id="taxId" data-e2e-type="lsp-tax-id" @input="setValue" :value="maskedValue" class="form-control" @focus="retrievePlainValue" @blur="resetMaskedValue">
  </div>
</template>

<script src="./masked-lsp-tax-id-input.js"></script>