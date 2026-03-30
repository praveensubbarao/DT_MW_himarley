# Project overview
This is a Playwright + TypeScript E2E test suite for the MyApp checkout flow.

# Stack
- Playwright 1.44, TypeScript 5.x
- Test runner: @playwright/test
- Reporting: allure-playwright
- Node 20+

# Conventions
- All tests import { test, expect } from '../fixtures' — never from @playwright/test
- Selectors use data-testid exclusively
- Page objects extend BasePage (tests/pages/BasePage.ts)
- Factories in tests/factories/, mocks in tests/mocks/

# Commands
- npm run test:smoke     → playwright test --grep @smoke
- npm run test:all       → playwright test
- npm run report         → allure generate && allure open

# Do not
- Never use page.waitForTimeout()
- Never hardcode test emails
- Never import page objects directly in tests — use fixtures

# File structure
tests/
  pages/       ← page objects
  fixtures/    ← custom test/expect
  factories/   ← data builders
  mocks/       ← JSON fixtures
  utils/       ← shared helpers

# Skills
Before generating any test code, read the relevant skill file:
- Page objects → read tests/.claude/skills/playwright-pom/SKILL.md
- Test scaffolding → read tests/.claude/skills/playwright-scaffolding/SKILL.md
