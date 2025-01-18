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
