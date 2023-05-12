import { generateMappings } from "./generate-mappings.js";
import { generateTypes } from "./generate-types.js";
import { generateUtilities } from "./generate-utilities.js";

export const generatePlaceholderCode = async (outDir) => {
  await generateTypes([], `${outDir}/types.ts`);
  await generateMappings([], `${outDir}/mappings.ts`);
  await generateUtilities(`${outDir}/utilities.ts`);
};
