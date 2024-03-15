<template>
  <div class="not-calculated">
    <img src="@/assets/images/big-ip-not-calculated.png" />
    <div class="header">
      <h3 data-e2e-type="not-calculated-title">{{ titleText }}</h3>
      <p data-e2e-type="not-calculated-request-number-text">
        (Your Request Number is: <a @click="navigateRequestEdition" data-e2e-type="request-number">{{ requestNumber }}</a>)
      </p>
    </div>
    <div class="description" data-e2e-type="not-calculated-description">
      <p>
        {{ messageText }}
      </p>
    </div>
    <div class="btn mt-3" @click="close">Close</div>
  </div>
</template>

<script src="./nodb-not-calculated.js"></script>
<style lang="scss" scoped src="./nodb-not-calculated.scss"></style>
