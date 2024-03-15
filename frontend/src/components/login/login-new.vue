<template>
  <div
    id="login"
    data-e2e-type="login-container"
    class="row justify-content-center pts-login-main"
    :class="{'blur-loading-container': loading}">
    <div class="main-content">
      <div class="container">
        <div class="row justify-content-center">
          <div class="logo-container mb-5 col-auto">
            <div class="main-logo">
              <img src="@/assets/images/main-logo.png" alt="isi">
            </div>
            <div class="sub-logo">
              <img src="@/assets/images/bigip-logo-inline.png" alt="isi">
            </div>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="col-md-8 col-sm-12 main-form-container mb-4">
            <form novalidate @submit="submit($event)" v-if="!isPasswordAccepted">
              <div
                class="email-entered mb-2 center"
                v-show="emailEntered && !lspLoading"
                :class="{'blur-loading': submitting}">
                <span @click="reset"><i class="fas fa-arrow-left"></i></span>
                <span @click="reset" class="email-box">{{email}}</span>
              </div>
              <div
                class="lsp pb-4 center"
                v-if="lspSelectorVisible"
                v-show="userLspList.length > 1"
                :class="{'blur-loading': loading}">
                <label for="lspSelector" class="sr-only">Lsp</label>
                <lsp-selector
                  id="lspSelector"
                  data-e2e-type="lsp-selector"
                  autocomplete="no"
                  :email="email"
                  :recaptcha="recaptcha"
                  @user-lsp-list-retrieving="onUserLspRetrieving"
                  @user-lsp-list-retrieve="onUserLspRetrieve"
                  v-model="lsp">
                </lsp-selector>
              </div>
              <div class="form-group mb-3" v-show="!emailEntered">
                <label for="userEmail" class="sr-only">Email</label>
                <div class="input-group">
                  <pts-email-input
                    :autocomplete="'off'"
                    ref="email"
                    :disabled="!recaptchaValidated"
                    @keyup.enter="submit($event)"
                    elemId="userEmail"
                    elemName="userEmail"
                    v-model.trim="email"
                    cssClass="main-input form-control"
                    placeholder="Your Email"/>
                  <div class="input-group-append">
                    <button
                      type="submit"
                      class="main-button"
                      @click="submit"
                      :disabled="!isValidForm || loading"
                      aria-label="Login"
                      role="button"
                      v-show="goButtonVisible"
                      data-e2e-type="submit-email-button">
                      GO
                    </button>
                  </div>
                </div>
              </div>
              <div class="text-center password mb-3 center" v-show="showPasswordInput">
                <label for="password" class="sr-only">Password</label>
                <div class="input-group" v-if="!isSSOEnabled">
                  <input
                    type="text"
                    v-if="isPasswordVisible"
                    :disabled="loading"
                    id="password"
                    ref="password"
                    v-model="password"
                    name="password"
                    class="form-control main-input"
                    aria-label="Password"
                    placeholder="Your Password">
                  <input
                    v-else
                    :disabled="loading"
                    id="password"
                    ref="password"
                    v-model="password"
                    name="password"
                    class="form-control main-input"
                    aria-label="Password"
                    type="password"
                    placeholder="Your Password"/>
                  <div class="input-group-append">
                    <i class="pts-clickable fas show-password"
                      :class="{'fa-eye': !isPasswordVisible, 'fa-eye-slash': isPasswordVisible}"
                      aria-hidden="true" @click="isPasswordVisible = !isPasswordVisible">
                    </i>
                    <button
                      type="submit"
                      class="main-button"
                      @click="submit"
                      :disabled="!isValidForm || loading"
                      aria-label="Login"
                      role="button"
                      v-show="goButtonVisible"
                      data-e2e-type="submit-password-button">
                      GO
                    </button>
                  </div>
                </div>
                <div class="input-group" v-else>
                  <div class="input-group">
                    <input
                      :disabled="true"
                      id="password"
                      ref="password"
                      name="password"
                      class="form-control main-input"
                      aria-label="Password"
                      type="password"
                      placeholder="Proceed login via SSO">
                    <div class="input-group-append">
                      <button
                        class="main-button"
                        @click="loginViaSSO"
                        :disabled="!isValidForm || loading"
                        aria-label="Login"
                        role="button"
                        v-show="goButtonVisible"
                        data-e2e-type="sso-login-button">
                        Login via SSO
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center captcha-container mb-4" v-if="captchaVisible" :class="{'blur-loading': loading}">
                <re-captcha
                  ref="reCaptcha"
                  @re-captcha-validation="onRecaptchaValidation"
                  @re-captcha-loading="onRecaptchaLoading">
                </re-captcha>
              </div>
            </form>
            <form class="mb-5" @submit="submit" v-else>
              <div class="col-12 text-center">
                <h2>2-Step Verification</h2>
              </div>
              <div class="col-12">
                <p>Thank you for choosing to use Two-Factor Authentication.
                  This decision will make your access more secure.</p>
                <p>Enter a 6 digit authentication code generated by Google Authenticator app</p>
                <div class="row justtify-content-center align-items-center">
                  <div class="col-12 col-md-9 mb-2">
                    <input
                      id="tfa-input"
                      class="form-control"
                      placeholder="6 digit code"
                      v-model="hotp">
                  </div>
                  <div class="col-12 col-md-3 mb-2">
                    <button
                      id="tfa-submit"
                      type="submit"
                      class="main-button"
                      role="button">Verify</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="text-center center col-12" v-show="!recaptchaValidated && captchaVisible">
            <a href="#" @click.prevent="refreshPage" class="main-link">Reset captcha</a>
          </div>
          <template v-if="!emailEntered">
            <div class="col-12 text-center mb-4">
              <span class="info-text">By clicking GO I am agreeing with BIG Language Solution's
                <a data-e2e-type="login-tc-link"
                  rel="noopener noreferrer"
                  href="https://biglanguage.com/privacy/"
                  target="_blank">Terms &amp; Conditions
                </a>
                and
                <a  data-e2e-type="login-pp-link"
                    rel="noopener noreferrer"
                    href="https://biglanguage.com/privacy/" target="_blank">Privacy Policy
                </a>
              </span>
            </div>
            <div class="col-12 text-center pb-3">
              <router-link
                data-e2e-type="reset-password"
                class="main-link"
                :to="{name:'forgot-password'}">
                Reset Your Password
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </div>
    <login-footer />
  </div>
</template>

<script src="./login.js"></script>

<style scoped src="./login-new.scss" lang="scss">
</style>
