<template>
  <div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">From</div>
      <div class="col-12 col-md-8">
        <input
          type="text"
          :readonly="activity.emailDetails.isQuoteSent"
          :class="{ disabled: activity.emailDetails.isQuoteSent }"
          class="form-control"
          :value="activity.emailDetails.from"
          data-e2e-type="from"
        >
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">To</div>
      <div class="col-12 col-md-8">
        <multi-select
          :options="toOptions"
          :selected-options="toOptions"
          :is-disabled="true"
          :selectedOptionsClickable="false"
          data-e2e-type="to">
        </multi-select>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Cc</div>
      <div class="col-12 col-md-8">
        <multi-select
          :options="ccOptions"
          :selected-options="ccOptions"
          :is-disabled="true"
          :selectedOptionsClickable="false"
          data-e2e-type="cc">
        </multi-select>
      </div>
    </div>
    <div class="row align-items-center" v-if="bccOptions.length > 0">
      <div class="col-12 col-md-2">Bcc</div>
      <div class="col-12 col-md-8">
        <multi-select
          :options="bccOptions"
          :selected-options="bccOptions"
          :is-disabled="true"
          :selectedOptionsClickable="false"
          data-e2e-type="bcc">
        </multi-select>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Internal departments</div>
      <div class="col-12 col-md-8" :class="{ 'has-danger': !isValidInternalDepartments }">
        <internal-department-multi-selector
          :value="activity.emailDetails.internalDepartments"
          :is-disabled="true"
          data-e2e-type="internalDepartments" />
        <div
          class="form-control-feedback"
          v-show="!isValidInternalDepartments">
            Enter at least one Internal Department.
        </div>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Company</div>
      <div class="col-8 col-md-5" data-e2e-type="company-read-only">
        {{ companySelected.text }}
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Opportunities</div>
      <div class="col-12 col-md-8">
        <opportunity-ajax-multi-select
          :selected-options="opportunitySelected"
          :default-option="opportunityNaOption"
          :filter="{ companyText: companyFilter }"
          :disabled="true"
          data-e2e-type="opportunities" />
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Requests Numbers</div>
      <div class="col-12 col-md-8">
        <request-ajax-multi-select
          :selected-options="requestSelected"
          :filter="{ companyName: companyFilter, opportunityNo: opportunityFilter }"
          :is-disabled="true"
          :allowEmpty="false"
          data-e2e-type="request-ajax-multi-select"/>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Company Status</div>
      <div class="col-12 col-md-8" data-e2e-type="companyStatus">
        {{ companyStatus }}
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Subject</div>
      <div class="col-12 col-md-8">
        <input
          type="text"
          class="form-control"
          v-model="activity.subject"
          data-e2e-type="subject">
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Body</div>
      <div class="col-12 col-md-8">
        <div
          class="form-control html-view"
          v-if="activity.emailDetails.htmlBody">
          <iframe
            :src="htmlSrc"
            frameBorder="0">
          </iframe>
        </div>
        <textarea
          v-else
          class="form-control pts-not-allowed"
          :disabled="true"
          style="resize: none;"
          rows="10"
          :value="activity.emailDetails.textBody"
          data-e2e-type="body">
        </textarea>
      </div>
    </div>
    <div class="row align-items-center" :class="{'blur-loading': attachmentsLoading}">
      <div class="col-12 col-md-2">Embedded Attachments</div>
      <div
        class="col-12 col-md-8"
        :class="{ 'blur-loading-row': attachmentsLoading }"
        data-e2e-type="activity-attachments">
        <request-files
          :urlResolver="documentUrlResolver()"
          :entityId="activity._id"
          :visibleColumns="requestFilesConfig.visibleColumns"
          :documents="activity.emailDetails.embeddedAttachments" />
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Comments</div>
      <div class="col-12 col-md-8" data-e2e-type="comments-container">
        <rich-text-editor
          v-model.trim="activity.comments"
          placeholder="Comments"
          data-e2e-type="rich-text-editor" />
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Tags</div>
      <div class="col-12 col-md-8" :class="{ 'has-danger': !isValidTags }">
        <activity-tags-selector v-model="activity.tags">
        </activity-tags-selector>
        <div class="form-control-feedback"
          v-show="!isValidTags">
            Select at least one tag.
        </div>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Scheduled at</div>
      <div class="col-12 col-md-8">
        <div class="input-group" data-e2e-type="scheduledAt">
          {{ activity.emailDetails.scheduledAt | localDateTime('YYYY-MM-DD HH:mm') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  div.html-view {
    height: 300px;
  }
  .html-view > iframe {
    width: 100%;
    height: 100%;
  }
</style>

<script src="./activity-email-details.js"></script>
<style scoped src="./activity-email-details.scss" lang="scss"></style>
