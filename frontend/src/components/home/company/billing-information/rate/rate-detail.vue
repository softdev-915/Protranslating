<template>
  <div class="row p-0" data-e2e-type="rate-detail">
    <div class="col-md-5 rate-detail-row" @click="toggleCollapse($event)">
      <div class="row pl-0 ml-0 align-items-center">
        <div class="col-xs-1" v-if="canEdit">
          <input
            type="checkbox"
            v-model="rateSelected"
            data-e2e-type="rate-select-checkbox">
        </div>
        <language-selector
          v-if="!isCollapsed"
          v-model="selectedSourceLanguage"
          :mandatory="isLanguageCombinationRequired"
          data-e2e-type="rate-source-language"
          placeholder="Source language"
          :excludedLanguages="[selectedTargetLanguage]"
          :custom-class="'col'"
          :fetch-on-created="false"
          title="Languages list"/>
        <div data-e2e-type="rate-source-language-read-only" class="col" v-else>{{ _.get(selectedSourceLanguage, 'name', '') }}</div>
        <language-selector
          v-if="!isCollapsed"
          v-model="selectedTargetLanguage"
          data-e2e-type="rate-target-language"
          placeholder="Target language"
          :mandatory="isLanguageCombinationRequired"
          :excludedLanguages="[selectedSourceLanguage]"
          :customClass="'col'"
          :fetch-on-created="false"
          title="Languages list"/>
        <div data-e2e-type="rate-target-language-read-only" class="col" v-else>{{ _.get(selectedTargetLanguage, 'name', '') }}</div>
        <div class="col">
          <ability-selector
            v-if="!isCollapsed"
            v-model="selectedAbility"
            placeholder="Abilities"
            data-e2e-type="rate-ability"
            :format-option="({ name }) => ({ text: name, value: name })"
            title="Abilities list" />
          <div data-e2e-type="rate-ability-read-only" v-else>{{ selectedAbility }}</div>
        </div>
      </div>
    </div>
    <rate-sub-detail
      v-for="(r, rIndex) in rate.rateDetails"
      :key="`rateSubDetail${rIndex}${r.breakdown}`"
      :rate="rate"
      :is-collapsed="isCollapsed"
      :ability="fullAbility"
      :currencies="currencies"
      :breakdowns="breakdowns"
      :translationUnits="translationUnits"
      :internal-departments="internalDepartments"
      v-model="rate.rateDetails[rIndex]"
      :rateDetailIndex="rIndex"
      :class="rIndex > 0 ? 'offset-md-5' : ''"
      :canEdit="canEdit"
      @add-rate-detail="onAddRateDetail"
      @delete-rate-detail="onDeleteRateDetail"
      @rate-sub-detail-validation="onRateSubDetailValidation"/>
  </div>
</template>

<script src="./rate-detail.js"></script>
<style lang="scss" scoped src="./rate-detail.scss"></style>
