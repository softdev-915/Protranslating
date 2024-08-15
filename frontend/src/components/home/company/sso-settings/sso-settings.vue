<template>
  <div class="row" data-e2e-type="sso-settings">
    <div class="col-12">
      <h5 class="d-inline-block mr-4">SSO Settings</h5>
      <div class="d-inline-block ml-4">
        <input
          type="checkbox"
          class="pull-left mt-1 ml-2"
          data-e2e-type="sso-settings-is-sso-enabled"
          id="use-sso-checkbox"
          v-model="ssoSettings.isSSOEnabled"
          :disabled="!canEdit"/>
        <label
          for="use-sso-checkbox"
          class="ml-1">Check this if you want to use identity provider to authenticate contacts</label>
      </div>
      <div class="d-inline-block ml-4" v-if="hasParentCompany">
        <input
          type="checkbox"
          class="pull-left mt-1 ml-2"
          data-e2e-type="sso-settings-is-sso-overwritten"
          id="sso-overridden-checkbox"
          v-model="value.areSsoSettingsOverwritten"
          :disabled="!canEdit"/>
        <label
          for="sso-settings-is-sso-overwritten-label"
          class="ml-1">Override SSO settings</label>
      </div>
      <hr class="my-1" />
    </div>
    <div class="col-12">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12 col-md-3">
            <label data-e2e-type="sso-certificate-label">
              Certificate<span class="pts-required-field">*</span>
            </label>
          </div>
          <div
            class="col-12 col-md-8"
            :class="{'has-danger': errors.has('certificate') }">
            <textarea
              placeholder="Insert certificate here without BEGIN-CERTIFICATE and END-CERTIFICATE lines"
              data-e2e-type="sso-settings-certificate"
              class="form-control"
              name="certificate"
              :disabled="!canEditSSOFields"
              v-model.trim="ssoSettings.certificate"
              v-validate="{required: ssoSettings.isSSOEnabled}"/>
            <span
              class="form-control-feedback"
              v-show="(errors.has('certificate'))">{{errors.first('certificate')}}</span>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3">
            <label data-e2e-type="sso-issuer-metadata-label">
              Issuer Metadata<span class="pts-required-field">*</span>
            </label>
          </div>
          <div
            class="col-12 col-md-8"
            :class="{'has-danger': errors.has('issuerMetadata')}">
            <input
              data-e2e-type="sso-issuer-metadata"
              type="text"
              class="form-control"
              name="issuerMetadata"
              placeholder="https://..."
              :disabled="!canEditSSOFields"
              v-model.trim="ssoSettings.issuerMetadata"
              v-validate="{required: ssoSettings.isSSOEnabled, url: true}"/>
            <span
              class="form-control-feedback"
              v-show="(errors.has('issuerMetadata'))">{{errors.first('issuerMetadata')}}</span>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3">
            <label data-e2e-type="sso-entry-point-label">
              Entry Point URL<span class="pts-required-field">*</span>
            </label>
          </div>
          <div
            class="col-12 col-md-8"
            :class="{'has-danger': errors.has('entryPoint')}">
            <input
              data-e2e-type="sso-entry-point"
              type="text"
              class="form-control"
              name="entryPoint"
              placeholder="https://..."
              :disabled="!canEditSSOFields"
              v-model.trim="ssoSettings.entryPoint"
              v-validate="{url: true, required: ssoSettings.isSSOEnabled}"/>
            <span
              class="form-control-feedback"
              v-show="errors.has('entryPoint')">{{errors.first('entryPoint')}}</span>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3">
            <label data-e2e-type="sso-entry-point-label">
              Consumer URL<span class="pts-required-field"></span>
            </label>
          </div>
          <div class="col-12 col-md-8">
            <input
              data-e2e-type="sso-consumer-url"
              type="text"
              class="form-control"
              name="consumerUrl"
              :disabled="true"
              :value="consumerUrlValue"/>
          </div>
        </div>

        <div class="row">
          <div class="col-12 col-md-3">
            <label data-e2e-type="sso-entry-point-label">
              Consumer URL Validator<span class="pts-required-field"></span>
            </label>
          </div>
          <div class="col-12 col-md-8">
            <input
              data-e2e-type="sso-consumer-url-validator"
              type="text"
              class="form-control"
              name="consumerUrlValidator"
              :disabled="true"
              :value="consumerUrlValidatorValue"/>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script src='./sso-settings.js'></script>
