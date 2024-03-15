<template>
  <div class="container-fluid p-0">
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Vendor Type
        <span class="pts-required-field">*</span>
      </div>
      <div v-if="!readOnly" class="col-12 col-md-3">
        <simple-basic-select
          v-model="vendorDetails.type"
          :options="vendorTypeOptions"
          class="non-focusable"
          title="Vendor type list"
          data-e2e-type="user-vendor-type"
        />
      </div>
      <div v-else class="col-12 col-md-10">{{ vendorDetails.type }}</div>
    </div>
    <div class="row align-items-center checkbox-container mt-3 mb-3">
      <div class="col-11 col-md-2">
        <label for="user-outlier">Outlier</label>
      </div>
      <div class="col-1 col-md-1">
        <input
          type="checkbox"
          id="user-outlier"
          class="form-control pts-clickable"
          v-model="vendorDetails.outlier"
          data-e2e-type="user-outlier-checkbox">
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <label for="vendorCompany">Vendor Company</label>
      </div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          id="vendorCompany"
          type="text"
          data-e2e-type="vendorCompany"
          name="company"
          class="form-control"
          v-model="vendorDetails.vendorCompany">
      </div>
      <div class="col-12 col-md-10" v-else>{{vendorDetails.vendorCompany}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-6 col-md-2">
        <label for="escalated">Escalated</label>
      </div>
      <div class="col-6 col-md-1" v-if="!readOnly">
        <input
          id="escalated"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="escalated-checkbox"
          v-model="vendorDetails.escalated"
          value="false">
      </div>
      <div class="col-6 col-md-4" v-else>{{vendorDetails.escalated}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-6 col-md-2">
        <label for="too">Turn off Offers</label>
      </div>
      <div class="col-6 col-md-1" v-if="!readOnly">
        <input
          id="too"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="too-checkbox"
          v-model="vendorDetails.turnOffOffers"
          value="false"
        />
      </div>
      <div class="col-6 col-md-4" v-else>{{ vendorDetails.turnOffOffers }}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Competence Levels
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-8 col-md-8 multiselect-container">
        <competence-level-selector
          data-e2e-type="competenceSelector"
          placeholder="Select Competence Levels"
          :isDisabled="!canCreateOrEdit"
          v-model="vendorDetails.competenceLevels"/>
      </div>
      <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="manageCompetences"
          @click="manageCompetenceLevels"
        >Manage</button>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Internal Departments</div>
      <div class="col-8 col-md-8 multiselect-container">
        <internal-department-multi-selector
          data-e2e-type="internalDepartmentsSelector"
          :placeholder="canCreateOrEdit ? 'Select Internal Departments' : 'No Internal Departments'"
          title="Internal Departments"
          :isDisabled="!canCreateOrEdit"
          v-model="vendorDetails.internalDepartments"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <label for="phoneNumber">Phone Number</label>
      </div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          id="phoneNumber"
          type="text"
          data-e2e-type="phoneNumber"
          name="phoneNumber"
          class="form-control"
          v-model="vendorDetails.phoneNumber">
      </div>
      <div class="col-12 col-md-10" v-else>{{vendorDetails.phoneNumber}}</div>
    </div>
    <div class="row p-0">
      <div class="col-12">
        <address-information
          data-e2e-type="vendor-address"
          :required="true"
          :disabled="!canCreateOrEdit"
          v-model="vendorDetails.address"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Nationality</div>
      <div class="col-12 col-md-10 multiselect-container">
        <country-selector
          :is-disabled="readOnly"
          data-e2e-type="nationalitySelector"
          v-model="vendorDetails.nationality"
          placeholder="Select Nationality"
          title="Nationality"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2" data-e2e-type="approvalMethodLabel">
        Approval Method
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-12 col-md-10 multiselect-container" v-if="!readOnly">
        <approval-method-selector
          v-model="vendorDetails.approvalMethod"
          placeholder="Select Approval Method"/>
      </div>
      <div class="col-12 col-md-10" v-else>{{vendorDetails.approvalMethod}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Hire Date
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-10 col-md-10 multiselect-container" data-e2e-type="hireDate" v-if="!readOnly">
        <div class="input-group">
          <utc-flatpickr
            v-model="vendorDetails.hireDate"
            :config="utcFlatpickrOptions"
            data-e2e-type="hireDatePicker"
            class="form-control"/>
          <span class="input-group-addon">
            <i class="fas fa-calendar"></i>
          </span>
        </div>
      </div>
      <div class="col-12 col-md-10" v-else>{{vendorDetails.hireDate | localDateTime('MM-DD-YYYY') }}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">OFAC</div>
      <div class="col-12 col-md-3">
        <ofac-selector
          data-e2e-type="ofacSelector"
          placeholder="Select OFAC"
          :is-disabled="!canCreateOrEdit"
          v-model="vendorDetails.ofac"/>
      </div>
    </div>
    <div class="mt-4">
      <h5>Certification details</h5>
      <hr class="my-1" />
      <user-vendor-certification-details
        :readOnly="readOnly"
        v-model="vendorDetails.certifications"/>
    </div>
    <div class="row align-items-center">
      <div class="col-6 col-md-2">
        <label for="hipaa">HIPAA Disclosure Signed</label>
      </div>
      <div class="col-6 col-md-3" v-if="!readOnly">
        <input
          name="hipaa"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="hipaa-checkbox"
          v-model="vendorDetails.hipaa"/>
      </div>
      <div class="col-6 col-md-3" v-else>{{ hipaa }}</div>
      <div class="col-6 col-md-2 offset-md-1">
        <label for="ataCertified">ATA Certified</label>
      </div>
      <div class="col-6 col-md-3" v-if="!readOnly">
        <input
          name="ataCertified"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="ata-certified-checkbox"
          v-model="vendorDetails.ataCertified"/>
      </div>
    </div>
    <div class="row">
      <div class="col-6">
        <div class="row align-items-center">
          <div class="col-4">Minimum hours</div>
          <div class="col-6">
            <min-hours-selector
              data-e2e-type="vendor-min-hours"
              class="form-control"
              v-model="vendorDetails.minimumHours"/>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-4">Gender</div>
          <div class="col-6">
            <simple-basic-select
              data-e2e-type="gender-selector"
              placeholder="Select gender"
              :disabled="!canCreateOrEdit"
              v-model="vendorDetails.gender"
              :options="genderSelectOptions"/>
          </div>
        </div>
        <div class="row">
          <div class="col-4">Country of origin</div>
          <div class="col-6 multiselect-container">
            <country-selector
              :is-disabled="readOnly"
              v-model="vendorDetails.originCountry"
              placeholder="Select country"
              title="Country of origin"
              data-e2e-type="country-of-origin-selector"/>
          </div>
        </div>
      </div>
      <div class="col-6" v-if="canCreateOrEditAll">
        <div class="row">
          <div class="col-4">
            <label for="lawyer">Lawyer</label>
          </div>
          <div class="col-6">
            <input
              name="lawyer"
              type="checkbox"
              class="form-control pts-clickable"
              data-e2e-type="lawyer-checkbox"
              v-model="vendorDetails.isLawyer"/>
          </div>
          <div class="col-4">
            <label for="practicing">Practicing</label>
          </div>
          <div class="col-6">
            <input
              name="practicing"
              type="checkbox"
              class="form-control pts-clickable"
              data-e2e-type="practicing-checkbox"
              v-model="vendorDetails.isPracticing"/>
          </div>
          <div class="col-4">
            <label for="bar-registered">Bar Registered</label>
          </div>
          <div class="col-6">
            <input
              name="bar-registered"
              type="checkbox"
              class="form-control pts-clickable"
              data-e2e-type="bar-registered-checkbox"
              v-model="vendorDetails.isBarRegistered"/>
          </div>
          <div class="col-4">Country of Registration</div>
          <div class="col-6">
            <country-selector
              v-model="selectedRegistrationCountry"
              :available-countries="availableCountries"
              placeholder="Select Country of Registration"
              title="Country of Registration"
              data-e2e-type="registration-country-selector"/>
          </div>
          <div class="col-2 mt-2">
            <button
              class="fas fa-plus"
              title="Add Country of Registration"
              @click="addRegistrationCountry"
              data-e2e-type="registration-country-add-button">
            </button>
          </div>
          <div class="col-12 mt-2 mx-0 px-2" v-for="(country, index) in vendorDetails.registrationCountries" :key="index">
            <div class="row">
              <div class="col-6 offset-4">
                <input type="text" :data-e2e-type="`selected-registration-country-${index}`" class="form-control" :value="country.name" disabled>
              </div>
              <div class="col-2 mt-2">
                <button
                  class="fas fa-close"
                  title="Remove of Registration"
                  @click="removeRegistrationCountry(index)"
                  data-e2e-type="registration-country-remove-button">
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12">
        <h5>Billing Information</h5>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Payment Method
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-8 col-md-3 multiselect-container">
        <payment-method-selector
          data-e2e-type="paymentMethodSelector"
          placeholder="Select Payment Method"
          :disabled="!canCreateOrEdit"
          v-model="vendorDetails.billingInformation.paymentMethod"/>
      </div>
      <div class="col-4 col-md-1 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="managePaymentMethods"
          @click="managePaymentMethods"
        >Manage</button>
      </div>
      <div class="col-12 col-md-2">
        WT Country
      </div>
      <div class="col-12 col-md-3">
        <country-selector
          v-model="vendorDetails.billingInformation.wtCountry"
          :available-countries="availableCountries"
          placeholder="Select Country"
          title="WT Country"
          data-e2e-type="wt-country-selector"/>
      </div>
    </div>
    <div class="row align-items-center checkbox-container">
      <div class="col-12 col-md-2">
        <label for="fixedCost">Fixed Cost</label>
      </div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          id="fixedCost"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="fixed-cost-checkbox"
          v-model="vendorDetails.billingInformation.fixedCost"
          value="true">
      </div>
      <div class="col-12 col-md-1" v-else>{{vendorDetails.billingInformation.fixedCost}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <label for="ptPayOrPayPal">PT Pay/Paypal/Veem</label>
      </div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          id="ptPayOrPayPal"
          type="text"
          data-e2e-type="ptPayOrPayPal"
          name="ptPayOrPayPal"
          class="form-control"
          v-model="vendorDetails.billingInformation.ptPayOrPayPal">
      </div>
      <div class="col-12 col-md-10" v-else>{{vendorDetails.billingInformation.ptPayOrPayPal}}</div>
    </div>
    <div class="row align-items-center checkbox-container">
      <div class="col-6 col-md-2">
        <label for="priorityPay">Priority Pay</label>
      </div>
      <div class="col-6 col-md-1">
        <input
          id="priorityPay"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="priority-payment-checkbox"
          :disabled="readOnly || !canEditPriorityPay"
          v-model="vendorDetails.billingInformation.priorityPayment">
      </div>
      <div class="col-6 col-md-2">
        <label for="wtFeeWaived">WT Fee Waived</label>
      </div>
      <div class="col-6 col-md-1" v-if="!readOnly">
        <input
          id="wtFeeWaived"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="wt-fee-waived-checkbox"
          v-model="vendorDetails.billingInformation.wtFeeWaived"
          value="false">
      </div>
      <div class="col-6 col-md-4" v-else>{{vendorDetails.billingInformation.wtFeeWaived}}</div>
    </div>
    <div class="row align-items-center checkbox-container">
     <div class="col-6 col-md-2"><label for="billsOnHold">Bills on hold</label></div>
      <div class="col-6 col-md-1">
        <input
          id="billsOnHold"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="bills-on-hold-checkbox"
          :disabled="readOnly || !canEditBillsOnHold"
          v-model="vendorDetails.billingInformation.billsOnHold">
      </div>
    </div>
    <div class="row align-items-center checkbox-container">
     <div class="col-2 col-md-2"><label for="flatRate">Flat Rate</label></div>
      <div class="col-2 col-md-1" v-if="!readOnly" :class="{'has-danger': isFlatRateMonthlyBillInvalid}">
        <input
          id="flatRate"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="flat-rate"
          v-model="vendorDetails.billingInformation.flatRate"
          value="false">
        <p class="form-control-feedback ml-2" v-if="isFlatRateMonthlyBillInvalid">
          User is a 'Monthly Bill' Vendor
        </p>
      </div>
      <div class="col-2 col-md-4" v-else>
        {{vendorDetails.billingInformation.flatRate}}
      </div>
      <div class="col-2 col-md-2" v-if="vendorDetails.billingInformation.flatRate">
        <label for="flatRateAmount">Flat Rate Amount</label>
      </div>
      <div class="col-2 col-md-4">
        <currency-input
          v-if="!readOnly"
          v-show="vendorDetails.billingInformation.flatRate"
          class="form-control form-control-sm"
          v-model="vendorDetails.billingInformation.flatRateAmount"
          :precision="flatRateAmountPrecision"
          :currency="null"
          data-e2e-type="flat-rate-amount">
        </currency-input>
        <div v-else>
          {{vendorDetails.billingInformation.flatRateAmount}}
        </div>
      </div>
    </div>
    <div class="row align-items-center checkbox-container">
      <div class="col-2 col-md-2"><label for="monthlyBill">Monthly Bill</label></div>
      <div class="col-2 col-md-1" :class="{'has-danger': isFlatRateMonthlyBillInvalid}">
        <input
          id="monthlyBill"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="has-monthly-bill"
          :disabled="readOnly || !canEditMonthlyBill"
          v-model="vendorDetails.billingInformation.hasMonthlyBill">
        <p class="form-control-feedback ml-2" v-if="isFlatRateMonthlyBillInvalid">
          User is a Flat Rate Vendor
        </p>
      </div>
      <div class="col-2 col-md-2" v-if="vendorDetails.billingInformation.hasMonthlyBill">
        <label for="billCreationDay">Bill Creation Day</label>
      </div>
      <div class="col-2 col-md-4" :class="{'has-danger': errors.first('billCreationDay')}">
        <input
          id="billCreationDay"
          name="billCreationDay"
          type="number"
          min="1"
          max="28"
          class="form-control form-control-sm"
          data-e2e-type="bill-creation-day"
          :disabled="readOnly || !canEditMonthlyBill"
          v-validate="'numeric|min_value:1|max_value:28'"
          v-model="vendorDetails.billingInformation.billCreationDay"
          v-show="vendorDetails.billingInformation.hasMonthlyBill">
        <p class="form-control-feedback ml-2" v-if="errors.first('billCreationDay')">
          Select number between 1 and 28
        </p>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Billing Terms
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-8 col-md-8 multiselect-container">
        <billing-term-selector
          data-e2e-type="billingTermsSelector"
          placeholder="Select Terms"
          :disabled="readOnly"
          v-model="vendorDetails.billingInformation.billingTerms"/>
      </div>
      <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="manageBillingTerms"
          @click="manageBillingTerms"
        >Manage</button>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2"><label for="paymentFrequency">Payment frequency</label></div>
      <div class="col-8 col-md-8" v-if="!readOnly" :class="{'has-danger': errors.has('paymentFrequency')}">
        <input
          id="paymentFrequency"
          type="text"
          name="paymentFrequency"
          class="form-control"
          data-e2e-type="payment-frequency"
          min="0"
          v-validate="'numeric'"
          v-model.number="vendorDetails.billingInformation.paymentFrequency">
        <p class="form-control-feedback" v-if="errors.has('paymentFrequency')" data-e2e-type="payment-frequency-error-message">
          Please Enter Numeric Value
        </p>
      </div>
      <div class="col-6 col-md-4" v-else>
        {{vendorDetails.billingInformation.paymentFrequency}}
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Tax Form <span class="pts-required-field">*</span></div>
      <div class="col-8 col-md-8 multiselect-container">
        <tax-form-multi-selector
          data-e2e-type="taxFormSelector"
          placeholder="Select Tax Form"
          :isDisabled="!canCreateOrEdit"
          v-model="vendorDetails.billingInformation.taxForm"/>
      </div>
      <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="manageTaxForms"
          @click="manageTaxForms"
        >Manage</button>
      </div>
    </div>
    <div class="row align-items-center" v-show="has1099EligibleTaxForm">
      <div class="col-6">
        <div class="row align-items-center">
          <div class="col-12 col-md-4"><span v-if="!readOnly" class="pts-required-field">*</span>Form 1099 Type</div>
          <div class="col-12 col-md-8" v-if="!readOnly">
            <simple-basic-select
              :class="{'has-danger': !isValidForm1099Type}"
              data-e2e-type="form1099-type-select"
              v-model="vendorDetails.billingInformation.form1099Type"
              class="non-focusable"
              :options="form1099Options"
              title="Form 1099 Type list"/>
            <div class="form-control-feedback" v-show="!isValidForm1099Type">This field is mandatory.</div>
          </div>
          <div class="col-12 col-md-10" v-else>{{vendorDetails.billingInformation.form1099Type}}</div>
        </div>
      </div>
      <div class="col-6">
        <div class="row align-items-center">
          <div class="col-12 col-md-4"><span v-if="!readOnly" class="pts-required-field">*</span>Form 1099 Box</div>
          <div class="col-12 col-md-8" v-if="!readOnly">
            <simple-basic-select
              data-e2e-type="form1099-box-select"
              v-model="vendorDetails.billingInformation.form1099Box"
              class="non-focusable"
              :class="{'has-danger': !isValidForm1099Box}"
              :options="form1099BoxOptions"
              title="Form 1099 Box list"/>
            <div class="form-control-feedback" v-show="!isValidForm1099Box">This field is mandatory.</div>
          </div>
          <div class="col-12 col-md-10" v-else>{{vendorDetails.billingInformation.form1099Box}}</div>
        </div>
      </div>
    </div>
    <div class="row align-items-center" v-if="showTaxId">
      <div class="col-12 col-md-2">
        Tax ID
        <span class="pts-required-field" v-if="isTaxIdRequired">*</span>
      </div>
      <div class="col-8 col-md-3" :class="{'has-danger': isTaxIdRequired && !isTaxIdValid}">
        <masked-tax-id-input
          data-e2e-type="taxId"
          :taxForm="vendorDetails.billingInformation.taxForm"
          :readOnly="readOnly"
          class="form-control"
          :class="{'form-control-danger': isTaxIdRequired && !isTaxIdValid}"
          v-model="vendorDetails.billingInformation.taxId"
          :entityId="this.user._id"/>
        <span
          class="form-control-feedback"
          v-if="isTaxIdRequired && !isTaxIdValid"
        >Tax ID does not match the required format.</span>
      </div>
      <div class="col-4 col-md-7 text-muted" v-if="!readOnly">xxx-xx-xxxx/xx-xxxxxxx</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        Currency
        <span class="pts-required-field">*</span>
      </div>
      <div class="col-12 col-md-10 multiselect-container">
        <currency-selector
          v-model="vendorDetails.billingInformation.currency"
          placeholder="Select Currency"
          :isDisabled="!canCreateOrEdit"
          data-e2e-type="currencySelector"
          title="Currency list"
          :formatOption="currencyFormat"
          @options-loaded="onCurrenciesLoaded" />
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Bill Payment Notes</div>
      <div
        class="col-12 col-md-10 editor-container"
        data-e2e-type="billPaymentNotesContainer"
        v-if="!readOnly">
        <rich-text-editor
          v-model="vendorDetails.billingInformation.billPaymentNotes"
          placeholder="Bill Payment Notes"/>
      </div>
      <div class="col-12 col-md-8" v-else>
        <div v-html="vendorDetails.billingInformation.billPaymentNotes"></div>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2 mt-2">Vendor Bill Balances</div>
      <div class="col-12 col-md-10" data-e2e-type="vendor-bill-balance" >
        <span>{{ vendorDetails.billBalance | toCurrency }}</span>
      </div>
      <div class="col-12 col-md-2 mt-2">Vendor Debit Memo Available</div>
      <div class="col-12 col-md-10" data-e2e-type="vendor-debit-memo-available" >
        <span>{{ vendorDetails.debitMemoAvailable | toCurrency }}</span>
      </div>
      <div class="col-12 col-md-2 mt-2">Vendor Credit Memo Available</div>
      <div class="col-12 col-md-10" data-e2e-type="vendor-credit-memo-available" >
        <span>{{ vendorDetails.creditMemoAvailable | toCurrency }}</span>
      </div>
      <div class="col-12 col-md-2 mt-2">Vendor Total Balance Amount</div>
      <div class="col-12 col-md-10" data-e2e-type="vendor-total-balance-amount" >
        <span>{{ vendorDetails.totalBalance | toCurrency }}</span>
      </div>
    </div>
    <div class="row align-items-center mt-2" v-show="canReadFiles">
      <div class="col-12">
        <h5>File Management</h5>
      </div>
      <div
        class="col-12"
        :class="{'has-danger': !vendorDetails.hiringDocuments.length}"
        v-if="!vendorDetails.hiringDocuments.length">
        <div class="form-control-feedback">At least one file is required</div>
      </div>
      <div class="col-12 p-md-2" data-e2e-type="userFileManagement">
        <file-management v-model="vendorDetails.hiringDocuments" :userId="user._id"></file-management>
      </div>
    </div>
    <div class="row align-items-center" v-if="canReadRates">
      <div class="col-12 mt-4">
        <div class="cotainer-fluid pts-no-padding" data-e2e-type="user-rates">
          <rate-grid
            :canEdit="canEditRates"
            :shouldCollapseAllRates="shouldCollapseAllRates"
            :userId="user._id"
            :user-abilities="user.abilities"
            :user-internal-departments="user.vendorDetails.internalDepartments"
            :user-cat-tools="user.catTools"
            :user-language-combinations="user.languageCombinations"
            :abilities="abilities"
            @rates-manage-entity="onManageRateEntity"
            @vendor-minimum-charge-manage="onManageVendorMinimumCharge"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./user-vendor-details.js"></script>
