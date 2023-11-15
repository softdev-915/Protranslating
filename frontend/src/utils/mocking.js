const DELAY_MS = 1000;
const FILE_TOTAL_SIZE = 10000;
const UPLOADING_PACE = 1000;
const UPLOADING_STEPS = 10;
const mockFileDefault = {
  document: 'foto.jpeg',
  loaded: 0,
  total: FILE_TOTAL_SIZE,
};

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function mockLoadingIcon(fileQueue, i = 1) {
  if (i === UPLOADING_STEPS) {
    return;
  }
  await delay(DELAY_MS);
  mockFileDefault.loaded = UPLOADING_PACE * i;
  fileQueue.push(mockFileDefault);
  await mockLoadingIcon(fileQueue, i + 1);
}

export {
  UPLOADING_PACE,
  FILE_TOTAL_SIZE,
  mockLoadingIcon,
};
