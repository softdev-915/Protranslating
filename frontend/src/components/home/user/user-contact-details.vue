<template>
  <div class="container-fluid p-0 contact-details" data-e2e-type="contact-details">

    <div class="row align-items-center">
      <div class="col-12 mt-1">
        <h6>Contact Information</h6>
        <hr class="my-1" />
     </div>
    </div>

    <div class="row">
      <div class="col-12 col-md-6">
        <fieldset>
          <div class="row align-items-center p-0">
            <div class="col-12">
              <div class="row align-items-center">
                <div class="col-12 col-md-4">Qualification status</div>
                <div class="col-12 col-md-8">
                  <simple-basic-select
                    v-if="!readOnly"
                    v-model="contactDetails.qualificationStatus"
                    :options="qualificationStatusOptions"
                    title="Qualification status selector"
                    data-e2e-type="qualification-status-selector"
                  />
                  <div v-if="readOnly">{{ contactDetails.qualificationStatus }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="row align-items-center p-0">
            <div class="col-12">
              <div class="row align-items-center">
                <div class="col-12 col-md-4">Main Phone <span class="pts-required-field">*</span></div>
                <div class="col-5 col-md-4">
                  <phone-input
                    :name="'main-phone'"
                    v-if="!readOnly"
                    v-model="contactDetails.mainPhone.number"
                    data-e2e-type="user-contact-main-phone-input">
                  </phone-input>
                  <div v-else>{{ contactDetails.mainPhone.number}}</div>
                </div>
                <div class="col-1 col-md-1 text-right p-0">Ext</div>
                <div class="col-6 col-md-3">
                  <phone-ext-input
                    data-e2e-type="user-contact-main-phone-ext-input"
                    name="ext"
                    v-if="!readOnly"
                    v-model="contactDetails.mainPhone.ext">
                  </phone-ext-input>
                  <div v-if="readOnly">{{ contactDetails.mainPhone.ext }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="row align-items-center p-0">
            <div class="col-12">
              <div class="row align-items-center">
                <div class="col-12 col-md-4">Office Phone</div>
                <div class="col-12 col-md-8">
                  <phone-input :name="'office-phone'" v-if="!readOnly" data-e2e-type="user-contact-office-phone-input" v-model="contactDetails.officePhone"></phone-input>
                  <div v-else>{{ contactDetails.officePhone}}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="row align-items-center p-0">
            <div class="col-12">
              <div class="row align-items-center">
                <div class="col-12 col-md-4">Mobile Phone</div>
                <div class="col-12 col-md-8">
                  <phone-input :name="'mobile-phone'" v-if="!readOnly" v-model="contactDetails.mobilePhone" data-e2e-type="user-contact-mobile-phone-input"></phone-input>
                  <div v-else>{{ contactDetails.mobilePhone }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="row align-items-center p-0">
            <div class="col-12">
              <div class="row align-items-center">
                <div class="col-12 col-md-4">Home Phone</div>
                <div class="col-12 col-md-8">
                  <phone-input :name="'home-phone'" v-if="!readOnly" v-model="contactDetails.homePhone" data-e2e-type="user-contact-home-phone-input"></phone-input>
                  <div v-else>{{ contactDetails.homePhone }}</div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      <div class="col-12 col-md-6">
        <fieldset>
          <div class="row align-items-center">
            <div class="col-12 col-md-3">Job title</div>
            <div class="col-12 col-md-7">
              <input
                v-if="!readOnly"
                type="text"
                class="form-control"
                data-e2e-type="user-contact-job-title-input"
                v-model="contactDetails.jobTitle">
              <div v-else>{{ contactDetails.jobTitle }}</div>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-3">Sales Rep</div>
            <div class="col-9 col-md-7">
              <user-ajax-basic-select
                v-if="hasUserReadAccess && !readOnly"
                :selected-option="contactDetailsSalesRepSelected"
                @select="onContactDetailsSalesRepChange"
                :filter="{type: 'Staff', ability: 'Sales Rep'}"
                data-e2e-type="salesRepSelector"
                placeholder="Select Sales Rep">
              </user-ajax-basic-select>
              <div v-else>{{ salesRepName }}</div>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-3">LinkedIn Url</div>
            <div class="col-9 col-md-7">
              <url-input
                v-if="!readOnly"
                v-model.trim="contactDetails.linkedInUrl">
              </url-input>
              <div v-else>{{ contactDetails.linkedInUrl }}</div>
            </div>
            <div class="col-3 col-md-2 align-right">
              <a data-e2e-type="goToUrlButton" class="btn btn-primary goUrlButton"
              :disabled="!urlText"
              :class="{'disabled': errors.has('linkedInUrl') || contactDetails.linkedInUrl === ''}"
              rel="noopener noreferrer" target="_blank" :href="urlText">
                Go to Url
              </a>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-3">Company Tier Level</div>
            <div class="col-12 col-md-7">
              <customer-tier-level-selector
                v-model="contactDetails.companyTierLevel"
                v-if="!readOnly"
                placeholder="Select Company Tier Level">
              </customer-tier-level-selector>
              <div v-else>{{ contactDetails.companyTierLevel }}</div>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-3">Lead source</div>
            <div class="col-9 col-md-7">
              <lead-source-selector
                v-model="contactDetails.leadSource"
                v-if="!readOnly"
                title="Lead Source"
                data-e2e-type="lead-source-selector"
                placeholder="Select Lead source">
              </lead-source-selector>
              <div v-else>{{ leadSourceName }}</div>
            </div>
            <div class="col-3 col-md-1 mobile-align-right" v-if="!readOnly">
              <button data-e2e-type="manage-lead-source-button" class="btn btn-primary" @click="manageLeadSource">Manage</button>
            </div>
          </div>
        </fieldset>
      </div>
    </div>

    <div class="row align-items-center">
      <div class="col-12 mt-1">
        <h6>Address Information</h6>
        <hr class="my-1" />
      </div>
    </div>

    <div class="row">
      <div class="col-12" data-e2e-type="mailing-address-container">
        <div class="row">
          <div class="col-12">
            <h6 class="pl-0">Mailing Address</h6>
          </div>
        </div>
        <address-information :disabled="readOnly" data-e2e-type="mailing-address-container" v-model="contactDetails.mailingAddress"></address-information>
        <div class="row">
          <div class="col-12">
            <h6 class="pl-0">Billing Address</h6>
          </div>
        </div>
        <div class="row align-items-center checkbox-container mt-3 mb-3">
          <div class="col-11 col-md-2">Same as Mailing</div>
          <div class="col-1 col-md-8">
            <input
              value="true"
              :disabled="readOnly"
              type="checkbox"
              class="form-control pts-clickable"
              data-e2e-type="billingSameAsMailing"
              v-model="billingSameAsMailing">
          </div>
        </div>
        <address-information :disabled="readOnly" :required="true" data-e2e-type="billing-address-container" v-model="contactDetails.billingAddress"></address-information>
        <div class="row">
          <div class="col-12 col-md-2">
            <label>Billing Email</label>
            <span class="pts-required-field" data-e2e-type="billing-email-required">*</span>
          </div>
          <div
            data-e2e-type="billing-email-container"
            class="col-12 col-md-10"
            :class="{'has-danger': isValidEmail }">
            <pts-email-input
              data-e2e-type="billing-email"
              :allowEmpty="isNew"
              elemId="contactBillingEmail"
              elemName="billingEmail"
              v-model.trim="contactDetails.billingEmail"
              cssClass="form-control"
              invalidClass="form-control-danger"
              @email-validation="onEmailValidation">
             </pts-email-input>
            <div class="form-control-feedback" data-e2e-type="billing-email-error-message">{{ billingEmailErrorMessage }}</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12">
            <h5>Requests</h5>
          </div>
          <div class="col">
            <h6 class="pts-clickable p-3" @click="manageRequest($event)">
              <a :href="requestsLink" data-e2e-type="manageRequest"><u>View/Create Request</u></a>
            </h6>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12">
            <h5>Set Preferred Language Combination</h5>
          </div>
          <div class="col-12 d-flex">
            <div class="col-6">
              <language-select
                v-if="hasMultipleTargetLanguages"
                v-model="srcLangs"
                :options="languages"
                :fetch-on-created="false"
                data-e2e-type="source-language-single-select"
                title="Language list"
                placeholder="Select source language">
              </language-select>
              <language-multi-select
                v-else
                data-e2e-type="source-language-multi-select"
                v-model="srcLangs"
                :fetch-on-created="false"
                :options="languages"
                title="Language list"
                placeholder="Select source languages">
              </language-multi-select>
            </div>
            <div class="col-6">
              <language-select
                v-if="hasMultipleSourceLanguages"
                v-model="tgtLangs"
                :fetch-on-created="false"
                :options="languages"
                data-e2e-type="target-language-single-select"
                title="Language list"
                placeholder="Select target language">
              </language-select>
              <language-multi-select
                v-else
                v-model="tgtLangs"
                :options="languages"
                :fetch-on-created="false"
                data-e2e-type="target-language-multi-select"
                title="Language list"
                placeholder="Select target languages">
              </language-multi-select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./user-contact-details.js"></script>
<style scoped lang="scss" src="./user-contact-details.scss"></style>
