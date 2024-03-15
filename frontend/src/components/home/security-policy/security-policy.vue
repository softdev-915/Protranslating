<template>
  <div class="row pb-3 security-policy-container mt-3" data-e2e-type="security-policy">
    <div class="col-12 text-danger ml-1 mb-3" v-if="!isValid && isOverwritten">
      <i class="fas fa-exclamation-triangle"></i>
      Please complete all required fields
    </div>
    <div class="col-12 pl-0">
      <div class="row">
        <div class="col-12">
          <h6>Password</h6>
        </div>
        <div class="col-12 field col-md-4" :class="{ 'has-danger': errors.has('passwordExpiration') }">
          <label for="userPasswordExpires">User password expires (in days)
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control"
            :disabled="isDisabled"
            data-e2e-type="password-expiration-days"
            id="userPasswordExpires"
            min="0"
            name="passwordExpiration"
            type="number"
            v-model.number="securityPolicy.passwordExpirationDays"
            v-validate="'required|regex:^[1-9]+'">
        </div>
        <div class="col-12 field col-md-4" :class="{ 'has-danger': errors.has('passwordHistory') }">
          <label for="enforcePasswordHistory">Enforce password history (num.passwords remembered)
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control"
            :disabled="isDisabled"
            data-e2e-type="password-history"
            id="enforcePasswordHistory"
            min="1"
            type="number"
            name="passwordHistory"
            v-model.number="securityPolicy.numberOfPasswordsToKeep"
            v-validate="'required|regex:^[1-9]+'">
        </div>
        <div class="col-12 field col-md-4" :class="{ 'has-danger': errors.has('minPasswordLength') }">
          <label for="minimumPasswordLength">Minimum password length
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control"
            :disabled="isDisabled || isApiUser"
            data-e2e-type="min-password-length"
            id="minimumPasswordLength"
            min="1"
            name="minPasswordLength"
            type="number"
            v-model.number="securityPolicy.minPasswordLength"
            v-validate="'required|regex:^[1-9]+'">
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12 password-complexity">
          <label>Password complexity
            <span class="pts-required-field">*</span>
          </label>
          <div class="d-table w-100" v-if="securityPolicy.passwordComplexity">
            <div class="d-table-cell mr-2">
              <label for="lowerCaseLetters">
                <input
                  data-e2e-type="lower-case-letters"
                  :disabled="isDisabled"
                  id="lowerCaseLetters"
                  name="passwordComplexity"
                  type="checkbox"
                  v-model="securityPolicy.passwordComplexity.lowerCaseLetters">
                <span>Lower case letters</span>
              </label>
            </div>
            <div class="d-table-cell mr-2">
              <label for="upperCaseLetters">
                <input
                  data-e2e-type="upper-case-letters"
                  :disabled="isDisabled"
                  id="upperCaseLetters"
                  name="passwordComplexity"
                  type="checkbox"
                  v-model="securityPolicy.passwordComplexity.upperCaseLetters">
                <span>Upper case letters</span>
              </label>
            </div>
            <div class="d-table-cell mr-2">
              <label for="special-characters">
                <input
                  data-e2e-type="special-characters"
                  :disabled="isDisabled"
                  id="specialCharacters"
                  name="passwordComplexity"
                  type="checkbox"
                  v-model="securityPolicy.passwordComplexity.specialCharacters">
                <span>Special characters</span>
              </label>
            </div>
            <div class="d-table-cell">
              <label>
                <input
                  data-e2e-type="digits"
                  :disabled="isDisabled"
                  id="hasDigitsIncluded"
                  name="passwordComplexity"
                  type="checkbox"
                  v-model="securityPolicy.passwordComplexity.hasDigitsIncluded">
                <span>Digits</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-12 mt-3">
          <h6>Login Attempts</h6>
        </div>
        <div class="col-12 col-md-4" :class="{ 'has-danger': errors.has('maxInvalidLoginAttempts') }">
          <label for="maximumInvalidLoginAttempts">
            Maximum invalid login attempts
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control"
            :disabled="isDisabled"
            data-e2e-type="max-invalid-login-attempts"
            id="maximumInvalidLoginAttempts"
            min="1"
            name="maxInvalidLoginAttempts"
            type="number"
            v-model.number="securityPolicy.maxInvalidLoginAttempts"
            v-validate="'required|regex:^[1-9]+'">
        </div>
        <div class="col-12 col-md-4 col-xl-4" :class="{ 'has-danger': errors.has('lockEffectivePeriod') }">
          <label for="lockEffectivePeriod">
            Lock effective period (in minutes)
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control"
            :disabled="isDisabled"
            data-e2e-type="lock-effective-period"
            id="lockEffectivePeriod"
            min="1"
            name="lockEffectivePeriod"
            type="number"
            v-model.number="securityPolicy.lockEffectivePeriod"
            v-validate="'required|regex:^[1-9]+'">
        </div>
        <div class="col-12 col-md-4" :class="{ 'has-danger': errors.has('timeoutInactivity') }">
          <label for="timeoutInactivity">
            Timeout should occur based on Inactivity (in minutes)
            <span class="pts-required-field">*</span>
          </label>
          <input
            class="form-control is-valid"
            :disabled="isDisabled"
            data-e2e-type="timeout-inactivity"
            id="timeoutInactivity"
            min="0.1"
            name="timeoutInactivity"
            type="number"
            v-model.number="securityPolicy.timeoutInactivity"
            v-validate="{required: true }">
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./security-policy.js"></script>
<style lang="scss" scoped="" src="./security-policy.scss"></style>