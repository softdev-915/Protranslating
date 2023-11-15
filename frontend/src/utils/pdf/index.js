export const addCssStyleToPage = (function () {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  document.head.appendChild(style);
  return (content) => {
    style.innerHTML = content;
  };
}());

export const getDefaultFooterStyles = function (footerContent) {
  return `
    @bottom-left {
      content: '${footerContent}';
      padding-bottom: 10pt;
      overflow: auto;
      vertical-align: bottom;
      font-family: 'Barlow Semi Condensed' !important;
      font-weight: 400;
      font-size: 10pt;
      margin-left: 32pt;
      color: #565E71;
    }
    @bottom-right {
      font-family: 'Barlow Semi Condensed' !important;
      font-weight: 400;
      font-size: 10pt;
      margin-right: 32pt !important;
      color: #565E71;
    }
  `;
};

addCssStyleToPage.setPageStyles = function (marginData, footerStyles) {
  const css = `
    @page {
      margin-top: 0px;
      margin-left: 0px;
      margin-right: 0px;
      margin-bottom: 30pt;
      size: A4 portrait;
      padding: 0px;
     ${footerStyles}
      @bottom-right {
        content: counter(page) ' / ' counter(pages);
        margin-right: ${marginData.right};
        padding-bottom: 10pt;
        overflow: auto;
        vertical-align: bottom;
        font-size: 10pt;
        color: #565E71;
        white-space: nowrap;
      }
    }
  `;
  addCssStyleToPage(css);
};

export const setPageStyles = (footerContent, cssMarginData) => {
  const footerStyles = getDefaultFooterStyles(footerContent);
  addCssStyleToPage.setPageStyles(cssMarginData, footerStyles);
};

export const downloadPdf = (response, pdfName) => {
  const pdfBlob = new Blob(
    [response.data],
    { type: response.headers.get('content-type') },
  );
  const disposition = response.headers.get('content-disposition');
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = filenameRegex.exec(disposition);
  const filename = matches != null && matches[1]
    ? decodeURIComponent(matches[1].replace(/['"]/g, ''))
    : pdfName;
  const result = document.createElement('a');
  result.href = window.URL.createObjectURL(pdfBlob);
  result.download = filename;
  result.click();
};
