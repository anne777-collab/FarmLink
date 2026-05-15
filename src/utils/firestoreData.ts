const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

export const cleanFirestoreData = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined && !(typeof entry === "number" && Number.isNaN(entry)))
      .map((entry) => cleanFirestoreData(entry)) as T;
  }

  if (isPlainObject(value)) {
    const cleaned = Object.entries(value).reduce<Record<string, unknown>>((acc, [key, entry]) => {
      if (entry === undefined) return acc;
      if (typeof entry === "number" && Number.isNaN(entry)) return acc;

      const nextValue = cleanFirestoreData(entry);
      if (isPlainObject(nextValue) && Object.keys(nextValue).length === 0) {
        acc[key] = null;
      } else {
        acc[key] = nextValue;
      }

      return acc;
    }, {});

    return cleaned as T;
  }

  return value;
};
