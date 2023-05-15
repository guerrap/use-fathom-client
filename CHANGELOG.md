## 1.3.1 (May 15, 2023)

Fixes:

- check if the configuration root path exists before `dirname`

## 1.3.0 (May 15, 2023)

Features:

- avoid scoping the output files under the `/src` folder

## 1.2.0 (May 11, 2023)

Features:

- generate placeholder code when envs are missing

Fixes:

- avoid pushing commands to the local queue if fathom is never initialized

Others:

- add eslint config, husky, commit lint

## 1.1.0 (May 11, 2023)

Features:

- avoid injecting fathom script multiple times
- change config file name, support multiple names

Refactors:

- move `scripts` out of `src` folder
- move the `outDir` option to the configuration file
- change npm package name

## 1.0.0 (May 09, 2023)

Features:

- first release
