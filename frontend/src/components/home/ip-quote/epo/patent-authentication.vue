<template>
  <ip-card-section>
    <h4 class="body__header" data-e2e-type="ip-wizard-body-header">Patent Authentication</h4>
    <p class="body__text" data-e2e-type="ip-wizard-body-text">
      The system will put the details of your patent from the EP Application of Publication number entered
    </p>
    <ip-input
      style="width: 500px; margin-top: 24px"
      placeholder="EP Application/Publication Number"
      data-e2e-type="publication-number"
      v-model="patentNumber"
    />
    <p class="body__tip" data-e2e-type="patent-number-example">e.g. 12345678.9 application no. or EP1234567 publication no.</p>
  </ip-card-section>
</template>

<script src="./patent-authentication.js"> </script>