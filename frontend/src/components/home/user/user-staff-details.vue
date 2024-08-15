<template>
  <div class="container-fluid p-0">
    <div class="row align-items-center checkbox-container mt-3 mb-3">
      <div class="col-11 col-md-2">
        <label for="user-outlier">Outlier</label>
      </div>
      <div class="col-1 col-md-1">
        <input
          type="checkbox"
          id="user-outlier"
          class="form-control pts-clickable"
          v-model="staffDetails.outlier"
          data-e2e-type="user-outlier-checkbox"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Competence Levels</div>
      <div class="col-8 col-md-5 multiselect-container">
        <competence-level-selector
          data-e2e-type="competenceSelector"
          placeholder="Select Competence Levels"
          v-model="staffDetails.competenceLevels"
          :isDisabled="readOnly"
          :fetch-on-created="false"/>
      </div>
      <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="manageCompetences"
          @click="manageCompetenceLevels"
        >Manage</button>
      </div>
      <div class="col-12 col-md-2">Remote Employee</div>
      <div class="col-12 col-md-1" v-if="!readOnly">
        <input
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="remote-checkbox"
          v-model="staffDetails.remote"
          value="true"/>
      </div>
      <div class="col-12 col-md-1" v-else>{{staffDetails.remote}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Phone Number</div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          type="text"
          data-e2e-type="phoneNumber"
          name="phoneNumber"
          class="form-control"
          v-model="staffDetails.phoneNumber"/>
      </div>
      <div class="col-12 col-md-10" v-else>{{staffDetails.phoneNumber}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Job Title</div>
      <div class="col-12 col-md-10" v-if="!readOnly">
        <input
          type="text"
          data-e2e-type="jobTitle"
          name="jobTitle"
          class="form-control"
          v-model="staffDetails.jobTitle"/>
      </div>
      <div class="col-12 col-md-10" v-else>{{staffDetails.jobTitle}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">LSP Internal Departments</div>
      <div class="col-8 col-md-5 multiselect-container">
        <internal-department-multi-selector
          title="Internal Departments"
          data-e2e-type="internalDepartmentsSelector"
          :placeholder="canCreateOrEdit ? 'Select Internal Departments' : 'No Internal Departments'"
          :isDisabled="readOnly"
          v-model="staffDetails.internalDepartments"/>
      </div>
      <div class="col-4 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
        <button
          class="btn btn-primary"
          data-e2e-type="manageInternalDepartments"
          @click="manageInternalDepartments()"
        >Manage</button>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <span data-e2e-type="approvalMethodLabel">
          Approval Method
          <span class="pts-required-field">*</span>
        </span>
      </div>
      <div class="col-12 col-md-10 multiselect-container" v-if="!readOnly">
        <approval-method-selector v-model="staffDetails.approvalMethod"></approval-method-selector>
      </div>
      <div class="col-12 col-md-10" v-else>{{staffDetails.approvalMethod}}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <span data-e2e-type="hireDateLabel">
          Hire Date
          <span class="pts-required-field">*</span>
        </span>
      </div>
      <div class="col-10 col-md-10 multiselect-container" data-e2e-type="hireDate" v-if="!readOnly">
        <div class="input-group">
          <utc-flatpickr
            v-model="staffDetails.hireDate"
            :config="utcFlatpickrOptions"
            data-e2e-type="hireDatePicker"
            class="form-control"/>
          <span class="input-group-addon">
            <i class="fas fa-calendar"></i>
          </span>
        </div>
      </div>
      <div class="col-12 col-md-10" v-else>{{staffDetails.hireDate | localDateTime('MM-DD-YYYY') }}</div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">OFAC</div>
      <div class="col-12 col-md-3">
        <ofac-selector
          data-e2e-type="ofacSelector"
          placeholder="Select OFAC"
          :is-disabled="!canCreateOrEdit"
          v-model="staffDetails.ofac"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Comments</div>
      <div class="col-12 col-md-10 multiselect-container" id="commentsContainer" v-if="!readOnly">
        <rich-text-editor v-model.trim="staffDetails.comments" placeholder="Comments"></rich-text-editor>
      </div>
      <div class="col-12 col-md-10" v-else>
        <div v-html="staffDetails.comments"></div>
      </div>
    </div>

    <div class="row align-items-center" v-show="canReadFiles">
      <div class="col-12">
        <h5>File Management</h5>
      </div>
      <div class="col-12" data-e2e-type="userFileManagement">
        <file-management v-model="staffDetails.hiringDocuments" :userId="user._id"></file-management>
      </div>
    </div>
    <div class="row align-items-center" v-if="canReadRates">
      <div class="col-12 mt-4 pl-0">
        <div class="container-fluid pts-no-padding" data-e2e-type="user-rates">
          <rate-grid
            :canEdit="canEditRates"
            v-model="staffDetails.rates"
            :shouldCollapseAllRates="shouldCollapseAllRates"
            @rates-manage-entity="onManageRateEntity"
            @rates-validation="onRatesValidation"
            :userId="user._id"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./user-staff-details.js"></script>
