<template>
  <div
    data-e2e-type="forgot-password-container"
    class="row justify-content-center pts-login-main forgot-password main-content"
    :class="{'blur-loading': shouldBlur }">
    <div class="logo-container mb-5 col-auto text-center">
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
    <div class="col-12 text-center" v-show="!success">
      <h2>FORGOT PASSWORD</h2>
    </div>
    <div class="col-12 text-center center main-content">
      <div
        class="col-12 text-center success-text"
        v-show="success">
        <h2 class="mb-2">THANK YOU!</h2>
        <p class="mt-4 pt-4">An e-mail will be sent to you to complete the password reset process.</p>
      </div>
      <p
        data-e2e-type="change-password-legend"
        v-if="showForceLegend && !success">
        For your protection, you should reset your password for {{ selectedLsp.name }}
      </p>
      <div
        class="col-lg-5 col-md-9 col-sm-8 subtitle center text-center"
        v-bind:class="{ 'invisible': success }">
        <p>Enter the email address you use as your username.
        You should receive an email shortly with instructions to reset your password.</p>
      </div>
      <div class="text-center center col-lg-5 col-md-8 col-sm-8" v-show="submitting">
        <div class="offset-1 uil-ring-css" style="transform:scale(0.22);">
          <div></div>
        </div>
      </div>
      <div
        class="text-center center col-lg-5 col-md-8 col-sm-8"
        v-bind:class="{ 'invisible': success }">
        <label class="sr-only">Email</label>
        <pts-email-input
        :disabled="submitting || recaptchaLoading"
        ref="email"
        @keyup.enter="submit"
        autocomplete="off"
        elemId="userEmail"
        elemName="userEmail"
        v-model.trim="email"
        cssClass="form-control main-input"
        aria-label="Your email"
        placeholder="Your email"
        @email-validation="onEmailValidation($event)" />
      </div>
      <div
        class="text-center center col-lg-5 col-md-8 col-sm-8 mt-3"
        v-show="userLspList.length > 1"
        v-if="!success && emailValid && recaptchaValidated">
        <label for="lspSelector" class="sr-only">Lsp</label>
        <lsp-selector
          id="lspSelector"
          data-e2e-type="lsp-selector"
          autocomplete="no"
          :email="email"
          :recaptcha="recaptcha"
          @user-lsp-list-retrieve="onUserLspRetrieve"
          v-model="selectedLsp">
        </lsp-selector>
      </div>
      <div
        class="col-12 text-center captcha-container mt-3 mb-0"
        v-show="!submitting && !success"
        v-if="captchaVisible">
        <p>Please check the box below to proceed.</p>
        <re-captcha
          ref="reCaptcha"
          @re-captcha-validation="onRecaptchaValidation"
          @re-captcha-loading="onRecaptchaLoading">
        </re-captcha>
      </div>
      <div
        class="col-lg-3 col-sm-4 center mt-3 pb-3"
        :class="{'blur-loading': recaptchaLoading }"
        v-if="!success">
         <button
            type="submit"
            @click="submit"
            class="main-button"
            :disabled="submitDisabled"
            aria-label="Ok"
            role="button"
            v-show="!submitting">{{ isSSOEnabled ? 'RESET PASSWORD VIA SSO' : 'RESET PASSWORD' }}
          </button>
      </div>
    </div>
    <login-footer />
  </div>
</template>

<script src="./forgot-password.js"></script>

<style scoped lang="scss" src="./forgot-password.scss"></style>
