import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React 19's latest hooks rules flag established async-loading effects
      // and event-handler closures over refs as render-time side effects.
      // Keep the remaining hooks rules enabled while these patterns are
      // refactored separately.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
