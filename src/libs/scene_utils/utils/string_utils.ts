export const isEmptyString = (targetString: string): boolean => {
  if (!targetString || targetString === '') {
    return true;
  }
  return false;
};
