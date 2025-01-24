import walkJson from "json-tree-walker";

export type JsonLdFrame = {
  "@context": { [key: string]: string };
  [key: string]: any;
};


/**
 * Function to transform a JSON-LD frame into JSON Pointers, considering @explicit
 * @param jsonLdFrame - The input JSON-LD frame
 * @returns An array of JSON Pointers
 */
export function frameToJsonPointers(jsonLdFrame: JsonLdFrame): string[] {
  const pointers: string[] = [];

  /**
   * Recursive helper function to construct JSON Pointers
   * @param obj - The current object being traversed
   * @param currentPath - The JSON Pointer path built so far
   */
  function traverse(obj: any, currentPath: string) {
    for (const key in obj) {
      if (key === "@context" || key === "@explicit") {
        continue; // Skip @context and @explicit as they are not data attributes
      }

      const newPath = `${currentPath}/${key}`;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        pointers.push(newPath); // Add the current path for the property
        traverse(obj[key], newPath); // Recursively process nested objects
      } else {
        pointers.push(newPath); // Add path for scalar properties
      }
    }
  }

  traverse(jsonLdFrame, ""); // Start traversal from the root
  return pointers;
}

export function extractElementsBetweenBrackets(input: string): string[] {
  // Use regular expression to find all matches within square brackets
  const regex = /\['([^']*)'\]|\[(\d+)\]/g;
  let matches;
  const results = [];

  // Iterate over all matches
  while ((matches = regex.exec(input)) !== null) {
    // Add either the quoted string or the number (whichever is matched)
    results.push(matches[1] || matches[2]);
  }

  return results;
}

export function getNestedAttribute(obj: any, path: []) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

export function setNestedAttribute(obj: any, path: [], value: any) {
  path.reduce((acc, key, idx) => {
    if (idx === path.length - 1) {
      acc[key] = value;
    } else {
      if (!acc[key]) acc[key] = {};  // Create the object if it doesn't exist
      return acc[key];
    }
  }, obj);
}

export function matchVariableAssignments(frame: any) {
  const nestedStrings = []
  const matchedVariableAssignments: any[] = []
  const nullKeys: any[] = []
  walkJson.json(frame, {
    // 'undefined' handles nulls
    undefined: (key: string , value: any, parentType: string, metaData: any) => nullKeys.push([key, metaData]),
    object: (key: string , value: any, parentType: string, metaData: any) => walkJson.concatPathMeta(key, metaData),
    array: (key: string , value: any, parentType: string, metaData: any) => walkJson.concatPathMeta(key, metaData),
    number: (key: string , value: any, parentType: string, metaData: any) => walkJson.concatPathMeta(key, metaData),
    boolean: (key: string , value: any, parentType: string, metaData: any) => walkJson.concatPathMeta(key, metaData),
    string: (key: string , value: any, parentType: string, metaData: any) => {
      const finalPath = walkJson.concatPathMeta(key, metaData);
      nestedStrings.push(`${finalPath}: ${value}`);
      // Detect variable assignments (_:X, _:Y, and _:Z)
      if (value.toString().match('_:[X|Y|Z]'))
        matchedVariableAssignments.push({
          key,
          value,
          parentPath: metaData,
          finalPath,
          pathElements: extractElementsBetweenBrackets(finalPath)
        })
    }
  })
  return matchedVariableAssignments
}

