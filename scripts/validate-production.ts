import { content } from "../src/lib/content";
import { validateProduction } from "../src/lib/launch-validation";

const errors = validateProduction(process.env, content);

if (errors.length) {
  console.error("\nProduction launch validation failed:\n");
  for (const error of errors) console.error(`  • ${error}`);
  console.error("\nPreview builds remain available; production promotion must stay blocked.\n");
  process.exit(1);
}
console.log("Production launch configuration is complete and approved.");
