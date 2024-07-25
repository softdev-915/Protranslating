<template>
  <div class="col-12">
    <div class="row p-0">
      <div class="col-12 form-group" data-e2e-type="new-password-container">
        <div>
          <input
            v-if="isPasswordVisible"
            type="text"
            required
            autocomplete="off"
            v-model="newPassword"
            name="newPassword"  
            id="newPassword"
            placeholder="New password"
            :class="fieldClass"
            class="form-control new-password-bkg"
            @keypress="dirtyForm = true">
          <input
            v-else
            :class="fieldClass"
            required
            v-model="newPassword"
            placeholder="New password"
            type="password"
            name="newPassword"
            autocomplete="off"
            id="newPassword"
            class="form-control new-password-bkg"
            @keypress="dirtyForm = true">
            <i class="pts-clickable fas show-password"
              :class="{'fa-eye': !isPasswordVisible, 'fa-eye-slash': isPasswordVisible}"
              aria-hidden="true" @click="isPasswordVisible = !isPasswordVisible">
            </i>
        </div>
        <div class="not-typed-text" v-show="showEmptyNewPassword">
          <span class="text-danger" id="newPassEmpty">
            <i class="fas fa-exclamation-triangle"></i> You did not type a new password
          </span>
        </div>
        <div class="not-typed-text" v-show="showSamePassword && !showEmptyNewPassword">
          <span class="text-danger">
            <i class="fas fa-exclamation-triangle"></i> The new password cannot be the same
          </span>
        </div>
        <div class="not-typed-text" v-show="!isValidNewPassword && passwordErrorMessage">
          <span class="text-danger">
            <i class="fas fa-exclamation-triangle"></i> {{ passwordErrorMessage }}
          </span>
        </div>
      </div>
      <div class="col-12 form-group" data-e2e-type="confirm-password-container">
        <div>
          <input
          v-if="isPasswordVisible"
          type="text"
          :disabled="newPassword === ''"
          :class="fieldClass"
          required
          v-model="repeatPassword"
          name="repeatPassword"
          autocomplete="off"
          id="repeatPassword"
          placeholder="Confirm New password"
          class="form-control new-password-bkg"
          @keypress="dirtyForm = true">
          <input
            v-else
            :disabled="newPassword === ''"
            :class="fieldClass"
            required
            v-model="repeatPassword"
            autocomplete="off"
            placeholder="Confirm New password"
            type="password"
            name="repeatPassword"
            id="repeatPassword"
            class="form-control new-password-bkg"
            @keypress="dirtyForm = true">
          <i class="pts-clickable fas show-password"
            :class="{'fa-eye': !isPasswordVisible, 'fa-eye-slash': isPasswordVisible}"
            aria-hidden="true" @click="isPasswordVisible = !isPasswordVisible">
          </i>
        </div>
        <div class="invalid-text" v-show="showInvalidRepeatPassword && !showEmptyRepeatPassword && !showEmptyNewPassword">
          <span class="text-danger">
            <i class="fas fa-exclamation-triangle"></i> Invalid confirm password
          </span>
        </div>
        <div class="not-typed-text" v-show="showEmptyRepeatPassword && !showEmptyNewPassword">
          <span class="text-danger" id="confPassEmpty">
            <i class="fas fa-exclamation-triangle"></i> You did not retype your new password
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./confirm-password.js"></script>

<style scoped src="./confirm-password.scss" lang="scss"></style>
