<template>
  <div class="selector">
    <div class="selector__searchbar">
      <div
        class="chip"
        v-for="country in selectedCountries"
        :key="country.name"
      >
        <span>{{ country.name }}</span>
        <i
          v-if="country.code !== 'none'"
          class="fas fa-times"
          @click="removeSelectedCountry(country.code)"
        />
      </div>
      <input
        type="text"
        :placeholder="placeholder"
        v-model="search"
        @keydown.delete="unselectLastCountry"
        :tabindex="tabindex"
        @blur="closeDropdown"
        @click="openDropdown"
      />
      <div v-if="!withFlags && showDropdown" class="dropdown">
        <div
          class="dropdown__item"
          v-for="country in [].concat(countries.memberStates, countries.extensionStates, countries.validationStates)"
          :key="country._id"
          @mousedown="selectCountryFromDropdown(country.code)"
        >
          {{
            `${country.checked ? '✓' : ''} ${country.name} (${country.code})`
          }}
        </div>
      </div>
    </div>
    <div v-if="withFlags" class="selector__list">
      <ip-checkbox
        id="select-member-states"
        className="label-bold"
        :label="`Member States (${countries.memberStates.length})`"
        v-model="selectAllMemberStates" 
        data-e2e-type="all-member-states-checkbox"
      />
      <div class="list__items" data-e2e-type='member-state-countries'>
        <ip-checkbox
          v-for="country in countries.memberStates"
          :key="country._id"
          :id="country._id"
          :label="`${country.name} (${country.code})`"
          :img="img(country.flagPic)"
          v-model="country.checked"
          :data-e2e-type="`country-${country.name} (${country.code})-checkbox`"
        />
      </div>
      <ip-checkbox
        class="mt-4"
        id="select-extension-states"
        className="label-bold"
        :label="`Extension States (${countries.extensionStates.length})`"
        data-e2e-type="all-extension-states-checkbox"
        v-model="selectAllExtensionStates"
        />
      <div class="list__items mt-1" data-e2e-type='extension-state-countries'>
        <ip-checkbox
          v-for="country in countries.extensionStates"
          :key="country._id"
          :id="country.code"
          :label="`${country.name} (${country.code})`"
          :img="img(country.flagPic)"
          v-model="country.checked"
          :data-e2e-type="`country-${country.name} (${country.code})-checkbox`"
        />
      </div>
      <ip-checkbox
        class="mt-4" id="select-validation-states"
        className="label-bold"
        :label="`Validation States (${countries.validationStates.length})`"
        v-model="selectAllValidationStates"
        data-e2e-type="all-validation-states-checkbox"
      />
      <div class="list__items mt-1" data-e2e-type='validation-state-countries'>
        <ip-checkbox
          v-for="country in countries.validationStates"
          :key="country._id"
          :id="country.code"
          :label="`${country.name} (${country.code})`"
          :img="img(country.flagPic)"
          v-model="country.checked"
          :data-e2e-type="`country-${country.name} (${country.code})-checkbox`"
        />
      </div>
    </div>
  </div>
</template>

<script src="./ip-epo-countries-selector.js"></script>
<style scoped lang="scss" src="./ip-countries-selector.scss"></style>
<style scoped>
  .list__items{
    flex-flow: row wrap;
    justify-content: start;
  };
</style>
<style>
  .label-bold label{
      font-weight: bold;
  }
</style>
