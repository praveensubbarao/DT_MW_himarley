# Himarley Playwright Framework

A starter Playwright + TypeScript framework scaffold for testing `https://www.himarley.com`.

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

## Environment

Use the `STACK` environment variable to select the target base URL:

- `STACK=prod` — `https://www.himarley.com`
- `STACK=dev` — placeholder `https://dev.himarley.com`
- `STACK=stg` — placeholder `https://stg.himarley.com`

## Run tests

Run the sample homepage spec on Chromium:

```bash
STACK=prod npx playwright test src/tests/us/homepage/homepage.spec.ts --project chromium
```

Run desktop resolution tests:

```bash
STACK=prod yarn test:desktop
```

Run mobile resolution tests:

```bash
STACK=prod yarn test:mobile
```

Run both desktop and mobile resolution tests:

```bash
STACK=prod yarn test:all
```

## Notes

- The current scaffold uses an actions-based fixture pattern.
- `src/utils/fixtures/baseTest.ts` defines reusable fixtures and injects `homePageActions`.
- `src/tests/us/homepage/homepage.spec.ts` demonstrates a sample Himarley homepage flow with production URL.
