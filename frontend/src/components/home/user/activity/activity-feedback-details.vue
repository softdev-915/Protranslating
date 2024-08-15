<template>
    <div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Internal Departments</div>
            <div class="col-8 col-md-5 multiselect-container" :class="{ 'has-danger': !isValidInternalDepartments }">
                <internal-department-multi-selector
                  :placeholder="canCreateOrEdit ? 'Select Internal Departments' : 'No Internal Departments'"
                  title="Internal Departments"
                  :isDisabled='!canCreateOrEdit'
                  v-model="activity.feedbackDetails.internalDepartments"
                  data-e2e-type="internalDepartments">
                </internal-department-multi-selector>
                <div class="form-control-feedback" v-show="!isValidInternalDepartments">Select at least one Internal Department.</div>
            </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Company</div>
          <div class="col-8 col-md-5" v-if="canCreateOrEdit">
             <company-ajax-basic-select
                :selected-option="companySelected"
                @select="onCompanySelected"
                :disabled="!canCreateOrEdit"
                data-e2e-type="company"
                placeholder="">
              </company-ajax-basic-select>
          </div>
          <div class="col-8 col-md-5" data-e2e-type="company-read-only" v-else>
            {{ companySelected.text }}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Request Numbers</div>
          <div class="col-8 col-md-5 multiselect-container ">
            <request-ajax-multi-select
              :show-missing-options="true"
              title="Requests"
              :filter="{ companyName: companyFilter }"
              :isDisabled="!canCreateOrEdit"
              :selected-options="requestsSelected"
              @select="onRequestSelected"
              data-e2e-type="request-ajax-multi-select">
            </request-ajax-multi-select>
          </div>
        </div>
        <div class="row align-items-center" id="incidentDate">
          <div class="col-12 col-md-2">Incident Date</div>
          <div class="col-6 col-md-4" v-if="canCreateOrEdit">
            <div class="input-group">
              <utc-flatpickr
                v-model="activity.feedbackDetails.incidentDate"
                :config="{ allowInput: true }"
                :format="'YYYY-MM-DD HH:mm'"
                data-e2e-type="incidentDatePicker"
                class="form-control" />
              <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
            </div>
          </div>
          <div class="col-6 col-md-4" v-else>
              {{ activity.feedbackDetails.incidentDate | localDateTime('YYYY-MM-DD HH:mm') }}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Subject</div>
          <div class="col-12 col-md-6" v-if="canCreateOrEdit" :class="{'has-danger': !isValidSubject}">
            <input
              type="text"
              name="subject"
              class="form-control" :class="{'form-control-danger': errors.has('subject')}"
              v-model.trim="activity.subject" v-validate="'required'"
              data-e2e-type="subject"/>
            <div class="form-control-feedback" v-show="!isValidSubject">Subject field is required.</div>
          </div>
          <div class="col-7 col-md-7" :class="{'has-danger': !isValidSubject}" v-else>
                {{activity.subject}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Comments</div>
          <div class="col-12 col-md-10 multiselect-container" data-e2e-type="comments-container" v-if="canCreateOrEdit" :class="{'has-danger': !isValidComments}">
            <rich-text-editor
              v-model.trim="activity.comments"
              placeholder="">
            </rich-text-editor>
            <div class="form-control-feedback" v-show="!isValidComments">Comments field must contain at least one and less then 100 characters.</div>
          </div>
          <div class="col-12 col-md-10" v-else :class="{'has-danger': !isValidComments}" v-html="activity.comments">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Tags</div>
          <div class="col-4 col-md-3" :class="{'has-danger': !isValidTags}">
            <activity-tags-selector
              v-model="activity.tags"
              :disabled="!canCreateOrEdit || !isNew">
              </activity-tags-selector>
            <div class="form-control-feedback" v-show="!isValidTags">Select at least one tag.</div>
          </div>
          <div class="col-3 col-md-2 p-0 mobile-align-right" v-if="canCreateOrEdit">
            <button class="btn btn-primary" id="manageTags" @click="manageTags">Manage</button>
          </div>
          <div class="col-3 col-md-2 p-0 align-right" data-e2e-type="nccc-container"><span class="pts-required-field" v-if="nonComplianceClientComplaintCategoryRequired">* </span>NC/CC Category</div>
          <div class="col-2 col-md-2 p-0 align-right" v-if="canCreateOrEdit" :class="{'has-danger': !isValidNonComplianceClientComplaintCategory}">
            <simple-basic-select
              data-e2e-type="nonComplianceClientComplaintCategorySelector"
              v-model="activity.feedbackDetails.nonComplianceClientComplaintCategory"
              id="nonComplianceClientComplaintCategorySelector"
              :options="nonComplianceClientComplaintCategorySelectOptions"
              title="nonComplianceClientComplaintCategory"/>
            <div class="form-control-feedback" v-show="!isValidNonComplianceClientComplaintCategory">NC CC CATEGORY is required.</div>
          </div>
          <div class="col-2 col-md-2 p-0 align-right" v-else>
            {{activity.feedbackDetails.nonComplianceClientComplaintCategory}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Status</div>
          <div class="col-4 col-md-3" :class="{'has-danger': !isValidStatus}">
            <simple-basic-select
              data-e2e-type="statusSelector"
              v-model="activity.feedbackDetails.status"
              id="statusSelector"
              title="status"
              :disabled="!canCreateOrEdit"
              :options="statusSelectOptions"
              :format-option="formatStatusSelectOption"/>
            <div class="form-control-feedback" v-show="!isValidStatus">Status field is required.</div>
          </div>
          <div class="col-3 col-md-2 offset-2 p-0 align-right">CAR #</div>
            <div class="col-2 col-md-2 p-0 align-right" v-if="canCreateOrEdit">
              <input
                type="text"
                name="car"
                class="form-control"
                v-model.trim="activity.feedbackDetails.car"
                data-e2e-type="car"/>
            </div>
          <div class="col-2 col-md-2 p-0 align-right" v-else>
            {{activity.feedbackDetails.car}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container mt-3 mb-3" v-if="canCreateOrEdit">
          <div class="col-11 col-md-2">Escalated</div>
          <div class="col-1 col-md-2">
            <input type="checkbox" class="form-control pts-clickable" v-model="activity.feedbackDetails.escalated" value="true" data-e2e-type="activity-escalated-checkbox"/>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12" data-e2e-type="activityFileManagement">
          <activity-file-management
            v-model="activity.feedbackDetails.documents"
            :activityId="activity._id"
            @documents-updated="onDocumentsUpdate">
          </activity-file-management>
          </div>
        </div>
    </div>
</template>

<script src="./activity-feedback-details.js"></script>
