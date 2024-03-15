<template>
  <div class="pts-grid-edit-modal lsp-settings-inline-edit" data-e2e-type="lsp-settings-container" :class="{'blur-loading-row': httpRequesting }">
    <div slot="default">
      <div class="container-fluid">
        <form name="" novalidate="">
          <!-- Name -->
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              Name <span class="pts-required-field" data-e2e-type="lsp-name-title">*</span>
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canEdit">
              <input type="text" data-e2e-type="lsp-name" id="name" name="name" class="form-control" :class="{'form-control-danger': errors.has('name')}" v-model="lspEdit.name" v-validate="'required'">
              <div class="form-control-feedback" v-show="errors.has('name')">Name is required.</div>
            </div>
            <div class="col-12 col-md-10" v-if="readOnly">
              {{ lsp.name }}
            </div>
          </div>
          <lsp-logo-image
            :canEdit="canEdit"
            :loading="httpRequesting"
            v-model="lspEdit.logoImage"
            @lsp-logo-save="updateLogo"
            @lsp-logo-delete="deleteLogo">
          </lsp-logo-image>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
                Official name
            </div>
            <div class="col-12 col-md-10">
              <input
                class="form-control"
                data-e2e-type="lsp-official-name"
                v-model="lspEdit.officialName">
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
                LSP Description
            </div>
            <div class="col-12 col-md-10">
              <input
                class="form-control"
                data-e2e-type="lsp-description"
                v-model="lspEdit.description">
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              Email Connection <span class="pts-required-field" data-e2e-type="lsp-email-connection-string-title">*</span>
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('emailConnectionString')}">
              <protected-input
                data-e2e-type="lsp-email-connection-string"
                v-model="lspEdit.emailConnectionString"
                :can-edit="canEditEmailConnectionString"
                :can-read="canReadEmailConnectionString"
                :required="true"
                name="emailConnectionString"
              />
              <div class="form-control-feedback" v-show="errors.has('emailConnectionString')">{{errors.first('emailConnectionString')}}</div>
            </div>
          </div>
          <div class="row align-items-center checkbox-container">
            <div class="col-11 col-md-2 pl-4">Supports IP Quoting</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                class="form-control pts-clickable"
                data-e2e-type="ip-quoting-checkbox"
                v-model="lspEdit.supportsIpQuoting">
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
             <span class="pts-required-field" data-e2e-type="lsp-accounting-platform-location">*</span> Accounting Platform Location Entity
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('lspAccountingPlatformLocation')}">
              <input
                type="text"
                :disabled="!hasRole('LSP-SETTINGS-ACCT_UPDATE_OWN')"
                data-e2e-type="lsp-accounting-platform-location"
                name="lspAccountingPlatformLocation"
                class="form-control"
                v-validate="{required: true}"
                v-model="lspEdit.lspAccountingPlatformLocation">
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">Domain</div>
            <div class="col-12 col-md-10" v-if="canEdit">
              <input type="text" data-e2e-type="lsp-domain" class="form-control" v-model="lspEdit.domain">
            </div>
            <div class="col-12 col-md-10" v-if="readOnly">{{ lsp.domain }}</div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <span class="pts-required-field">*</span> Financial Entity Record Prefix
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('financialEntityPrefix')}">
              <input
                id="financialEntityPrefix"
                type="text"
                data-e2e-type="lsp-financial-entity-record-identifier"
                name="financialEntityPrefix"
                class="form-control"
                v-validate="{required: true, min: 3, max: 3}"
                v-model="lspEdit.financialEntityPrefix"
              >
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block">Payment Gateway</label>
            </div>
            <div class="col-12 col-md-10" >
              <payment-gateway-select
                data-e2e-type="lsp-payment-gateway"
                id="paymentGatewayName"
                v-model="lspEdit.paymentGateway.name"
              />
            </div>
          </div>
           <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block">Payment Gateway ID</label>
            </div>
            <div class="col-12 col-md-10">
              <input
                id="paymentGatewayId"
                name="paymentGatewayId"
                type="text"
                class="form-control"
                v-model="lspEdit.paymentGateway.id">
             </div>
          </div>
          <div class="row align-items-center checkbox-container">
            <div class="col-11 col-md-2 pl-4">Is Production</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                class="form-control pts-clickable"
                v-model="lspEdit.paymentGateway.isProduction">
            </div>
          </div>
           <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block">Payment Gateway Key</label>
            </div>
            <div class="col-12 col-md-10">
                <masked-payment-gateway-key-input
                  v-model="lspEdit.paymentGateway.key"
                  :entityId="lsp._id"
                />
             </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block">Payment Gateway Secret</label>
            </div>
            <div class="col-12 col-md-10">
              <masked-payment-gateway-secret-input
                v-model="lspEdit.paymentGateway.secret"
                :entityId="lsp._id"
              />
             </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block">Undeposited Funds Account Identifier</label>
            </div>
            <div class="col-12 col-md-10">
              <input
                id="payment-gateway-account"
                type="text"
                class="form-control"
                data-e2e-type="lsp-payment-gateway-account"
                v-model="lspEdit.paymentGateway.account">
             </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block" for="phoneNumber">
                Phone Number
              </label>
            </div>
            <div class="col-12 col-md-10">
              <input
                type="text"
                data-e2e-type="lsp-phone-number"
                id="phoneNumber"
                name="phoneNumber"
                class="form-control"
                v-model="lspEdit.phoneNumber"
              >
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block" for="url">
                URL
              </label>
            </div>
            <div class="col-12 col-md-10">
              <input
                type="text"
                data-e2e-type="lsp-url"
                id="url"
                name="url"
                class="form-control"
                v-model="lspEdit.url"
              >
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block" for="taxId">
                Tax Id
              </label>
            </div>
            <div class="col-12 col-md-10">
              <masked-lsp-tax-id-input
                v-model="lspEdit.taxId"
                :entityId="lsp._id"
              />
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4">
              <label class="d-block" for="fax">
                Fax
              </label>
            </div>
            <div class="col-12 col-md-10">
              <input
                type="text"
                data-e2e-type="lsp-fax"
                id="fax"
                name="fax"
                class="form-control"
                v-model="lspEdit.fax"
              >
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-12 mt-1">
              <h5>Revenue Recognition</h5>
              <hr class="my-1" />
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-7 col-md-2 pl-4">
              <label :class="{ required: canEditAccounting }" for="startDate">
                Start Date
              </label>
            </div>
            <div class="col-7 col-md-5">
              <utc-flatpickr
                v-if="canEditAccounting"
                id="startDate"
                class="form-control"
                data-e2e-type="rev-rec-start-date-picker"
                v-model="lspEdit.revenueRecognition.startDate"
                :config="datepickerOptions"
              />
              <input
                v-else
                class="form-control disabled"
                :value="localStartDate"
                readonly
                data-e2e-type="rev-rec-start-date-readonly"/>
            </div>
            <div class="col-5 col-md-1">
              <label :class="{ required: canEditAccounting }" for="endDate">
                End Date
              </label>
            </div>
            <div class="col-5 col-md-4">
              <utc-flatpickr
                v-if="canEditAccounting"
                id="endDate"
                class="form-control"
                data-e2e-type="rev-rec-end-date-picker"
                v-model="lspEdit.revenueRecognition.endDate"
                :config="datepickerOptions"
              />
              <input
                v-else
                class="form-control disabled"
                :value="localEndDate"
                readonly
                data-e2e-type="rev-rec-end-date-readonly"/>
            </div>
          </div>

          <div class="row align-items-center" v-if="canEdit">
            <div class="col-12 col-md-2 pl-4">
             <span class="pts-required-field" data-e2e-type="lsp-vendor-payment-period-start-date-label">*</span> Vendor Payment Period Start Date
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': !isValidVendorPaymentPeriodStartDate }">
              <utc-flatpickr
                :value="localVendorPaymentPeriodStartDate"
                :config="datepickerOptions"
                data-e2e-type="lsp-vendor-payment-period-start-date"
                name="vendorPaymentPeriodStartDate"
                @input="onVendorPaymentPeriodStartDateChange($event)"
                class="form-control"
                :class="{'form-control-danger': !isValidVendorPaymentPeriodStartDate}"/>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2 pl-4 required">
             <span class="pts-required-field" >*</span> Timezone
            </div>
            <div class="col-12 col-md-2" >
              <simple-basic-select
                data-e2e-type="lsp-timezone-selector"
                v-model="lspEdit.timezone"
                :options="timezoneOptions"
                :class="{'has-danger': !isValidTimezone }"
              />
            </div>
          </div>
          <!-- Address information -->
          <div class="row">
            <div class="col-12 mt-1">
              <h5>Address Information</h5>
              <hr class="my-1" />
              <div class="container-fluid">
                <address-information :disabled="readOnly" data-e2e-type="addressInformation" v-model="lspEdit.addressInformation"></address-information>
              </div>
            </div>
          </div>
          <!-- Currency exchange -->
          <div class="row" v-if="canEdit || readOnly">
            <div class="col-12 mt-1">
              <h5>Currency exchange</h5>
              <hr class="my-1" />
              <div class="container-fluid mt-2">
                <currency-exchange
                  data-e2e-type="currency-exchange"
                  @exchange-add="onExchangeAdd"
                  @exchange-delete="onExchangeDelete"
                  :can-edit="canEdit"
                  v-model="lspEdit.currencyExchangeDetails">
                </currency-exchange>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12 mt-1">
              <div class="d-inline-block ml-3">
                <h5>Security Policy</h5>
              </div>
              <div class="d-inline-block ml-5 text-danger" v-if="!isValidSecurityPolicy">
                Please complete all required fields
              </div>
              <hr class="my-1" />
              <div class="container-fluid" data-e2e-type="security-policy-container">
                <security-policy
                  v-model="lspEdit.securityPolicy"
                  :is-overwritten="true"
                  :canEdit="canEdit"
                  data-e2e-type="security-policy"
                  @onSecurityPolicyValidation="onSecurityPolicyValidation">
                </security-policy>
              </div>
            </div>
          </div>
          <div class="row" v-if="canReadPcSettings">
            <div class="col-12 mt-1">
              <h5>PortalCAT Settings</h5>
              <hr class="my-1" />
              <pc-settings
                v-model="lspEdit.pcSettings"
                :canEdit="canEditPcSettings"
                :languages="languages"
                @validation="onPcSettingsValidation"/>
            </div>
          </div>
          <div class="row" v-if="lspEdit.mtSettings">
            <div class="col-12 mt-1">
              <h5>Machine Translation Settings</h5>
              <hr class="my-1" />
              <mt-settings v-model="lspEdit.mtSettings" :languages="languages"/>
            </div>
          </div>
          <lsp-settings-custom-query v-if="canEditCustomQueries" v-model="lspEdit.customQuerySettings"/>
          <auto-translate-settings v-model="lspEdit.autoTranslateSettings" @validation="onAutoTranslateValidation" />
        </form>
      </div>
      <div class="form-actions">
        <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
        <button
          data-e2e-type="lsp-save"
          class="btn btn-primary pull-right mr-2"
          v-show="!httpRequesting"
          :disabled="!isValid"
          @click="save"
          v-if="canEdit">Save
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./lsp-settings.js"></script>
