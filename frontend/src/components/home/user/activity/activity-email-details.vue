<template>
  <div>
    <div class="row align-items-center checkbox-container">
      <div class="col-12 col-md-2">Email Activity Imported?</div>
      <div class="col-12 col-md-10">
        <input
          v-model="activity.emailDetails.isImported"
          type="checkbox"
          class="form-control pts-clickable"
          data-e2e-type="activity-imported-checkbox"
          disabled
        >
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">From</div>
      <div class="col-12 col-md-8">
        <input type="text"
          class="form-control cursor-pointer disabled"
          @click="navigateUserGrid({ text: activity.emailDetails.from })"
          @mousedown="$event.preventDefault()"
          v-model.trim="activity.emailDetails.from"
          readonly
          data-e2e-type="from">
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">To</div>
      <div class="col-12 col-md-8">
        <multi-select
          :options="toOptions"
          :selected-options="toOptions"
          :isDisabled="true"
          :selectedOptionsClickable="true"
          @selected-option-clicked="navigateUserGrid"
          data-e2e-type="to">
        </multi-select>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Cc</div>
      <div class="col-12 col-md-8">
        <comma-separated-email-selector
          v-if="isInvoice"
          v-model="activity.emailDetails.cc"
          @email-selector-validated="onCcValidated"
          data-e2e-type="cc"
        />
        <multi-select
          v-else
          :options="ccOptions"
          :selected-options="ccOptions"
          :isDisabled="true"
          :selectedOptionsClickable="true"
          @selected-option-clicked="navigateUserGrid"
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
          :selectedOptionsClickable="true"
          @selected-option-clicked="navigateUserGrid"
          data-e2e-type="bcc">
        </multi-select>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Internal departments</div>
      <div class="col-12 col-md-8" :class="{ 'has-danger': !isValidInternalDepartments }">
        <internal-department-multi-selector
          v-model="activity.emailDetails.internalDepartments"
          :is-disabled="activity.emailDetails.isQuote"
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
      <div class="col-8 col-md-5" v-if="canCreate || canEdit">
          <company-ajax-basic-select
            :selected-option="companySelected"
            @select="onCompanySelected"
            data-e2e-type="company"
            :fetch-on-created="false"
            :is-disabled="isInvoice"
            placeholder="Company">
          </company-ajax-basic-select>
      </div>
      <div class="col-8 col-md-5" data-e2e-type="company-read-only" v-else>
        {{ companySelected.text }}
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Opportunities</div>
      <div class="col-12 col-md-8">
        <opportunity-ajax-multi-select
          :selected-options="opportunitySelected"
          :default-option="opportunityNaOption"
          @select="onOpportunitySelected"
          :filter="{ companyText: companyFilter }"
          :disabled="isOpportunitySelectDisabled"
          data-e2e-type="opportunities" />
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Requests Numbers</div>
      <div class="col-12 col-md-8">
        <request-ajax-multi-select
          :selected-options="requestSelected"
          @select="onRequestSelected"
          :filter="{ companyName: companyFilter, opportunityNo: opportunityFilter }"
          :is-disabled="isRequestSelectDisabled"
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
          data-e2e-type="subject"
          :disabled="!canEditSubject"
        >
      </div>
    </div>
    <div class="row align-items-center" v-if="isInvoice">
      <div class="col-12 col-md-2">Email Template</div>
      <div class="col-12 col-md-8">
        <input
          type="text"
          class="form-control"
          data-e2e-type="email-template-name"
          readonly
          :value="activity.emailDetails.emailTemplate"
        >
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Body</div>
      <div class="col-12 col-md-8">
        <rich-text-editor
          v-if="activity.emailDetails.isInvoice && !activity.emailDetails.isImported"
          v-model.trim="activity.emailDetails.htmlBody"
          placeholder="HTML Body"
          data-e2e-type="body"
        />
        <div
          class="form-control html-view"
          v-else-if="activity.emailDetails.htmlBody">
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
          v-model.trim="activity.emailDetails.textBody"
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
      <div class="col-12 col-md-2">
        <span v-if="!isInvoice" class="pts-required-field">*</span>Comments
      </div>
      <div class="col-12 col-md-8" data-e2e-type="comments-container" :class="{ 'has-danger': !areValidComments }">
        <rich-text-editor
          v-model.trim="activity.comments"
          placeholder="Comments"
          data-e2e-type="rich-text-editor" />
        <div class="form-control-feedback" v-show="!areValidComments" >Comments field must contain less then 100 characters.</div>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">
        <span class="pts-required-field">*</span>Tags
      </div>
      <div class="col-12 col-md-8" :class="{ 'has-danger': !isValidTags }">
        <activity-tags-selector v-model="activity.tags" :requiredTags="requiredTags" />
        <div class="form-control-feedback" v-show="!isValidTags">
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
    <div class="row align-items-center" v-if="!isNew">
      <div class="col-12 col-md-2">Failed emails</div>
      <div class="col-12 col-md-8" data-e2e-type="activity-failed-emails">
        {{ failedEmails }}
      </div>
    </div>
    <div class="row align-items-center" v-if="isInvoice">
      <div class="col-12 col-md-2">Invoice Number</div>
      <div class="col-12 col-md-8">
        <input
          type="text"
          class="form-control"
          data-e2e-type="invoice-no"
          readonly
          :value="activity.emailDetails.invoiceNo"
        >
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

