<template>
  <b-modal size="lg" hide-header-close ref="bModal" data-e2e-type="portalcat-shortcuts-modal">
    <div slot="modal-header">
      <strong>Keyboard Shortcuts</strong>
    </div>
    <div slot="default">
      <table class="table table-sm table-bordered table-striped table-stacked">
        <tr>
          <th colspan="3">Navigation</th>
        </tr>
        <tr>
          <td colspan="2">Previous segment</td>
          <td>Alt + Up</td>
        </tr>
        <tr>
          <td colspan="2">Next segment</td>
          <td>Alt + Down</td>
        </tr>
        <tr>
          <td colspan="2">Switch to source/target</td>
          <td>Tab</td>
        </tr>
        <tr>
          <th colspan="3">Translation</th>
        </tr>
        <tr>
          <td colspan="2">Confirm</td>
          <td>Ctrl + Enter</td>
        </tr>
        <tr>
          <td colspan="2">Unconfirm</td>
          <td>Ctrl + Shift + Enter</td>
        </tr>
        <tr>
          <td colspan="2">Copy</td>
          <td>Ctrl + C</td>
        </tr>
        <tr>
          <td colspan="2">Cut</td>
          <td>Ctrl + X</td>
        </tr>
        <tr>
          <td colspan="2">Paste</td>
          <td>Ctrl + P</td>
        </tr>
        <tr>
          <td colspan="2">Undo</td>
          <td>Ctrl + Z</td>
        </tr>
        <tr>
          <td colspan="2">Redo</td>
          <td>Ctrl + Y</td>
        </tr>
        <tr>
          <td colspan="2">Copy source to target</td>
          <td>Ctrl + Shift + S</td>
        </tr>
        <tr>
          <td colspan="2">Copy selection to target</td>
          <td>Alt + Shift + T</td>
        </tr>
        <tr>
          <td colspan="2">Lock/unlock segment</td>
          <td>Ctrl + Shift + L</td>
        </tr>
        <tr>
          <td colspan="2">Join</td>
          <td>Ctrl + J</td>
        </tr>
        <tr>
          <td colspan="2">Split</td>
          <td>Alt + J</td>
        </tr>
        <tr>
          <th colspan="3">Formatting and tags</th>
        </tr>
        <tr>
          <td colspan="2">Bold</td>
          <td>Ctrl + B</td>
        </tr>
        <tr>
          <td colspan="2">Italics</td>
          <td>Ctrl + I</td>
        </tr>
        <tr>
          <td colspan="2">Underline</td>
          <td>Ctrl + U</td>
        </tr>
        <tr>
          <td colspan="2">Toggle case (uppercase, lowercase, and sentence case)</td>
          <td>Shift + F3</td>
        </tr>
        <tr>
          <td colspan="2">Tag dropdown</td>
          <td>Ctrl</td>
        </tr>
        <tr>
          <th colspan="3">Research</th>
        </tr>
        <tr>
          <td colspan="2">Segment history</td>
          <td>Ctrl + Shift + R</td>
        </tr>
        <tr>
          <td colspan="2">Search and replace</td>
          <td>Ctrl + H</td>
        </tr>
        <tr>
          <td colspan="2">Concordance</td>
          <td>Ctrl + K</td>
        </tr>
      </table>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-primary pull-right" type="button" @click="hide">Close</button>
    </div>
  </b-modal>
</template>

<script src="./keyboard-shortcuts-modal.js"></script>
