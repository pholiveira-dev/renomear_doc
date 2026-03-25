export function createInitialState(documents) {
  return documents.map((doc) => ({
    ...doc,
    file: null,
    status: "empty",
    validation: null,
    convertedFile: null,
  }));
}
