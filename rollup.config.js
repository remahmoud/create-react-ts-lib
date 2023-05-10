import terser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json" assert { type: "json" };

export default {
    input: "src/index.ts",
    output: {
        dir: "dist",
        format: "es",
    },
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
        }),
        terser(),
    ],
    external: [...Object.keys(pkg.dependencies)],
};
