
const calculateContextualText = (realSearch, index, textArr, size) => {
  let realIndex = -1;
  const textArrLen = textArr.length;
  for (let i = 0; i < textArrLen; i++) {
    if (textArr[i].indexOf(realSearch) >= 0) {
      realIndex = i;
      break;
    }
  }
  if (realIndex >= 0) {
    const halfSize = Math.ceil(size / 2);
    let min = realIndex - halfSize;
    let minExceed = 0;
    if (min < 0) {
      minExceed = Math.abs(min);
      min = 0;
    }
    let max = realIndex + halfSize;
    let maxExceed = 0;
    if (max > textArrLen) {
      maxExceed = max - textArrLen - 1;
      max = textArrLen - 1;
    }
    if (minExceed) {
      for (let i = 0; i < minExceed && max < textArrLen - 1; i++) {
        max++;
      }
    }
    if (maxExceed) {
      for (let i = 0; i < maxExceed && min !== 0; i++) {
        min--;
      }
    }
    return textArr.slice(min, max);
  }
  return null;
};

export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    search: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 10,
    },
  },
  computed: {
    context: function () {
      const realSearch = this.search.trim().toLowerCase().split(' ')[0];
      const text = this.text.toLowerCase();
      const index = text.indexOf(realSearch);
      const textArr = text.split(' ');
      if (index >= 0) {
        const contextualText = calculateContextualText(realSearch, index, textArr, this.size);
        if (contextualText) {
          return contextualText;
        }
      }
      return textArr.slice(0, this.size);
    },
  },
};
