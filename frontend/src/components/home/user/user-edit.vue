<template>
  <div
    class="pts-grid-edit-modal user-inline-edit"
    data-e2e-type="user-form"
    :class="{'blur-loading-container': httpRequesting || saving }">
    <div slot="default">
      <!-- LOADING BUTTON -->
      <div class="container-fluid" v-show="httpRequesting && !saving">
        <div class="row justify-content-center">
          <div class="col-1">
            <i class="fas fa-spin fa-circle-o-notch"></i>
          </div>
        </div>
      </div>
      <!-- USER ROLE'S EDITION -->
      <user-roles-selection v-show="!httpRequesting && showRoles" v-model="user.roles"></user-roles-selection>
      <!-- USER GROUP'S EDITION -->
      <user-groups-selection v-show="!httpRequesting && showGroups" v-model="user.groups"></user-groups-selection>
      <!-- USER EDITION -->
      <div class="container-fluid" v-show="(!httpRequesting || saving) && showUser">
        <!-- used to indicate the e2e test if the password must be given-->
        <input type="hidden" name="isNewUser" value="true" id="isNewUser" v-if="isNew">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span data-e2e-type="emailLabel">
              Email
              <span v-if="!isUserWithNoEmail" class="pts-required-field">*</span>
            </span>
          </div>
          <div
            data-e2e-type="email-container"
            class="col-12 col-md-10 pts-grid-edit-text"
            v-if="!canEditEmail">{{user.email}}</div>
          <div
            data-e2e-type="email-container"
            class="col-12 col-md-10"
            :class="{'has-danger': showEmailErrorBorder }"
            v-else>
            <pts-email-input
              :allowEmpty="isUserWithNoEmail"
              elemId="userEmail"
              elemName="email"
              v-model.trim="user.email"
              cssClass="form-control"
              invalidClass="form-control-danger"
              @email-validation="onEmailValidation($event)"/>
            <div class="form-control-feedback" data-e2e-type="invalid-email-message">{{ emailErrorMessage }}</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span data-e2e-type="firstNameLabel">
              First
              <span class="pts-required-field">*</span>
            </span>
          </div>
          <div
            class="col-12 col-md-10"
            :class="{'has-danger': errors.has('first')}"
            v-if="!readOnly">
            <input
              type="text"
              id="first"
              name="first"
              class="form-control"
              :class="{'form-control-danger': errors.has('first')}"
              v-model="user.firstName"
              v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('first')">First name is required.</div>
          </div>
          <div
            class="col-12 col-md-10"
            :class="{'has-danger': errors.has('first')}"
            v-else>{{user.firstName}}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Middle</div>
          <div class="col-12 col-md-10" v-if="!readOnly">
            <input
              type="text"
              id="middle"
              name="middle"
              class="form-control"
              v-model="user.middleName">
          </div>
          <div class="col-12 col-md-10" v-else>{{user.middleName}}</div>
        </div>
        <div class="row align-items-center" :class="{'has-danger': errors.has('last')}">
          <div class="col-12 col-md-2">
            <span data-e2e-type="lastNameLabel">
              Last
              <span class="pts-required-field">*</span>
            </span>
          </div>
          <div class="col-12 col-md-10" v-if="!readOnly">
            <input
              type="text"
              id="last"
              name="last"
              class="form-control"
              :class="{'form-control-danger': errors.has('last')}"
              v-model="user.lastName"
              v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('last')">Last name is required.</div>
          </div>
          <div
            class="col-12 col-md-10"
            :class="{'has-danger': errors.has('last')}"
            v-else>{{user.lastName}}</div>
        </div>
        <span v-if="isVendor">
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <span data-e2e-type="emailLabel">
                Secondary email
              </span>
            </div>
            <div
              v-if="!canEditEmail"
              data-e2e-type="email-container"
              class="col-12 col-md-10 pts-grid-edit-text"
            >{{user.secondaryEmail}}</div>
            <div
              v-else
              data-e2e-type="secondary-email-container"
              class="col-12 col-md-10"
              :class="{'has-danger': hasSecondaryEmailError }">
              <pts-email-input
                :allowEmpty="true"
                elemId="userSecondaryEmail"
                elemName="secondaryEmail"
                v-model.trim="user.secondaryEmail"
                cssClass="form-control"
                invalidClass="form-control-danger"
                @email-validation="onSecondaryEmailValidation($event)"/>
                <div
                  v-if="hasSecondaryEmailError"
                  class="form-control-feedback"
                  data-e2e-type="invalid-secondary-email-message">
                  {{ secondaryEmailErrorMessage }}
                </div>
            </div>
          </div>
          <div class="row align-items-center checkbox-container">
            <div class="col-11 col-md-2">
              Turn off notifications for secondary email
            </div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                class="form-control pts-clickable"
                v-model="user.inactiveSecondaryEmailNotifications"
                data-e2e-type="inactive-secondary-email-notifications-checkbox">
            </div>
          </div>
        </span>
        <div class="row align-items-center checkbox-container" v-if="isContact">
          <div class="col-11 col-md-2">Turn off notifications</div>
          <div class="col-1 col-md-1">
            <input
              type="checkbox"
              class="form-control pts-clickable"
              v-model="inactiveNotifications"
              value="false"
              data-e2e-type="user-inactive-notifications-checkbox">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">Force password change</div>
          <div class="col-1 col-md-1">
            <input
              type="checkbox"
              class="form-control pts-clickable"
              v-model="user.forcePasswordChange"
              :disabled="isSSOEnabled && !user.isApiUser"
              value="false"
              data-e2e-type="user-force-password-change-checkbox">
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">User Locked</div>
          <div class="col-1 col-md-1">
            <input
              type="checkbox"
              class="form-control pts-clickable"
              v-model="user.isLocked"
              data-e2e-type="user-locked-checkbox">
          </div>
        </div>
         <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">2FA {{ is2FAEnabled ? 'Enabled' : 'Disabled'}}</div>
          <div class="col-1 col-md-1">
            <input
              :disabled="!is2FAEnabled"
              v-model="user.useTwoFactorAuthentification"
              type="checkbox"
              class="form-control pts-clickable"
              data-e2e-type="user-2fa-checkbox">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Last login</div>
          <div
            v-if="user.lastLoginAt"
            class="col-12 col-md-10 form-group pt-3"
            data-e2e-type="user-last-login-at">{{ user.lastLoginAt | localDateTime('MM-DD-YYYY HH:mm') }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Roles</div>
          <div class="col-8 pts-grid-edit-text checkbox-modal-window">
            <template v-for="role in user.roles">{{role}}</template>
          </div>
          <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="!readOnly && canEditRoles">
            <i class="fas fa-spin fa-circle-o-notch" v-show="loadingRoles"></i>
            <button
              class="btn btn-primary"
              id="manageUserRoles"
              v-show="!loadingRoles"
              @click="manageRoles">Manage</button>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Groups</div>
          <div class="col-8" data-e2e-type="groups">
            <template v-for="group in user.groups">{{group.name}}</template>
          </div>
          <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="!readOnly && canEditGroups">
            <i class="fas fa-spin fa-circle-o-notch" v-show="loadingGroups"></i>
            <button
              class="btn btn-primary"
              id="manageUserGroups"
              v-show="!loadingGroups"
              @click="manageGroups">Manage</button>
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canDelete">
          <div class="col-11 col-md-2">
            <label for="user-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-1">
            <input
              type="checkbox"
              id="user-inactive"
              class="form-control pts-clickable"
              v-model="user.deleted"
              value="true"
              data-e2e-type="user-inactive-checkbox">
          </div>
        </div>
        <template v-if="!isNew">
          <div v-show="canDelete" class="row align-items-center checkbox-container">
            <div class="col-11 col-md-2">Terminated</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                class="form-control pts-clickable"
                v-model="user.terminated"
                value="true"
                data-e2e-type="user-terminated-checkbox">
            </div>
          </div>
          <div v-show="user.terminated" class="row align-items-center">
            <div class="col-12 col-md-2">Terminated At</div>
            <div
              class="col-12 col-md-10 form-group pt-3"
              data-e2e-type="user-terminated-at">
              {{ user.terminatedAt | localDateTime('MM-DD-YYYY HH:mm') }}
            </div>
          </div>
        </template>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">User Type</div>
          <div class="col-12 col-md-3" v-if="!readOnly" :class="{'has-danger': !isValidType}">
            <simple-basic-select
              id="type"
              v-model="user.type"
              class="non-focusable"
              :class="{'form-control-danger': !isValidType}"
              :options="userTypes"
              title="User type list"/>
            <div class="form-control-feedback" v-show="!isValidType">A type must be selected.</div>
          </div>
          <div class="col-12 col-md-10" v-else>{{user.type}}</div>
        </div>
        <div class="row align-items-center" v-if="showMonthlyApiQuota">
          <div class="col-12 col-md-2">Monthly API Quota</div>
          <div class="col-12 col-md-10">
              <input
              id="monthlyApiQuota"
              :class="{'has-danger': isMonthlyApiQuotaIncorrect }"
              data-e2e-type="monthly-api-quota"
              name="monthlyApiQuota"
              class="form-control"
              :disabled="canEditMonthlyApiQuota"
              v-model="user.monthlyApiQuota">
              <div v-if="isMonthlyApiQuotaIncorrect"
              class="text-danger"
              data-e2e-type="invalid-monthly-api-quota-message"
              >Please enter number of 0 or higher</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Monthly Consumed Quota</div>
          <div data-e2e-type="monthly-consumed-quota" class="col-12 col-md-10">
            <span>{{userMonthlyConsumedQuota}}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Last API Requested At</div>
          <div class="col-12 col-md-10">
            <div>{{userLastApiRequestedAt | localDateTime('MM-DD-YYYY HH:mm')}}</div>
          </div>
        </div>
        <user-status-details @status-changed="onStatusChanged" :read-only="readOnly" :user="user" />
        <!-- USER TYPE = STAFF OR VENDOR -->
        <user-staff-details
          v-model="user.staffDetails"
          v-if="isStaff"
          :readOnly="readOnly"
          :user="user"
          :shouldCollapseAllRates="shouldCollapseAllRates"
          @validate-staff="onStaffValidate"
          @upload-file="uploadFile"
          @manage-internal-department="manageInternalDepartments"
          @manage-competence="manageCompetenceLevels"
          @manage-activity="manageActivity"
          @manage-rate-entity="manageRateEntity"/>
        <!-- END USER TYPE = STAFF OR VENDOR -->
        <!-- USER TYPE = CONTACT -->
        <div class="row align-items-center" v-show="user.type === 'Contact'">
          <div class="col-12 col-md-2">Company <span v-if="!readOnly" class="pts-required-field">*</span></div>
          <div class="col-12 col-md-10" data-e2e-type="company-read-only" v-if="readOnly">{{ companyHierarchy }}</div>
          <div class="col-12 col-md-10" v-else :class="{'form-control-danger': !isValidCompany}">
            <company-ajax-basic-select
              :is-disabled="!canEdit"
              :selected-option="selectedCompany"
              data-e2e-type="company-select"
              :fetch-on-created="false"
              :required="true"
              :can-use-any-company="canReadCompany"
              :load-pre-selected-option="true"
              @select="onCompanySelected"
              title="Company">
            </company-ajax-basic-select>
          </div>
        </div>
        <div class="row align-items-center" v-show="isContact">
          <div class="col-12 col-md-2">
            Project Managers
            <span class="pts-required-field">*</span>
          </div>
          <div
            class="col-12 col-md-8 multiselect-container"
            :class="{'has-danger': !isValidProjectManager}">
            <multi-select
              id="projectManagers"
              :options="projectManagers.options"
              :selected-options="projectManagers.items"
              placeholder="Select Project Manager"
              title="Project manager list"
              :isDisabled="readOnly"
              @select="onSelectProjectManager"/>
            <div
              class="form-control-feedback"
              v-show="!isValidProjectManager">Project Manager is required for a contact.</div>
          </div>
          <div class="col-12 col-md-2 p-0" v-if="canCreateOrEdit">
            <button
              class="btn btn-primary"
              id="manageProjectManagers"
              @click="manageProjectManagers">Manage</button>
          </div>
        </div>
        <div class="row align-items-center" v-if="hasUserType && canCreateOrEdit">
          <div class="col-12 col-md-2">Abilities</div>
          <div class="col-8 multiselect-container">
            <multi-select
              id="abilities"
              :options="abilities.options"
              :selected-options="abilities.items"
              placeholder="Select Abilities"
              :isDisabled="readOnly"
              title="Ability list"
              @select="onSelectAbilities"/>
          </div>
          <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="hasUserType && canCreateOrEdit">
            <button class="btn btn-primary" id="manageAbilities" @click="manageAbility">Manage</button>
          </div>
        </div>
        <div class="row align-items-center" v-if="hasUserType && canCreateOrEdit">
          <div class="col-12 col-md-2">Language Combinations</div>
          <div class="col-8 multiselect-container">
            <language-combination-selector
              id="languageCombinations"
              title="Language list"
              :isDisabled="readOnly"
              v-model="user.languageCombinations"/>
          </div>
          <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="hasUserType && canCreateOrEdit">
            <button
              class="btn btn-primary"
              id="manageLanguageCombinations"
              @click="manageLanguage">Manage</button>
          </div>
        </div>
        <div class="row align-items-center" v-if="hasUserType && canCreateOrEdit">
          <div class="col-12 col-md-2">Translation tool</div>
          <div class="col-8 multiselect-container" data-e2e-type="user-cat-tool-select">
            <cat-tool-multi-select
              :show-deleted="false"
              v-model="user.catTools"
              placeholder="Select Translation Tool"
              :disabled="readOnly"
              title="Translation Tool list"/>
          </div>
          <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="hasUserType && canCreateOrEdit">
            <button class="btn btn-primary" id="manageCatTool" @click="manageCatTool">Manage</button>
          </div>
        </div>
        <!-- Security policy -->
        <div class="row mt-3" v-if="isContact">
          <div class="col-12 mt-1">
            <h5 class="d-inline-block mr-4">Security Policies</h5>
            <div class="d-inline-block ml-4">
              <input
                type="checkbox"
                class="pull-left mt-1 ml-2"
                data-e2e-type="existing-security-policies-checkbox"
                id="checkSecurityPolicy"
                v-model="useExistingSecurityPolicies"
                :disabled="!canCreateOrEdit">
              <label
                for="checkSecurityPolicy"
                class="ml-1">Check this if you want to use existing security policies</label>
            </div>
            <hr class="my-1" />
            <div
              class="container-fluid p-0"
              data-e2e-type="security-policy-container"
              v-if="user.securityPolicy">
              <security-policy
                v-model="user.securityPolicy"
                :canEdit="canCreateOrEdit"
                :is-api-user="user.isApiUser"
                :is-overwritten="!useExistingSecurityPolicies"
                @security-policy-validation="onSecurityPolicyValidation"/>
            </div>
          </div>
        </div>
        <div class="row mt-3 mb-3" v-if="isContact">
          <div class="col-12 mt-1">
            <h6 class="d-inline-block mr-4">Set Up Password</h6>
            <hr class="my-1" />
            <password
              :can-edit="canCreateOrEdit"
              :is-sso-enabled="isSSOEnabled"
              :user="user"
              :hasOverwrittenSecurityPolicy="!useExistingSecurityPolicies"
              :show-api-checkbox="true"
              @on-api-change="onIsApiUserChange"
              @is-valid-password="onValidPasswordUpdate"
              v-model="user.password"/>
          </div>
        </div>
        <user-contact-details
          v-model="user.contactDetails"
          v-if="isContact"
          :user="user"
          @lead-source-manage="manageLeadSource"
          @manage-request="manageRequest"
          @preferred-language-combination-selected="onPreferredLanguageCombinationChange"
          @validate-contact="onContactValidate"
          :readOnly="readOnly"/>
        <user-vendor-details
          v-model="user.vendorDetails"
          v-if="isVendor"
          :readOnly="readOnly"
          :shouldCollapseAllRates="shouldCollapseAllRates"
          :user="user"
          :abilities="abilitiesRaw"
          @validate-vendor="onVendorValidate"
          @get-vendor-details-update="getUpdatedVendorDetails"
          @upload-file="uploadFile"
          @manage-competence="manageCompetenceLevels"
          @manage-internal-departments="manageInternalDepartments"
          @manage-payment-methods="managePaymentMethods"
          @manage-breakdowns="manageBreakdowns"
          @manage-translation-units="manageTranslationUnits"
          @manage-currencies="manageCurrencies"
          @manage-billing-terms="manageBillingTerms"
          @manage-tax-forms="manageTaxForms"
          @manage-activity="manageActivity"
          @manage-rate-entity="manageRateEntity"
          @manage-vendor-minimum-charge="manageVendorMinimumCharge"/>
        <div class="row mt-3" v-if="isStaff || isVendor">
          <div class="col-12 mt-1">
            <h5 class="d-inline-block mr-4">Security Policies</h5>
            <div class="d-inline-block">
              <input
                type="checkbox"
                class="pull-left mt-1 ml-2"
                data-e2e-type="existing-security-policies-checkbox"
                id="checkSecurityPolicy"
                v-model="useExistingSecurityPolicies"
                :disabled="!canCreateOrEdit">
              <label
                for="checkSecurityPolicy"
                class="ml-1">Check this if you want to use existing security policies</label>
            </div>
            <hr class="my-1" />
            <div
              class="container-fluid p-0"
              data-e2e-type="security-policy-container"
              v-if="user.securityPolicy">
              <security-policy
                v-model="user.securityPolicy"
                :canEdit="canCreateOrEdit"
                :is-api-user="user.isApiUser"
                :is-overwritten="!useExistingSecurityPolicies"
                @security-policy-validation="onSecurityPolicyValidation"/>
            </div>
          </div>
        </div>
        <si-connector-details v-model="user.siConnector" />
        <div class="row mt-3 mb-3" v-if="isStaff || isVendor">
          <div class="col-12 mt-1">
            <h6 class="d-inline-block mr-4">Set Up Password</h6>
            <hr class="my-1" />
            <div class="container-fluid p-0">
              <password
                :can-edit="canCreateOrEdit"
                :user="user"
                :hasOverwrittenSecurityPolicy="!useExistingSecurityPolicies"
                :show-api-checkbox="true"
                @on-api-change="onIsApiUserChange"
                @is-valid-password="onValidPasswordUpdate"
                v-model="user.password"/>
            </div>
          </div>
        </div>
        <div class="row align-items-center" v-if="!isNew">
          <div class="col-12">
            <h5>Activities</h5>
          </div>
          <div class="col">
            <h6
              class="pts-clickable p-md-4"
              @click="manageActivity($event)">
              <a :href="activitiesLink" data-e2e-type="manageActivity">
                <u>View/Create Activity</u>
              </a>
            </h6>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" v-show="showUser" @click="close">{{ cancelText }}</button>
      <button
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="!readOnly && canCreateOrEdit"
        v-show="!httpRequesting">Save</button>
    </div>
  </div>
</template>

<script src="./user-edit.js"></script>

<style scoped lang="scss" src="./user-edit.scss"></style>
<style lang="scss" src="./user-edit_global.scss"></style>
