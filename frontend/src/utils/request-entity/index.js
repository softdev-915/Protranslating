export const getId = (entity) => {
  if (entity && typeof entity === 'object' && entity !== null) {
    return entity._id;
  }
  return entity;
};
