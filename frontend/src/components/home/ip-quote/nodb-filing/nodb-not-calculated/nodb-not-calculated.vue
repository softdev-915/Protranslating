<template>
  <div class="not-calculated">
    <img src="@/assets/images/big-ip-not-calculated.png" />
    <div class="header">
      <h3>You are almost there!</h3>
      <p>(Your Request Number is: <a @click="navigateRequestEdition" data-e2e-type="request-number">{{ requestNumber }}</a>)</p>
    </div>
    <div class="description">
      <p>
        Since the patent was published in {{ sourceLanguage }}, our team will
        prepare your <br />
        customized quote for the following countries ({{ quotedCountries }})
      </p>
    </div>
    <div class="btn mt-3" @click="close">Close</div>
  </div>
</template>

<script src="./nodb-not-calculated.js"></script>
<style lang="scss" scoped src="./nodb-not-calculated.scss"></style>
