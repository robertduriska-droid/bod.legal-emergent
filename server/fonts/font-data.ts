// Auto-generated font data for jsPDF Unicode support
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fontsDir = __dirname;

let _interRegular: string | null = null;
let _interBold: string | null = null;

export function getInterRegularBase64(): string {
  if (!_interRegular) {
    _interRegular = readFileSync(join(fontsDir, "Inter-Regular.b64"), "utf-8");
  }
  return _interRegular;
}

export function getInterBoldBase64(): string {
  if (!_interBold) {
    _interBold = readFileSync(join(fontsDir, "Inter-Bold.b64"), "utf-8");
  }
  return _interBold;
}
