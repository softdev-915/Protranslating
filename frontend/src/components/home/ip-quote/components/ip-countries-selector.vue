<template>
  <div class="selector" :data-e2e-value="selectedValues" @keydown.esc="closeDropdown" :withFlags="withFlags">
    <div class="selector__searchbar">
      <div
        class="chip"
        v-for="country in selectedCountries"
        :key="country.name"
      >
        <span>{{ country.name }}</span>
        <i
          v-if="country.code !== 'none'"
          :data-e2e-type="`remove-${country.name}`"
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
          v-for="(country, index) in countries"
          :key="country._id"
          @mousedown="selectCountryFromDropdown(index)"
        >
          {{
            `${country.checked ? '✓' : ''} ${country.name} (${country.code})`
          }}
        </div>
      </div>
    </div>
    <div v-if="withFlags" class="selector__list">
      <ip-checkbox id="selectAll" label="Select All" v-model="selectAll" />
      <div
        class="list__items"
        :class="`list__items_${listSize}`"
      >
        <div v-for="(country, index) in countries" :key="country._id" :data-e2e-type="country.name">
          <ip-checkbox
            style="height: 22px; width: 238px"
            :id="country.code"
            :label="`${country.name} (${country.code})`"
            :img="loadImage(country.flagPic)"
            v-model="countries[index].checked"
          />
          <ip-radio-group
            v-if="isRadioGroup(country, countries, index)"
            class="radio-group"
            :options="country.entities"
            :selectedValue="country.activeEntity"
            :id="index"
            @on-change="updateRadioGroup"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ip-countries-selector.js"></script>
<style scoped lang="scss" src="./ip-countries-selector.scss"></style>
