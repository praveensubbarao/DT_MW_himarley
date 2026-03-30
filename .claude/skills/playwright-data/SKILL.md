# Data utilities — Playwright + TypeScript

## Factories: tests/factories/

### User factory (tests/factories/user.ts)
```typescript
import { faker } from '@faker-js/faker';

export interface TestUser {
  email: string; password: string;
  firstName: string; lastName: string;
}

export const createUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: faker.internet.email({ provider: 'testable.dev' }),
  password: 'Test@12345',        // meets policy: upper, lower, digit, symbol
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  ...overrides,
});
```

### API client for seed/teardown (tests/utils/apiClient.ts)
```typescript
const api = request.newContext({ baseURL: process.env.BASE_URL });

export async function seedUser(data: TestUser) {
  const res = await (await api).post('/api/test/users', { data });
  return res.json() as Promise<{ id: string }>;
}

export async function deleteUser(id: string) {
  await (await api).delete(`/api/test/users/${id}`);
}
```

## Usage pattern
```typescript
test.describe('Profile edit', () => {
  let userId: string;

  test.beforeAll(async () => {
    const user = createUser({ firstName: 'Alice' });
    ({ id: userId } = await seedUser(user));
  });

  test.afterAll(async () => { await deleteUser(userId); });

  test('user can update display name', async ({ profilePage }) => { ... });
});
```

## Rules
- Seed in beforeAll, never beforeEach (avoid DB thrashing)
- Always delete in afterAll via API — never via UI
- Never hardcode emails; always use faker with @testable.dev domain
- All env secrets in .env.test (gitignored) and GitHub secrets
```

---

### Folder layout summary
```
/mnt/skills/user/
  playwright-pom/SKILL.md
  playwright-scaffolding/SKILL.md
  playwright-assertions/SKILL.md
  playwright-api-mocking/SKILL.md
  playwright-ci/SKILL.md
  playwright-data/SKILL.md
