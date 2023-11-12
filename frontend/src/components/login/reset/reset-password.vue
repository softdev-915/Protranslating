<template>
  <div class="row justify-content-center pts-login-main" :class="{'blur-loading': recaptchaLoading || submitting }">
    <div class="main-content">
      <div class="logo-container mb-5 col-auto">
        <router-link
          data-e2e-type="forgot-password-cancel-button"
          :to="{name:'home'}"
          :disabled="submitting">
          <div class="main-logo">
            <img src="@/assets/images/main-logo.png" alt="isi">
          </div>
        </router-link>
        <div class="sub-logo">
          <img src="@/assets/images/bigip-logo-inline.png" alt="isi">
        </div>
      </div>
      <div class="col-12 text-center" :class="{'blur-loading': recaptchaLoading }">
        <h2 class="mt-1 pts-uppercase"> Reset your password</h2>
      </div>
      <div class="col-12 mb-3 text-center legal-container mt-3" v-show="!recaptchaLoading && !submitting">
        <span>By clicking Ok I am agreeing with Big Language Solution's <a data-e2e-type="reset-tc-link" rel="noopener noreferrer" href="https://biglanguage.com/privacy/" target="_blank">Terms &amp; Conditions</a> and <a data-e2e-type="reset-pp-link" rel="noopener noreferrer" href="https://biglanguage.com/privacy/" target="_blank">Privacy Policy</a></span>
      </div>
      <div class="col-lg-5 col-md-6 mt-3 center" :class="{'blur-loading': recaptchaLoading }">
        <confirm-password
          :field-class="'main-input'"
          v-model="passwords">
        </confirm-password>
      </div>
      <div class="col-12 text-center" v-if="captchaVisible">
        <re-captcha ref="reCaptcha"
          @re-captcha-validation="onRecaptchaValidation"
          @re-captcha-loading="onRecaptchaLoading">
        </re-captcha>
      </div>
      <div class="col-lg-3 col-sm-4 center pb-3" :class="{'blur-loading': recaptchaLoading }">
        <button
          @click="submit"
          type="submit"
          class="main-button"
          :disabled="submitDisabled"
          aria-label="Ok"
          role="button"
          v-show="this.code && !submitting"
          data-e2e-type="reset-password-submit-button">OK</button>
        <div class='uil-ring-css' style='transform:scale(0.22);' v-show="submitting"><div></div></div>
        <span v-show="!this.code">
          No reset code
        </span>
      </div>
    </div>
    <login-footer />
  </div>
</template>

<script src="./reset-password.js"></script>

<style lang="scss" src="./reset-password.scss"></style>
