<template>
  <tr>
    <td v-if="canReadAll">
      <span
        v-if="value.user.isLocked"
        data-e2e-type="excluded-provider-row-provider-name-read-only"
      >
        {{ `${value.user.name}` }}
      </span>
      <user-ajax-basic-select
        v-else
        placeholder="Select Provider Name"
        :selected-option="providerNameSelectedOption"
        :filter="filterForRetrieve"
        @select="handleDropdownSelection"
        :class="{'red-border': isDuplicate}"
        data-e2e-type="excluded-provider-row-provider-name-select"
      />
    </td>
    <td v-if="canReadAll">
      <span
        v-if="value.user.isLocked"
        data-e2e-type="excluded-provider-row-provider-id-read-only"
      >
        {{ value.user.userId }}
      </span>
      <user-ajax-basic-select
        v-else
        placeholder="Select Provider ID"
        :selected-option="providerIdSelectedOption"
        :formatOption="formatOption"
        :filter="filterForRetrieve"
        :extraFilter="extraFilter"
        @select="handleDropdownSelection"
        :class="{'red-border': isDuplicate}"
        data-e2e-type="excluded-provider-row-provider-id-select"
      />
      <span 
      class="span.pts-required-field red-text" 
      v-if="isDuplicate"
      data-e2e-type="excluded-provider-row-duplicate-error-message">Duplicate Entry</span>
    </td>
    <td>
      <div v-if="!isEditingNotes && value.user.isLocked">
        <span
          data-e2e-type="excluded-provider-row-notes-read-only"
        >
          {{ value.user.notes }}
        </span>
        <i
          class="fas fa-pencil pts-clickable mx-3"
          aria-hidden="true"
          @click="toggleIsEditingNotes()"
          data-e2e-type="excluded-provider-row-edit-note-pencil"
        ></i>
      </div>
      <div v-else class="input-group input-group-sm my-0">
        <input
          type="text"
          :class="{'form-control': !isDuplicate, 'red-border': isDuplicate}"
          placeholder="Type a note"
          v-model="value.user.notes"
          data-e2e-type="excluded-provider-row-note-input"
        >
        <div v-if="value.user.isLocked" class="input-group-append">
          <button
            class="btn btn-outline-primary"
            type="button"
            @click="handleSaveNote()"
            data-e2e-type="excluded-provider-row-edit-note-save">Save</button>
        </div>
      </div>
    </td>
    <td>
      <div v-if="!value.user.isLocked">
        <i
          data-e2e-type="excluded-provider-row-save-button"
          :class="{'fas fa-check text-success mx-1 pts-clickable': isValid, 'fas fa-check text-success mx-1 pts-not-allowed disabled': !isValid}"
          @click="() => lockExcludedProvider(value)"
          :disabled="!isValid"
        />
        <i
          data-e2e-type="excluded-provider-row-cancel-button"
          class="fas fa-times text-danger mx-1 pts-clickable"
          @click="cancelExcludedProvider(index, value)"
        />
      </div>
      <div v-else-if="canEdit">
        <button
          data-e2e-type="excluded-provider-row-add-button"
          title="New Excluded Provider"
          @click="addRow(index)"
          class="fas fa-plus mr-1"
        />
        <button
          data-e2e-type="excluded-provider-row-delete-button"
          title="New Excluded Provider"
          @click="deleteExcludedProvider(index, value)"
          class="fas fa-trash mr-1"
        />
      </div>
    </td>
  </tr>
</template>
<script src="./company-excluded-providers-row.js"></script>