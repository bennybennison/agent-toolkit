---
applyTo: "**/*.{ts,tsx}"
description: "TypeScript and React coding standards — strict mode, type patterns, React 19, TanStack Router/Query. Use when writing or reviewing TypeScript or React code."
---

# TypeScript & React Standards

## TypeScript

### Strict Mode

All projects use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Patterns

```typescript
// Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions, intersections, utilities
type Status = "active" | "paused" | "deleted";
type UserWithRole = User & { role: Role };

// Never use `any` — use `unknown` and narrow
function parseInput(raw: unknown): Config {
  if (!isConfig(raw)) throw new Error("Invalid config");
  return raw;
}
```

### Naming

- Interfaces/types: PascalCase (`UserProfile`, `OrderStatus`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE for true constants, camelCase for derived values
- Files: kebab-case (`user-profile.ts`, `order-service.ts`)

## React (19+)

### Component Patterns

```tsx
// Function components only — no class components
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <button onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}
```

### State & Data

- Server state: TanStack Query (`useQuery`, `useMutation`)
- Client state: `useState` / `useReducer` for local, Zustand for shared
- Forms: React Hook Form + Zod validation
- Routing: TanStack Router (file-based routes)

### Styling

- Tailwind CSS v4 — utility classes, no CSS modules or styled-components
- Use `cn()` helper for conditional classes (from `clsx` + `tailwind-merge`)

### Rules

- Props interfaces adjacent to component (same file)
- No prop drilling beyond 2 levels — use context or composition
- Custom hooks for reusable logic (`useAuth`, `useDebounce`)
- Collocate tests: `user-card.test.tsx` next to `user-card.tsx`
