<template>
  <div :class="containerClass">
    <simple-basic-select
      v-model="selected"
      v-bind="wrappedProps"
      :disabled="isDisabledSelection"
      :fetch-on-created="fetchOnCreated"
      @click.native="onClick"
      title="Language list"
      :placeholder="placeholder"
      :options="languageOptions"
      :format-option="formatOption"
      :filter-option="filterOption"
      :filter-option-context="filterOptionContext"
      :empty-option="emptyOption"
      :pre-fetch-option="preFetchOption"
      :allowSelectedNotInList="allowSelectedNotInList"
      :non-removable-values="nonRemovableValues"
      valueKey="isoCode"
      entity-name="Language"
      :max-options-timeout="-1"
      v-on="wrappedListeners"
    />
  </div>
</template>

<script src="./language-select.js"></script>
