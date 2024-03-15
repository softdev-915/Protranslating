<template>
  <div class="row py-0 px-3" data-e2e-type="rate-detail" @click="toggleCollapse">
    <div
      class="col-2 px-0"
      :class="{'has-danger': !isValidAbility}"
      data-e2e-type="ability-container">
      <div class="row px-0 mx-0 align-items-center">
        <div class="col-xs-1" v-if="canEdit">
          <input
            type="checkbox"
            v-model="rateSelected"
            data-e2e-type="rate-select-checkbox">
        </div>
        <ability-selector
          v-if="!isCollapsed"
          v-model="selectedAbility"
          placeholder="Ability"
          title="Abilities list"
          class="ml-2"
          :class="{'has-danger': isDuplicate || !isValidAbility}"
          data-e2e-type="rate-ability"
          :disabled="!canEdit"
          :filter="abilityFilter"
          :fetch-on-created="false"/>
        <div
          v-else
          class="ml-2 ability-read-only"
          :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
          data-e2e-type="rate-ability-read-only">
          {{ abilityReadOnly }}
        </div>
      </div>
    </div>
    <div class="col px-0">
      <language-selector
        v-if="!isCollapsed"
        title="Languages list"
        placeholder="Src Language"
        v-model="selectedSourceLanguage"
        :isDisabled="!canEdit"
        :data-e2e-type="'rate-source-language'"
        :excludedLanguages="[selectedTargetLanguage]"
        :class="{'has-danger': isDuplicate}"
        :mandatory="isLanguageCombinationRequired"
        :filter-option="sourceLanguageFilterOption"
        :fetch-on-created="false"/>
      <div
        v-else
        data-e2e-type="rate-source-language-read-only"
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]">
        {{ sourceLanguageReadOnly }}
      </div>
    </div>    
    <div class="col px-0">
      <language-selector
        v-if="!isCollapsed"
        title="Languages list"
        placeholder="Tgt Language"
        v-model="selectedTargetLanguage"
        :isDisabled="!canEdit"
        :mandatory="isLanguageCombinationRequired"
        :data-e2e-type="'rate-target-language'"
        :class="{'has-danger': isDuplicate}"
        :filter-option="targetLanguageFilterOption"
        :excludedLanguages="[selectedSourceLanguage]"
        :fetch-on-created="false"/>
      <div
        v-else
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
        data-e2e-type="rate-target-language-read-only">
        {{ targetLanguageReadOnly }}
      </div>
    </div>
    <div class="col px-0">
      <internal-department-selector
        v-if="!isCollapsed"
        :format-option="formatInternalDepartmentSelectOption"
        :empty-option="{ text: '', value: {} }"
        v-model="selectedInternalDepartment"
        placeholder="Internal department"
        data-e2e-type="rate-detail-internal-department"
        :filter-option="internalDepartmentFilterOption"
        :isDisabled="!canEdit"
        :class="{'has-danger': isDuplicate}"
        :fetch-on-created="false"/>
      <div
        v-else
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
        data-e2e-type="rate-detail-internal-department-read-only">
        {{ internalDepartmentReadOnly }}
      </div>
    </div>
    <div class="col px-0">
      <cat-tool-select
        v-if="!isCollapsed"
        placeholder="Tool"
        title="Tool list"
        v-model="selectedCatTool"
        :show-deleted="false"
        :filter="catToolFilter"
        :class="{'has-danger': isDuplicate}"
        data-e2e-type="rate-detail-cat-tool"
        :fetch-on-created="false"/>
      <div
        v-else
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
        data-e2e-type="rate-detail-cat-tool-read-only">
        {{ selectedCatTool }}
      </div>
    </div>
    <div class="col px-0">
      <company-ajax-basic-select
        v-if="!isCollapsed"
        placeholder="Company"
        data-e2e-type="rate-detail-company"
        :selected-option="selectedCompany"
        :isDisabled="!canEdit"
        :class="{'has-danger': isDuplicate}"
        :fetch-on-created="false"
        @select="onCompanySelected"/>
      <div
        v-else
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
        data-e2e-type="rate-detail-company-read-only">
        {{ companyReadOnly }}
      </div>
    </div>
    <div class="col-4 px-0">
      <rate-sub-detail
        :is-collapsed="isCollapsed"
        v-for="(r, rIndex) in rate.rateDetails"
        :key="r.key"
        v-model="rate.rateDetails[rIndex]"
        :rate="rate"
        :rateDetailIndex="rIndex"
        class="rate-sub-detail-container"
        :class="[{'is-draft': isDraft}, {'is-duplicate': isDuplicate}]"
        :canEdit="canEdit"
        :is-duplicate="isDuplicate"
        @add-rate-detail="onAddRateDetail"
        @delete-rate-detail="onDeleteRateDetail"
        @rate-sub-detail-validation="onRateSubDetailValidation"
      />
    </div>
    <div class="col px-0 pl-2">
      <div v-if="!isCollapsed" class="h-100 d-flex">
        <button
          data-e2e-type="vendor-rate-save-button"
          tabindex="-1"
          title="Save rate"
          :disabled="!isValid || isDuplicate"
          class="rate-action-button primary fas fa-check"
          @click.stop="saveRate">
        </button>
        <button
          data-e2e-type="vendor-rate-cancel-button"
          tabindex="-1"
          title="Cancel rate"
          class="rate-action-button secondary fas fa-close ml-1"
          @click.stop="cancelRate">
        </button>
      </div>
      <div v-else-if="isDuplicate" class="d-flex align-items-center action-text is-duplicate">Duplicate</div>
      <div v-else-if="isDraft" class="d-flex align-items-center action-text">Draft</div>
    </div>
  </div>
</template>

<script src="./rate-detail.js"></script>
<style lang="scss" scoped src="./rate-detail.scss"></style>
