<template>
  <tr
    role="row"
    :id="rowId"
    @click="showEdit($event, index)"
    :class="cssRowClass(item)">
    <td v-if="rowSelection">
      <input
        type="checkbox"
        :disabled="shouldDisableRowSelection"
        @click.stop="stopCheckBoxEventPropagation"
        :checked="isRowSelected"
        @change="checkBoxChange"
        data-e2e-type="table-row-select"/>
    </td>
    <td
      :data-e2e-type="col.prop"
      :style="col.style"
      :class="cssCellClass(col, item)"
      v-for="(col, index) in columns"
      :key="index">
      <template v-if="!isArray(itemValue(item, col))">
        <component :is="rowElement" :href="hrefBuilder(item)" @click="navigateTo($event, index)">
          <template>
            <b class="hidden-sm-up">{{ col.name }}:</b>
          </template>
          <span class="col-item-text" :class="{ 'no-pointer': !isHrefExist }">
            <template v-if="col.type === 'boolean'">
              {{itemValue(item, col) === undefined ? false : itemValue(item, col)}}
            </template>
            <template v-if="col.type === 'date' || col.prop === 'taskDueDate'">
              {{itemDateValue(item, col)}}
            </template>
            <template v-if="col.type === 'html'">
              <span v-html="itemValue(item, col)"></span>
            </template>
            <template v-if="col.type === 'component'">
              <component
                :is="components[col.componentName]"
                :index="index"
                :item="item"
                :col="col" />
            </template>
            <template v-if="col.type === 'currency'">{{itemValue(item, col) | currency('', 2)}}</template>
            <template v-if="col.type === 'longtext'">
              <span
                class="col-items col-item-text"
                @click.stop="stahp">{{ellipsisText(itemValue(item, col), col.maxChars, showAll[col.prop])}}</span>
              <span
                v-if="showMore[col.prop] === false"
                class="col-items show-more"
                @click.stop.prevent="setShowAll(col.prop, true)">show more</span>
              <span
                v-if="showMore[col.prop] === true"
                class="col-items show-more"
                @click.stop.prevent="setShowAll(col.prop, false)">show less</span>
            </template>
            <template v-if="col.type === 'button'">
              <span>
                <a
                  :href="item.link"
                  @click="onItemAction(item, $event)"
                  :alt="item.altText"
                  :title="item.altText"
                  :class="item.className">
                  <i class="fas" :class="item.iconName" aria-hidden="true" :alt="item.altText"></i>
                </a>
              </span>
            </template>
            <template v-if="col.type === 'toggle' && (canToggle || rowSelectionDisabled)">
              <span>
                <input
                  data-e2e-type="toggle-checkbox"
                  type="checkbox"
                  class="cm-toggle"
                  :disabled="rowSelectionDisabled"
                  :checked="rowActive"
                  :key="item[col.prop]"
                  @click="onToggleAction(item, col)">
              </span>
            </template>
            <template v-if="isDefaultColType(col)">{{itemValue(item, col)}}</template>
          </span>
        </component>
      </template>
      <template v-else>
        <span
          class="col-items col-item-text"
          v-for="val in rangedArray(itemValue(item, col), showAll[col.prop])"
          :key="val"
          @click.stop>{{val}}</span>
        <span
          v-if="showMore[col.prop] === false"
          class="col-items show-more"
          @click.stop.prevent="setShowAll(col.prop, true)">show more</span>
        <span
          v-if="showMore[col.prop] === true"
          class="col-items show-more"
          @click.stop.prevent="setShowAll(col.prop, false)">show less</span>
      </template>
    </td>
  </tr>
</template>
<script src="./grid-table-row.js"></script>

<style scoped lang="scss" src="./grid-table-row.scss"></style>
