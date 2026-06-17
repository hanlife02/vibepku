import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const nodeGlobals = {
  Buffer: "readonly",
  FormData: "readonly",
  URL: "readonly",
  console: "readonly",
  process: "readonly",
};

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["tests/**/*.test.ts", "scripts/**/*.ts"],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
];

export default config;
