/**
 * Counts the number of attributes in a nested object.
 * Attributes include all keys, regardless of nesting level.
 *
 * @param obj - The object to count attributes in.
 * @returns The total count of attributes.
 */
export function countAttributes(obj: Record<string, any>): number {
  let count = 0;

  function recursiveCount(innerObj: Record<string, any>): void {
    for (const key in innerObj) {
      if (innerObj.hasOwnProperty(key)) {
        count++;
        if (typeof innerObj[key] === "object" && innerObj[key] !== null) {
          recursiveCount(innerObj[key]);
        }
      }
    }
  }

  recursiveCount(obj);
  return count;
}

export function objVistor(obj: Record<string, any>, visitorFunction: Function): any {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      visitorFunction(key, obj[key]);
      if (typeof obj[key] === "object" && obj[key] !== null) {
        objVistor(obj[key], visitorFunction);
      }
    }
  }
}
