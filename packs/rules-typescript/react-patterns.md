---
rule: typescript-react-patterns
scope: typescript
profile: all
tags: [typescript, react, tanstack, patterns]
---

# TypeScript & React Patterns

## TypeScript Standards

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
function parse(data: unknown): User {
  // validate and narrow
}

// Prefer const assertions for literal types
const CHANNELS = ["amazon", "ebay", "shopify"] as const;
type Channel = (typeof CHANNELS)[number];
```

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `OrderList.tsx` |
| Hooks | camelCase with `use` prefix | `useOrders.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types/Interfaces | PascalCase | `OrderItem` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |

## React 19

### Component Patterns

```tsx
// Prefer function components — no class components
function OrderCard({ order }: { order: Order }) {
  return (
    <div>
      <h3>{order.id}</h3>
      <p>{order.status}</p>
    </div>
  );
}

// Props interface when > 2 props
interface OrderListProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  showArchived?: boolean;
}

function OrderList({ orders, onSelect, showArchived = false }: OrderListProps) {
  // ...
}
```

### Avoid

- Class components
- Default exports (use named exports)
- `React.FC` — just type props directly
- Prop drilling beyond 2 levels — use context or composition

## TanStack Router

File-based routing with Vite:

```
src/routes/
├── __root.tsx          # Root layout
├── index.tsx           # /
├── orders/
│   ├── index.tsx       # /orders
│   └── $orderId.tsx    # /orders/:orderId
└── settings.tsx        # /settings
```

## TanStack Query

```typescript
// Query key factory
const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Query hook
function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
  });
}

// Mutation
function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

## Tailwind CSS v4

- Utility-first — avoid custom CSS unless truly needed
- Use `cn()` helper for conditional classes (from `clsx` + `tailwind-merge`)
- Component variants via `cva` (class-variance-authority) for reusable patterns

## Build & Dev

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npx tsc --noEmit     # Type check without emitting
```
