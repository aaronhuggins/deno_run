# deno_run

A project manifest definition and runner for Deno.

## Usage

Install using `deno` to bootstrap `deno_run`:
```shell
deno install --allow-run https://deno.land/x/deno_run/deno_run.ts bootstrap
```

Then, projects which implement DenoManifest as `manifest.ts` can be ran or installed using `deno_run`:
```shell
# Runs a project manifest.
deno_run https://deno.land/x/some_project/manifest.ts

# Installs
deno_run install https://deno.land/x/some_project/manifest.ts

# Upgrades
deno_run upgrade https://deno.land/x/some_project/manifest.ts
```

## `manifest.ts`

The metadata for a Deno project which supports this tool can be found in a file named `manifest.ts` in the project root. It is a plain TypeScript file which exports either a default or a named `manifest` object. The export object **must** conform to both the `DenoManifest` interface and the `DenoManifestSchema` json schema; these can be found in `lib/types.ts`. The manifest will be imported in a sandboxed environment which disallows any privileged API and which strips the export of any non-primitive, non-object, non-array value.

An easy check-list for `manifest.ts`:
  - No use of `import`
  - No use of `Deno`, `window`, etc.
  - No exporting of functions, classes, etc.

That's it. Using TypeScript to describe the metadata should come natually in the context of Deno, and it should allow more complex composing of metadata since its code will be executed on import.

The manifest will then be used to construct the arguments for the project's entry module, whether installing or running using `deno_run`.

## Why

Not all projects are intended as modules; some (including this very one) are command line tools. End users should not have to worry about excessively long or descriptive commands in order to run or install command line tools. However, it should be possible to present users with the required permissions for a particular tool or project, and it should be possible to reason about a project's metadata.

There are multiple issues which discuss an equivalent to `package.json` or a permissions file:
https://github.com/denoland/deno/issues/5489
https://github.com/denoland/deno/issues/3675
https://github.com/denoland/deno/issues/3179

Many of these discussions include a lot of talk about Node.js doing things a certain way, and well, people are just used to it. I completely disagree; Deno is trying to accomplish something very intentional in breaking away from that ecosystem. Security and composability and ease of use are all a part of the forward-path for Deno, as well as more that's not well defined or well understood yet. The author of `deno_run` is opinionated that Deno is the proper place for package management and tooling; the manifest file is not for every Deno project but is instead meant to remove friction where it concerns running and installing Deno projects which are command line tools.
