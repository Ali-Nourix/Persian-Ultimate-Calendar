import { context } from "esbuild";
import { builtinModules } from "node:module";
const watch = process.argv.includes("--watch");
const ctx = await context({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtinModules],
  format: "cjs",
  target: "es2018",
  outfile: "main.js",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
});
if (watch) await ctx.watch();
else {
  await ctx.rebuild();
  await ctx.dispose();
}
