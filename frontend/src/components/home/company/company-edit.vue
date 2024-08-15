<template>
  <div
    class="pts-grid-edit-modal company-inline-edit"
    :class="{'blur-loading-row': httpRequesting}">
    <div>
      <div slot="default">
        <div class="container-fluid" v-show="this.managing === null">
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="name" data-e2e-type="nameLabel">
                Name
                <span class="pts-required-field">*</span>
              </label>
            </div>
            <div
              class="col-12 col-md-10"
              :class="{'has-danger': (!isValidName && company.name !== '') || errors.has('name')}">
              <input
                type="text"
                class="form-control"
                v-validate="'required'"
                id="name" name="name" autofocus
                :disabled="!canEdit"
                :class="{'form-control-danger': (!isValidName && company.name !== '') || errors.has('name')}" v-model.trim="company.name">
              <span class="form-control-feedback" v-show="errors.has('name')">{{ errors.first('name') }}</span>
              <span class="form-control-feedback" v-show="!isValidName && company.name !== ''" >Company already exists</span>
            </div>
          </div>
          <div
            data-e2e-type="parent-company-select-container"
            class="row align-items-center">
            <div class="col-12 col-md-2">Parent Company</div>
            <div class="col-9 col-md-8">
              <company-ajax-basic-select
                data-e2e-type="company-select"
                :fetch-on-created="false"
                :is-disabled="company.hasChild || !canEdit"
                :selected-option="selectedParentCompany"
                :filter="{allCompanyLevels: false, excludeByIdInHierarchy: company._id}"
                @select="onParentCompanySelect"
                title="Parent company">
              </company-ajax-basic-select>
            </div>
            <div class="col-3 col-md-2 align-right" v-if="canEdit">
              <button class="btn btn-primary" @click="manage('companies')">Manage</button>
            </div>
          </div>
          <div class="row align-items-center checkbox-container form-group" v-show="!isNew && canEdit">
            <div class="col-11 col-md-2">
              <label for="company-inactive">Inactive</label>
            </div>
            <div class="col-1 col-md-8">
              <input
                type="checkbox"
                id="company-inactive"
                class="form-control pts-clickable"
                v-model.trim="company.deleted"
                value="true"
                aria-label="Company inactive"/>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-6 col-md-2">
              <span data-e2e-type="statusLabel">
                Company Status
                <span class="pts-required-field">*</span>
              </span>
            </div>
            <div class="col-6 col-md-4">
              <simple-basic-select
                v-model="company.status"
                :disabled="!canEdit"
                :options="companyStatusSelectOptions"
                placeholder="Select Company Status"
                data-e2e-type="companyStatusSelector"/>
            </div>
            <div class="col-6 col-md-1">
              <span data-e2e-type="industryLabel">
                Industry
                <span class="pts-required-field">*</span>
              </span>
            </div>
            <div class="col-6 col-md-5">
              <industry-select
                :disabled="!canEdit"
                v-model="company.industry"
                placeholder="Select Industry"
                title="Industry"
                data-e2e-type="industrySelector"
              />
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-6 col-md-2">Pursuit Active</div>
            <div class="col-6 col-md-4">
              <input
                data-e2e-type="pursuitActive"
                type="checkbox"
                class="form-control pts-clickable"
                v-model.trim="company.pursuitActive"
                value="true"
                aria-label="Company Pursuit Active"/>
            </div>
            <div class="col-6 col-md-1">
              <span data-e2e-type="customerTierLevelLabel">
                Customer Tier Level
                <span class="pts-required-field">*</span>
              </span>
            </div>
            <div class="col-6 col-md-5">
              <customer-tier-level-selector
                v-model="company.customerTierLevel"
                :is-disabled="!canEdit"
                placeholder="Select Customer Tier Level">
              </customer-tier-level-selector>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-1 col-md-1 offset-md-6">Service Agreement</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                data-e2e-type="serviceAgreement"
                class="form-control pts-clickable"
                v-model="company.serviceAgreement"
                aria-label="Company Service Agreement"/>
            </div>
            <div class="col-1 col-md-1">Mandatory External Accounting Code</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                data-e2e-type="isMandatoryExternalAccountingCode"
                class="form-control pts-clickable"
                v-model="company.isMandatoryExternalAccountingCode"
                aria-label="Mandatory External Accounting Code"
                :disabled="!isMandatoryExternalAccountingCodeEditMode"/>
            </div>
            <div class="col-1 col-md-1">Mandatory Request Contact</div>
            <div class="col-1 col-md-1">
              <input
                type="checkbox"
                data-e2e-type="mandatoryRequestContact"
                class="form-control pts-clickable"
                v-model="company.mandatoryRequestContact"
                aria-label="Mandatory Request Contact"/>
            </div>
          </div>

          <div class="row align-items-center mb-1" v-if="canReadDataClassification">
            <div class="col-6 col-md-2" data-e2e-type="data-classification-label">
              <span>
                Data Classification
                <span class="pts-required-field">*</span>
              </span>
            </div>
            <div class="col-6 col-md-4">
              <simple-basic-select
                v-model="company.dataClassification"
                :disabled="!canEditDataClassification"
                :is-error="!isValidDataClassification"
                :options="dataClassificationSelectOptions"
                placeholder="Select Data Classification"
                data-e2e-type="dataClassification"/>
              <span
                v-show="!isValidDataClassification"
                class="data-classification-error"
                data-e2e-type="dataClassificationError"
              >The Data Classification field is required.</span>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Available time to deliver</div>
            <div
              class="col-12 col-md-8"
              :class="{'has-danger': !isValidAvailableTimeToDeliver}">
              <human-interval-input
                data-e2e-type="available-time-to-deliver"
                :disabled="!canEdit"
                v-model="company.availableTimeToDeliver"
                @human-interval-valid="onAvailableTimeToDeliverValidation"
              />
              <span
                v-show="!isValidAvailableTimeToDeliver"
                class="data-classification-error"
                data-e2e-type="available-time-to-deliver-error"
              >This field accept only comma separated values and a value should be added after the comma.</span>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Company Website</div>
            <div
              class="col-12 col-md-8"
              :class="{'has-danger': (errors.has('website')) && company.website !== ''}">
              <input
                data-e2e-type="website"
                type="text"
                class="form-control"
                name="website"
                placeholder="https://..."
                :disabled="!canEdit"
                v-model.trim="companyUrl"
                v-validate="{url: true}"/>
              <span
                class="form-control-feedback"
                v-show="(errors.has('website')) && company.website !== ''">Website is invalid</span>
            </div>
            <div class="col-12 col-md-2 align-right">
              <a
                data-e2e-type="goToUrlButton"
                class="btn btn-primary"
                :class="{'disabled': errors.has('website') || company.website === ''}"
                rel="noopener noreferrer"
                target="_blank"
                :href="urlText"
                @click="goToUrl($event)">Go to Url</a>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Company Primary Phone Number</div>
            <div class="col-12 col-md-10">
              <input
                :disabled="!canEdit"
                data-e2e-type="primaryPhoneNumber"
                type="text"
                class="form-control"
                name="primaryPhoneNumber"
                v-model.trim="company.primaryPhoneNumber"/>
            </div>
          </div>

          <div class="row align-items-center">
            <div class="col-12 col-md-2">Locations</div>
            <div class="col-12 col-md-8" v-if="canReadLocations && canEdit">
              <location-multi-selector
                :is-disabled="!canEdit"
                v-model="company.locations"
                data-e2e-type="location-selector"/>
            </div>
            <div class="col-3 col-md-2 align-right" v-if="canReadLocations && canEdit">
              <button
                class="btn btn-primary"
                @click="manageLocations()"
                data-e2e-type="manage-location-button">Manage</button>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Company Notes</div>
            <div class="col-12 col-md-10 multiselect-container" id="notesContainer">
              <rich-text-editor
                :disabled="!canEdit"
                v-model.trim="company.notes"
                placeholder="Notes"/>
            </div>
          </div>
          <div class="row align-items-center" v-if="hasUserReadAccess">
            <div class="col-12 col-md-2">Sales Rep</div>
            <div class="col-9 col-md-8">
              <user-ajax-basic-select
                v-if="hasUserReadAccess"
                :selected-option="salesRepSelected"
                @select="onSalesRepChange"
                :filter="{type: 'Staff', ability: 'Sales Rep'}"
                :is-disabled="!canEdit"
                data-e2e-type="salesRepSelector"
                placeholder="Select Sales Rep"/>
              <span v-else>{{salesRepName}}</span>
            </div>
            <div class="col-3 col-md-2 align-right" v-if="canEdit">
              <button class="btn btn-primary" @click="manageSalesRep()">Manage</button>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">LSP Internal departments</div>
            <div class="col-12 col-md-8" v-if="canEdit && canReadInternalDepartments">
              <internal-department-multi-selector
                v-model="company.internalDepartments"
                data-e2e-type="internalDepartmentsSelector"/>
            </div>
            <div class="col-12 col-md-8" v-else>
              <span>{{internalDepartments}}</span>
            </div>
          </div>
          <div class="row" v-if="!httpRequesting && canReadPcSettings">
            <div class="col-12 mt-1">
              <h5>PortalCAT Settings</h5>
              <hr class="my-1" />
              <pc-settings
                v-model="company.pcSettings"
                :canEdit="canEditPcSettings"
                :companyId="company._id"
                :languages="languages"
                @validation="onPcSettingsValidation"/>
            </div>
          </div>
          <div class="row" v-if="!isNew && hasBalance">
            <div class="col-12 mt-1 pt-2">
              <h5>Balance Information</h5>
              <hr class="mt-1 mb-3" />
              <balance-information :balance="company.balanceInformation" data-e2e-type="company-balance-info-table" />
            </div>
          </div>
          <div class="row" v-if="!httpRequesting">
            <div class="col-12 mt-1">
              <h5>Machine Translation Settings</h5>
              <hr class="my-1" />
              <mt-settings :company="company._id" :industry="company.industry" v-model="company.mtSettings" :isUserIpAllowed="isUserIpAllowed"/>
            </div>
          </div>
          <div class="row">
            <div class="col-12 mt-1 pt-2">
              <h5>Address Information</h5>
              <hr class="my-1" />
              <div class="container-fluid">
                <div class="row">
                  <div class="col-12 pl-0">
                    <h6 class="pl-0">Mailing Address</h6>
                  </div>
                </div>
                <address-information
                  v-if="!loadingCountries"
                  :available-countries="countries"
                  :disabled="!canEdit"
                  address-type="mailing"
                  data-e2e-type="mailingAddress"
                  v-model="company.mailingAddress"/>
                <div class="row">
                  <div class="col-12 pl-0">
                    <h6 class="pl-0">Billing Address</h6>
                  </div>
                </div>
                <div class="row align-items-center" v-if="canEdit">
                  <div class="col-11 col-md-2">Same as Mailing</div>
                  <div class="col-1 col-md-8">
                    <input
                      value="true"
                      type="checkbox"
                      class="form-control pts-clickable"
                      data-e2e-type="billingSameAsMailing"
                      v-model="billingSameAsMailing"/>
                  </div>
                </div>
                <address-information
                  v-if="!loadingCountries"
                  :available-countries="countries"
                  :disabled="!canEdit"
                  address-type="billing"
                  data-e2e-type="billingAddress"
                  v-model="company.billingAddress"/>
                <div class="row align-items-center">
                  <div class="col-12 col-md-2">Billing Email</div>
                  <div class="col-12 col-md-10">
                    <input
                      :disabled="!canEdit"
                      data-e2e-type="billingEmail"
                      type="text"
                      class="form-control"
                      name="billingEmail"
                      v-model.trim="company.billingEmail"/>
                  </div>
                </div>
              </div>
              <billing-information
                :shouldCollapseAllRates="shouldCollapseAllRates"
                :disabled="!canEdit"
                :company-id="company._id"
                v-model="company.billingInformation"
                v-if="canAccessBillingInformation && !isNew"
                @retrieve-rates="retrieveRates"
                @company-minimum-charge-list="onCompanyMinChargeList"
                @billing-information-validation="onBillingInformationValidation($event)"
                @billing-information-manage-entity="onManageBillingInformationEntity"/>
            </div>
          </div>
          <div class="container-fluid mb-4" data-e2e-type="subcompanyGrid" v-if="!isNew">
            <button
              class="btn btn-primary mb-2"
              data-e2e-type="toggle-subcompanies-grid-button"
              @click="() => isSubCompanyGridExpanded = !isSubCompanyGridExpanded">{{ isSubCompanyGridExpanded ? 'Hide' : 'Show' }} Subcompanies</button>
            <div v-if="isSubCompanyGridExpanded">
              <h5>Subcompany Grid</h5>
              <hr class="my-1" />
              <div class="row">
                <company-grid
                  force-query-params
                  grid-name="company-subcompany-embed-grid"
                  @company-edition="onEditSubCompany($event)"
                  @company-creation="onCreateSubCompany($event)"
                  :grid-columns="subCompanyGridColumns"
                  :query="companyGridQuery"/>
              </div>
            </div>
          </div>
          <div
            class="container-fluid mb-4"
            data-e2e-type="contactGrid"
            v-if="!isNew && hasUserReadAccess">
            <button
              class="btn btn-primary mb-2"
              data-e2e-type="toggle-contacts-grid-button"
              @click="() => isContactGridExpanded = !isContactGridExpanded">{{ isContactGridExpanded ? 'Hide' : 'Show' }} Contacts</button>
            <div v-if="isContactGridExpanded">
              <h5>Contacts</h5>
              <hr class="my-1" />
              <div class="mt-3">
                <user-grid
                  force-query-params
                  :grid-name="'company-user-embed-grid'"
                  @user-edition="onEditContact($event)"
                  @user-creation="onCreateContact($event)"
                  :query="userGridQuery"/>
              </div>
            </div>
          </div>
          <div
            class="container-fluid mb-4"
            data-e2e-type="company-excluded-providers-table"
            v-if="!isNew && hasUserReadAccess">
            <button
              class="btn btn-primary mb-2"
              data-e2e-type="toggle-company-excluded-providers-table-button"
              @click="() => isExcludedProvidersTableExpanded = !isExcludedProvidersTableExpanded">{{ isExcludedProvidersTableExpanded ? 'Hide' : 'Show' }} Excluded Providers</button>
            <div v-show="isExcludedProvidersTableExpanded">
              <h5>Excluded Providers</h5>
              <hr class="my-1" />
              <div class="mt-3">
                <company-excluded-providers-table
                  :company-id="company._id"
                  :query="excludedProvidersTableQuery"
                  @add-excluded-provider="addExcludedProvider"
                  @update-excluded-provider-note="updateExcludedProviderNote"
                  @remove-excluded-provider="removeExcludedProvider"/>
              </div>
            </div>
          </div>
          <workflow-templates-section v-if="!isNew" :company-id="company._id"/>
          <div class="row">
            <div class="col-12 mt-1">
              <h5>Security and Compliance</h5>
              <hr class="my-1" />
              <div class="container-fluid">
                <div class="row">
                  <div class="col-12 pl-0">
                    <h6 class="pl-0">Document Retention Period</h6>
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 col-md-1 align-self-center">Days</div>
                  <div class="col-6 col-md-2">
                    <input
                      type="number"
                      data-e2e-type="retentionDays"
                      class="form-control"
                      :disabled="!canChangeRetentionPolicy"
                      v-model.number="company.retention.days"
                      min="0"/>
                  </div>
                  <div class="col-6 col-md-1 align-self-center">Hours</div>
                  <div class="col-6 col-md-2">
                    <input
                      type="number"
                      data-e2e-type="retentionHours"
                      class="form-control"
                      :disabled="!canChangeRetentionPolicy"
                      v-model.number="company.retention.hours"
                      min="0"/>
                  </div>
                  <div class="col-6 col-md-1 align-self-center">Minutes</div>
                  <div class="col-6 col-md-2">
                    <input
                      type="number"
                      data-e2e-type="retentionMinutes"
                      class="form-control"
                      :disabled="!canChangeRetentionPolicy"
                      v-model.number="company.retention.minutes"
                      min="0"/>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12 pl-0">
                    <h6>
                      <span class="pts-required-field">*</span>Allowed Addresses (CIDR)
                    </h6>
                  </div>
                </div>
                <div class="row" data-e2e-type="cidr-container">
                  <div class="col-12 col-md-10 p-0">
                    <div class="container-fluid p-0">
                      <div
                        class="row p-0"
                        v-for="(cidr, index) in company.cidr"
                        :key="index"
                        data-e2e-type="cidr-entry">
                        <div class="col-12 col-md-10 p-0">
                          <subnet-group
                            :disabled="!canUpdateSecurity"
                            data-e2e-type="cidr-entry-subnet"
                            v-if="cidr"
                            :value="cidr"
                            @input="updateCIDR(index, $event)"
                            @subnet-valid="subnetValid(index, $event)"
                            @add-subnet="addSubnet()"/>
                        </div>
                        <div class="col-12 col-md-2 mt-2">
                          <button
                            :disabled="!canUpdateSecurity"
                            class="form-control btn btn-secondary"
                            @click="removeSubnet(index)"
                            data-e2e-type="cidr-entry-remove"
                            aria-label="Remove CIDR entry">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div class="row p-0" v-show="isEmptyCIDR">
                        <div
                          class="col-12 col-md-10 p-0">No one will be able to download any files for this company</div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="col-12 col-md-2 align-self-end mb-2"
                    v-show="isValidSubnet || isEmptyCIDR">
                    <button
                      :disabled="!canUpdateSecurity"
                      class="form-control btn btn-secondary add-subnet-button"
                      aria-label="Add CIDR entry"
                      data-e2e-type="cidr-add"
                      @click="addSubnet()">Add</button>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <input
                      type="checkbox"
                      class="pts-clickable"
                      :disabled="!canUpdateSecurity"
                      id="allow-copy-paste"
                      data-e2e-type="allow-pc-copy-paste"
                      v-model="company.allowCopyPasteInPortalCat">
                    <label for="allow-copy-paste" class="pts-clickable">Allow copy/paste in PortalCAT</label>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <input
                      type="checkbox"
                      class="pts-clickable"
                      :disabled="!canUpdateSecurity"
                      id="allow-copy-paste"
                      data-e2e-type="allow-pc-copy-paste"
                      v-model="company.allowCopyPasteInPortalCat">
                    <label for="allow-copy-paste" class="pts-clickable">Allow copy/paste in PortalCAT</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Security Policy -->
          <div class="row">
            <div class="col-12 mt-1">
              <h5 class="d-inline-block mr-4">Security Policy</h5>
              <div class="d-inline-block ml-4">
                <input
                  type="checkbox"
                  class="pull-left mt-1 ml-2"
                  data-e2e-type="existing-security-policies-checkbox"
                  id="checkSecurityPolicy"
                  v-model="useExistingSecurityPolicies"
                  :disabled="!canEdit"/>
                <label
                  for="checkSecurityPolicy"
                  class="ml-1">Check this if you want to use existing security policies</label>
              </div>
              <hr class="my-1" />
              <div class="container-fluid" data-e2e-type="security-policy-container">
                <security-policy
                  data-e2e-type="security-policy"
                  v-model="company.securityPolicy"
                  :canEdit="canEdit"
                  :is-overwritten="!useExistingSecurityPolicies"
                  @security-policy-validation="onSecurityPolicyValidation"/>
              </div>
            </div>
          </div>
          <sso-settings
            :can-edit="canEdit"
            :company-id="company._id"
            v-model="company"
            @validation="onSSOSettingsValidation"
          />
          <si-connector-details v-model="company.siConnector" />
          <ip-details v-if="shouldShowIPRatesSection" :company-id="company._id" data-e2e-type="ip-details-section"/>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
        <button
          class="btn btn-primary pull-right mr-2"
          :disabled="!isValid"
          :title="billingErrors"
          @click="save"
          v-if="canEdit">Save</button>
      </div>
    </div>
    <confirm-dialog
      data-e2e-type="company-confirm-dialog"
      cancelText="No"
      :confirmationMessage="confirmDialogMessage"
      confirmationTitle="Warning"
      @confirm="onDialogConfirm"
      ref="confirmDialog"
    />
  </div>
</template>

<style scoped lang="scss" src="./company-edit.scss"></style>
<style lang="scss" src="./company-edit-global.scss"></style>
<script src="./company-edit.js"></script>

