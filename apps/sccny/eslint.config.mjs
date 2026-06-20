import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    rules: {
      // eslint-config-next 16 enables this React-Compiler-era rule as an error.
      // It flags the codebase's standard, intentional patterns (loading flags
      // around data fetching in effects, resetting state when a dependency
      // changes). Keep it visible as a warning instead of failing the build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: ["src/generated/**"],
  },
];

export default eslintConfig;
