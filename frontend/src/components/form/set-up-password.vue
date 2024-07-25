<template>
  <div data-e2e-type="password-set-up" class="row align-items-center">
    <div class="col-2 col-xl-1" v-if="isApiUser || !isSsoEnabled">
      <label for="password">Password</label>
      <span class="pts-required-field" v-if="isMandatory">*</span>
    </div>
    <div class="col-10 col-lg-4 col-xl-5 mb-3" v-if="isApiUser || !isSsoEnabled">
      <protected-input
        class="mb-3 mt-4"
        data-e2e-type="password"
        v-model="password"
        :can-edit="canEdit"
        :placeholder="placeholder"
        name="protectedPasswordField"
      />
      <span class="text-danger" v-show="!isNewPasswordValid">
        <i class="fas fa-exclamation-triangle"></i> {{ getPasswordValidationErrorMessage }}
      </span>
      <span class="text-danger" v-show="showEmptyPassword">
        <i class="fas fa-exclamation-triangle"></i> You did not type a new password
      </span>
      <span class="text-danger" v-show="showOverwrittenSecurityPolicy">
        <i class="fas fa-exclamation-triangle"></i> Please
        check the Security Policies section before
        updating your password
      </span>
    </div>
    <div class="col-12 col-lg-6" v-if="showApiCheckbox">
      <div class="row pl-2">
        <div class="col-2 col-md-1 pl-2">Api</div>
        <div class="col-10 pl-0">
          <div class="d-inline-block">
            <input v-model="isApiUser" value="false" data-e2e-type="user-api-checkbox" type="checkbox" id="user-api-checkbox" class="pull-left mt-1 ml-2">
            <label for="user-api-checkbox" class="ml-1"> Check this is you want to set the minimum password length to 256 characters.</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./set-up-password.js"></script>
<style lang="scss" src="./set-up-password.scss"></style>
