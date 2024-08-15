import BasicCATToolDocumentService from '../../../services/basic-cat-tool-document-service';
import { isImage, isPDF } from '../../../utils/files';

const basicCATToolDocumentService = new BasicCATToolDocumentService();
// const A4_WIDTH = 595;
const A4_HEIGHT = 1122; // (4/3) * 842

export default {
  props: {
    request: {
      type: Object,
    },
    document: {
      type: Object,
    },
    concurrentPages: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      page: 0,
      pageCount: -1,
      pageHeight: 0,
      scrollTopLocation: 0,
    };
  },
  created() {
    this._initImg();
  },
  watch: {
    document() {
      this._initImg();
    },
  },
  computed: {
    initialized() {
      return this.request && this.request._id && this.request.company
        && this.request.company._id && this.document && this.document._id;
    },
    documentType() {
      if (this.document.name) {
        if (isPDF(this.document.name)) {
          return 'pdf';
        } if (isImage(this.document.name)) {
          return 'image';
        }
      }
      return null;
    },
    upScrollDivStyle() {
      const { pages } = this;
      const pagesToSimulate = pages[0];
      return {
        height: `${pagesToSimulate * this.pageHeight}px`,
      };
    },
    downScrollDivStyle() {
      const { pages } = this;
      const pagesToSimulate = this.pageCount - pages[pages.length - 1];
      return {
        height: `${pagesToSimulate * this.pageHeight}px`,
      };
    },
    pages() {
      let minPage;
      let maxPage;
      if (this.documentType === 'image') {
        return [0];
      }
      // calculates how many pages it should display before and after the current page
      const wiggleRoom = Math.ceil(this.concurrentPages / 2);
      minPage = Math.max(0, this.page - wiggleRoom);
      maxPage = this.page + wiggleRoom;
      if (this.page > wiggleRoom) {
        // if the current page is greater than the wiggle room
        // we can substract from minPage
        if (maxPage > this.pageCount) {
          // if the maxpage is greater than the total amount of pages
          // we set the max page to the last page and then substract from the minPage.
          // We do this to have the same amount of shown pages even if we reached the end
          // of the pdf
          maxPage = this.pageCount;
          let missing = maxPage - this.pageCount;
          while (missing > 0 && minPage > 0) {
            minPage -= 1;
            missing -= 1;
          }
        }
      } else {
        // if the current page is less than the wiggle room
        // we cannot substract from minPage
        // but we can add the missing pages to even out the total amount of pages
        minPage = 0;
        let missing = wiggleRoom - this.page;
        while (missing > 0 && this.pageCount > maxPage) {
          maxPage += 1;
          missing -= 1;
        }
      }
      const amountOfPages = maxPage - minPage;
      const visiblePages = [];
      for (let i = 0; i < amountOfPages; i++) {
        visiblePages.push(minPage + i);
      }
      return visiblePages;
    },
    hasNextPages() {
      const { pages } = this;
      const lastPage = pages[pages.length - 1];
      return lastPage < this.pageCount;
    },
    hasPreviousPages() {
      const firstPage = this.pages[0];
      return firstPage > 0;
    },
  },
  methods: {
    buildDocumentURL(page) {
      if (this.request.company) {
        return basicCATToolDocumentService.getBasicCATToolDocumentUrl(this.request.company._id,
          this.request._id, this.document._id, page);
      }
    },
    retrieveDocumentInfo() {
      const translationDocument = {
        companyId: this.request.company._id,
        requestId: this.request._id,
        documentId: this.document._id,
      };
      return basicCATToolDocumentService
        .retrieveInfo(translationDocument).then((infoResponse) => {
          const { info } = infoResponse.data;
          this.pageHeight = A4_HEIGHT;
          try {
            this.pageHeight = Math.floor((4 / 3) * parseInt(info.pageSize.split(' ')[2], 10));
          } catch (err) {
            // nothing to do
          }
          this.pageCount = info.pageCount;
        });
    },
    onScroll(event) {
      const div = event.target;
      this.scrollLocation = div.scrollTop + div.clientHeight;
      this.page = Math.floor(div.scrollTop / this.pageHeight);
    },
    _initImg() {
      if (this.request && this.document) {
        if (this.documentType === 'pdf') {
          this.retrieveDocumentInfo();
        } else {
          this.pageCount = 1;
        }
      }
    },
  },
};
