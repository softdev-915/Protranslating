function numberToWords(amount) {
  const words = [];
  words[0] = '';
  words[1] = 'One';
  words[2] = 'Two';
  words[3] = 'Three';
  words[4] = 'Four';
  words[5] = 'Five';
  words[6] = 'Six';
  words[7] = 'Seven';
  words[8] = 'Eight';
  words[9] = 'Nine';
  words[10] = 'Ten';
  words[11] = 'Eleven';
  words[12] = 'Twelve';
  words[13] = 'Thirteen';
  words[14] = 'Fourteen';
  words[15] = 'Fifteen';
  words[16] = 'Sixteen';
  words[17] = 'Seventeen';
  words[18] = 'Eighteen';
  words[19] = 'Nineteen';
  words[20] = 'Twenty';
  words[30] = 'Thirty';
  words[40] = 'Forty';
  words[50] = 'Fifty';
  words[60] = 'Sixty';
  words[70] = 'Seventy';
  words[80] = 'Eighty';
  words[90] = 'Ninety';
  amount = amount.toString();
  const atemp = amount.split('.');
  const number = atemp[0].split(',').join('');
  const nLength = number.length;
  let wordsString = '';
  if (nLength <= 9) {
    const nArray = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const receivedNArray = [];
    for (let i = 0; i < nLength; i++) {
      receivedNArray[i] = number.substr(i, 1);
    }
    for (let i = 9 - nLength, j = 0; i < 9; i++, j++) {
      nArray[i] = receivedNArray[j];
    }
    for (let i = 0, j = 1; i < 9; i++, j++) {
      if (i === 0 || i === 2 || i === 4 || i === 7) {
        if (nArray[i] === 1) {
          // eslint-disable-next-line radix
          nArray[j] = 10 + parseInt(nArray[j]);
          nArray[i] = 0;
        }
      }
    }
    let value = '';
    for (let i = 0; i < 9; i++) {
      if (i === 0 || i === 2 || i === 4 || i === 7) {
        value = nArray[i] * 10;
      } else {
        value = nArray[i];
      }
      if (value !== 0) {
        wordsString += `${words[value]} `;
      }
      if (
        (i === 1 && value !== 0)
        || (i === 0 && value !== 0 && nArray[i + 1] === 0)
      ) {
        wordsString += 'Crores ';
      }
      if (
        (i === 3 && value !== 0)
        || (i === 2 && value !== 0 && nArray[i + 1] === 0)
      ) {
        wordsString += 'Lakhs ';
      }
      if (
        (i === 5 && value !== 0)
        || (i === 4 && value !== 0 && nArray[i + 1] === 0)
      ) {
        wordsString += 'Thousand ';
      }
      if (
        i === 6
        && value !== 0
        && (nArray[i + 1] !== 0 && nArray[i + 2] !== 0)
      ) {
        wordsString += 'Hundred and ';
      } else if (i === 6 && value !== 0) {
        wordsString += 'Hundred ';
      }
    }
    wordsString = wordsString.split('  ').join(' ');
  }
  return wordsString;
}

export default function convertNumbersToWords(n) {
  const nums = n.toString().split('.');
  const whole = numberToWords(nums[0]);
  if (nums.length === 2 && nums[1] !== '00') {
    const fraction = numberToWords(nums[1]);
    return `${whole}and ${fraction}`;
  }
  return whole;
}
