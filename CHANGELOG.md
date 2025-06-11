# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.2](https://github.com/1xBuild/thep33l/compare/v2.0.1...v2.0.2) (2025-06-11)


### Features

* add new scheduled trigger that send a message to a .env var group ([0f8339e](https://github.com/1xBuild/thep33l/commit/0f8339ef842b65a51694eced65e500c3f644a686))


### Bug Fixes

* frontend build error ([8da1041](https://github.com/1xBuild/thep33l/commit/8da10410228fdf92c2a79f6d5a6f93cc2aac6e6e))
* remove delay for faster reply ([463027b](https://github.com/1xBuild/thep33l/commit/463027b4944f601701c3b20abee124ddfe8f0b7a))
* update the shouldanswer prompt ([92da43b](https://github.com/1xBuild/thep33l/commit/92da43b2a571f1e62c57bdb6d0201969e61d49e5))

### [2.0.1](https://github.com/1xBuild/thep33l/compare/v2.0.0...v2.0.1) (2025-06-06)


### Features

* display a header message in staging env ([aba4345](https://github.com/1xBuild/thep33l/commit/aba4345483c4af6c902cb92c60422f3f1a9d2964))
* set system template by default ([41985cb](https://github.com/1xBuild/thep33l/commit/41985cbd57c420dfdad7f35d22dabf9502346b7f))


### Bug Fixes

* fix the status indicator of tools & trigger ([c346c9d](https://github.com/1xBuild/thep33l/commit/c346c9d01ee39ca30cb55a2ae28cb04bc632f5f0))

## 2.0.0 (2025-06-06)


### ⚠ BREAKING CHANGES

* All code now lives under /app; legacy /src is deleted. Update your dev workflow accordingly.

### Features

* add a flowchart in docs ([ce553fd](https://github.com/1xBuild/thep33l/commit/ce553fdf1fe6c1ee3f6847d9dbcdacb7746790a8))
* add analyst-agent service and api ([cf46152](https://github.com/1xBuild/thep33l/commit/cf4615249d1bc4c254a11d3a2d7a203b827f2b9c))
* add p33l persona ([7044c68](https://github.com/1xBuild/thep33l/commit/7044c68db2daf5a7f4eee3bfc753ac4c31951fd5))
* add status management for agents + switch ui comp ([d7f3457](https://github.com/1xBuild/thep33l/commit/d7f3457f0b560b1a2ce94161d9e712c4dbb18e1f))
* add telegram ([20b4a70](https://github.com/1xBuild/thep33l/commit/20b4a702742ed04bd679474bbd96914537c47024))
* add the cryptopanic tool in ui + basic tool service ([7c125c8](https://github.com/1xBuild/thep33l/commit/7c125c89e9c0713ed846a8393dee9f94379415a9))
* enhance cryptopanic data structure in memory ([fa2fc4d](https://github.com/1xBuild/thep33l/commit/fa2fc4d4daa14dee8ecbf55fdc00dac649e86f3b))
* **frontend:** improve UX with skeleton loaders, toasts, and robust agent fallback ([5989ddf](https://github.com/1xBuild/thep33l/commit/5989ddfd7bd99afd071343b35c87f236db10a062))
* implement agent management api with crud and sync with letta ([363d530](https://github.com/1xBuild/thep33l/commit/363d5304c60a31c4d1f076b8617eca79ac53bf70))
* implement message filter & message history ([3f83587](https://github.com/1xBuild/thep33l/commit/3f83587e6f0263527244d0fe865fa5915b8d930b))
* **modale:** create modale validate ([1bbe9a3](https://github.com/1xBuild/thep33l/commit/1bbe9a39130f904476d0c710103f01b69376c684))
* send alert in discord / slack if a message can't be sent ([819781e](https://github.com/1xBuild/thep33l/commit/819781e151b29d9901bd9ede62227fa34f578901))
* **triggers:** add logic for triggers and minimal: refactor/perf components agent ([e911b0c](https://github.com/1xBuild/thep33l/commit/e911b0caa6ddc419c9184c5853f80360e875c004))
* **triggers:** add route, controllers, and logic for telegram start and stop ([7dc47a8](https://github.com/1xBuild/thep33l/commit/7dc47a8685ded69547905e766d3e11aca94c7d79))
* **triggers:** create logic for use id agent in print good triggers and refacto ([6763ae7](https://github.com/1xBuild/thep33l/commit/6763ae7592a55b53dd4fde8be6d23e8b414ed6d2))
* various small fix to have a clean interface ([6442ba6](https://github.com/1xBuild/thep33l/commit/6442ba61b0dec9e2a622d5c4e4ed6df88311cd7d))


### Bug Fixes

* add delay to avoid rate limiting in Telegram bot responses ([16292cf](https://github.com/1xBuild/thep33l/commit/16292cf4b8bd273f69cbd95c258460f4733b746b))
* add vercel config to fix redirects ([e68ffb3](https://github.com/1xBuild/thep33l/commit/e68ffb3906f39ebb5b55d9d8dde103b8227c05f9))
* build ([43c68fa](https://github.com/1xBuild/thep33l/commit/43c68fab9a3f1d16ce94bcdfac4bb12941f81c9b))
* build script ([573fa32](https://github.com/1xBuild/thep33l/commit/573fa32e69234b1c09a015e7b4a708727ddfa409))
* build script ([6877a3a](https://github.com/1xBuild/thep33l/commit/6877a3aab86ac32617b426e973c3595f06e43d75))
* **editprompt:** add modal pending in all interaction in site and reset persa change agent ([72a20fe](https://github.com/1xBuild/thep33l/commit/72a20fe68d9ccfac213a7a511299a091490f3014))
* env config setup between railway and vercel for prod and dev ([a6ce248](https://github.com/1xBuild/thep33l/commit/a6ce24895ab0ba323470ba2ed74860547f088790))
* env config setup on railway ([2a9abdd](https://github.com/1xBuild/thep33l/commit/2a9abdd54b0d2ef7c262b1379d05370fb9bc8988))
* **error:** fix the error when creating an agent ([6ee76cb](https://github.com/1xBuild/thep33l/commit/6ee76cb28c0deaba7d53f49acfe50fd4c56c2bea))
* fix pnpm-lock outdated + useless packages in .json ([186b3a4](https://github.com/1xBuild/thep33l/commit/186b3a4231ecdc64f4e970ccbde55599417d7b83))
* fix the visual ui bugs ([1e30d1a](https://github.com/1xBuild/thep33l/commit/1e30d1a7b4d2fc40e8621fe416184797451e9908))
* force the bot to answer to replies ([077ee76](https://github.com/1xBuild/thep33l/commit/077ee76be29385400f78b842b225d5d2c7c9564a))
* frontend errors ([d604383](https://github.com/1xBuild/thep33l/commit/d60438368009234f6774bb15cbc50140640bc3c0))
* ignore messages from before the bot was started ([48a4b36](https://github.com/1xBuild/thep33l/commit/48a4b367113ca30f8b4c175b8353f4e02720e1a0))
* improve error handling in agent controller ([bdba75d](https://github.com/1xBuild/thep33l/commit/bdba75dd54cbf93930c964599dc0b9a2a2098b5c))
* remove build files and fix tserrors ([fd90851](https://github.com/1xBuild/thep33l/commit/fd908510a9c550a64b890ecd0d87d1988d947202))
* shutdown process on sigint sigterm ([8b5b1f2](https://github.com/1xBuild/thep33l/commit/8b5b1f27bad356861b1672d917cf0c849714d4e7))
* **ui:** theme color ([7d14cd2](https://github.com/1xBuild/thep33l/commit/7d14cd256b04c9e21771b325d20ce222bd537fdb))


* migrate backend and frontend to /app, clean up legacy src ([d94ba44](https://github.com/1xBuild/thep33l/commit/d94ba44a4d9d1f37754c744f414f6a4eb96f49e9))

# 1.0.0 (2025-06-05)

### Bug Fixes

- add delay to avoid rate limiting in Telegram bot responses ([16292cf](https://github.com/1xBuild/thep33l/commit/16292cf4b8bd273f69cbd95c258460f4733b746b))
- add vercel config to fix redirects ([e68ffb3](https://github.com/1xBuild/thep33l/commit/e68ffb3906f39ebb5b55d9d8dde103b8227c05f9))
- build ([43c68fa](https://github.com/1xBuild/thep33l/commit/43c68fab9a3f1d16ce94bcdfac4bb12941f81c9b))
- build script ([573fa32](https://github.com/1xBuild/thep33l/commit/573fa32e69234b1c09a015e7b4a708727ddfa409))
- build script ([6877a3a](https://github.com/1xBuild/thep33l/commit/6877a3aab86ac32617b426e973c3595f06e43d75))
- env config setup between railway and vercel for prod and dev ([a6ce248](https://github.com/1xBuild/thep33l/commit/a6ce24895ab0ba323470ba2ed74860547f088790))
- env config setup on railway ([2a9abdd](https://github.com/1xBuild/thep33l/commit/2a9abdd54b0d2ef7c262b1379d05370fb9bc8988))
- **error:** fix the error when creating an agent ([6ee76cb](https://github.com/1xBuild/thep33l/commit/6ee76cb28c0deaba7d53f49acfe50fd4c56c2bea))
- fix pnpm-lock outdated + useless packages in .json ([186b3a4](https://github.com/1xBuild/thep33l/commit/186b3a4231ecdc64f4e970ccbde55599417d7b83))
- fix the visual ui bugs ([1e30d1a](https://github.com/1xBuild/thep33l/commit/1e30d1a7b4d2fc40e8621fe416184797451e9908))
- force the bot to answer to replies ([077ee76](https://github.com/1xBuild/thep33l/commit/077ee76be29385400f78b842b225d5d2c7c9564a))
- frontend errors ([d604383](https://github.com/1xBuild/thep33l/commit/d60438368009234f6774bb15cbc50140640bc3c0))
- ignore messages from before the bot was started ([48a4b36](https://github.com/1xBuild/thep33l/commit/48a4b367113ca30f8b4c175b8353f4e02720e1a0))
- shutdown process on sigint sigterm ([8b5b1f2](https://github.com/1xBuild/thep33l/commit/8b5b1f27bad356861b1672d917cf0c849714d4e7))
- **ui:** theme color ([7d14cd2](https://github.com/1xBuild/thep33l/commit/7d14cd256b04c9e21771b325d20ce222bd537fdb))

### Code Refactoring

- migrate backend and frontend to /app, clean up legacy src ([d94ba44](https://github.com/1xBuild/thep33l/commit/d94ba44a4d9d1f37754c744f414f6a4eb96f49e9))

### Features

- add analyst-agent service and api ([cf46152](https://github.com/1xBuild/thep33l/commit/cf4615249d1bc4c254a11d3a2d7a203b827f2b9c))
- add p33l persona ([7044c68](https://github.com/1xBuild/thep33l/commit/7044c68db2daf5a7f4eee3bfc753ac4c31951fd5))
- add status management for agents + switch ui comp ([d7f3457](https://github.com/1xBuild/thep33l/commit/d7f3457f0b560b1a2ce94161d9e712c4dbb18e1f))
- add telegram ([20b4a70](https://github.com/1xBuild/thep33l/commit/20b4a702742ed04bd679474bbd96914537c47024))
- enhance cryptopanic data structure in memory ([fa2fc4d](https://github.com/1xBuild/thep33l/commit/fa2fc4d4daa14dee8ecbf55fdc00dac649e86f3b))
- **frontend:** improve UX with skeleton loaders, toasts, and robust agent fallback ([5989ddf](https://github.com/1xBuild/thep33l/commit/5989ddfd7bd99afd071343b35c87f236db10a062))
- implement agent management api with crud and sync with letta ([363d530](https://github.com/1xBuild/thep33l/commit/363d5304c60a31c4d1f076b8617eca79ac53bf70))
- implement message filter & message history ([3f83587](https://github.com/1xBuild/thep33l/commit/3f83587e6f0263527244d0fe865fa5915b8d930b))
- **modale:** create modale validate ([1bbe9a3](https://github.com/1xBuild/thep33l/commit/1bbe9a39130f904476d0c710103f01b69376c684))
- send alert in discord / slack if a message can't be sent ([819781e](https://github.com/1xBuild/thep33l/commit/819781e151b29d9901bd9ede62227fa34f578901))
- various small fix to have a clean interface ([6442ba6](https://github.com/1xBuild/thep33l/commit/6442ba61b0dec9e2a622d5c4e4ed6df88311cd7d))

### BREAKING CHANGES

- All code now lives under /app; legacy /src is deleted. Update your dev workflow accordingly.
