---
skill: frontend-patterns
scope: frontend
profile: standard, full
module: interface/frontend
tags: [react, tanstack, tailwind, frontend, ui, patterns]
---

# Skill: Frontend Patterns

Patterns for React 19 + TanStack Router + TanStack Query + Tailwind CSS v4. Emphasizes practical architecture over theoretical purity.

---

## Component Architecture

### Folder Structure: Feature-Based

Group by feature, not by type. A developer working on "orders" should find everything in one place.

```
src/
  features/
    orders/
      components/
      hooks/
      routes/
      types.ts
    users/
      components/
      hooks/
      routes/
      types.ts
  shared/
    components/    # truly shared UI (Button, Modal, etc.)
    hooks/         # truly shared hooks
    lib/           # utilities
```

Why not type-based (`src/components/`, `src/hooks/`): It scatters related code across the tree, making changes require jumping between many directories.

### Container/Presenter Split

- **Containers** fetch data, handle mutations, manage state
- **Presenters** receive props, render UI, emit events

This keeps presenters testable and reusable. Containers are thin wiring layers.

### Size Rule

Max ~150 lines per component file. When a component grows beyond this, it's doing too much -- extract sub-components or move logic to custom hooks.

---

## React 19

- **`use()` hook** for reading context and promises in render -- replaces some `useContext` patterns
- **Server Components** when your framework supports them (Next.js App Router) -- default to server, opt into client with `"use client"` only when needed
- **Data fetching**: Use TanStack Query, not `useEffect` + `useState`. The `useEffect` fetch pattern creates loading/error state bugs and race conditions
- **Memoization**: React Compiler handles most cases. Only add `useCallback`/`useMemo` when profiling shows a measured problem -- premature memoization adds complexity without benefit

---

## TanStack Router

| Pattern | How | Why |
|---------|-----|-----|
| File-based routing | `routes/orders.tsx`, `routes/orders.$id.tsx` | Type-safe, convention-based |
| Search params for state | `useSearch()` for filters, pagination, sort | Shareable URLs, back-button works |
| Loader pre-fetching | `loader` function on route definition | Data ready before render, no waterfall |
| Code splitting | Lazy route imports via `createLazyFileRoute` | Smaller initial bundle |

### Search Params Over Component State

If a user should be able to share a URL and see the same view, that state belongs in search params -- not `useState`. Filters, pagination, sort order, selected tab: all URL state.

---

## TanStack Query

### Query Key Convention

Structure keys as tuples for predictable invalidation:

```ts
// Pattern: ['resource', 'scope', params]
['users', 'list', { page: 1, role: 'admin' }]
['users', 'detail', userId]
['orders', 'list', { status: 'pending' }]
```

### Custom Hooks Per Resource

Encapsulate query logic -- components should not construct queries directly.

```ts
function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => api.users.get(id),
  })
}

function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.users.update,
    onSuccess: (data) => {
      queryClient.setQueryData(['users', 'detail', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}
```

### Operational Patterns

- **Optimistic updates** for mutations where latency matters (toggling, reordering)
- **Stale time**: Configure per resource -- user profile (5 min), notifications (30 sec), static config (1 hour)
- **Prefetch on hover/focus** for navigation links -- makes the next page feel instant

---

## Tailwind CSS v4

- **Utility-first**: Write utilities directly in JSX. Extract to a component only when the same combination repeats 3+ times
- **CSS custom properties** for theme tokens -- Tailwind v4 uses `@theme` in CSS instead of `tailwind.config.js`
- **Mobile-first**: Default styles are mobile, layer on `sm:`, `md:`, `lg:` for larger screens
- **Dark mode**: Use `dark:` variant with `prefers-color-scheme` or class-based toggle
- **Avoid `@apply`**: It defeats the purpose of utility-first. If you need shared styles, make a component

---

## Anti-AI-Slop Design

AI-generated UIs converge on a generic aesthetic. Fight it deliberately.

| Slop Pattern | Problem | Alternative |
|--------------|---------|-------------|
| Gradient backgrounds everywhere | Visual noise, looks template-generated | Solid colors, subtle texture if needed |
| Identical card shadows on every element | Flat visual hierarchy | Vary elevation intentionally |
| Excessive border-radius on everything | Looks toy-like, loses professionalism | Sharp corners by default, round sparingly |
| "Startup landing page" layout | Generic, doesn't serve the actual use case | Design for the content and user workflow |
| Random blues and purples | No design intent | Intentional palette tied to brand/function |

**Typography**: Create real hierarchy with weight and size contrast. Not every heading needs to be `text-4xl font-bold`.

**Color**: Every color should have a reason. Status colors (red=error, green=success), brand colors, and neutral grays -- that's usually enough.

---

## State Management

| State Type | Tool | Not This |
|------------|------|----------|
| Server data | TanStack Query | Redux, Zustand, or useState+useEffect |
| Global UI state | React Context | Redux (overkill for UI toggles) |
| Local UI state | `useState` | Context (over-engineering) |
| URL state | TanStack Router search params | useState (not shareable) |
| Form state | Controlled components or React Hook Form | Uncontrolled with manual DOM reads |

---

## Performance

1. **Lazy load** routes and heavy components (`React.lazy`, `createLazyFileRoute`)
2. **Image optimization**: Responsive `srcset`, WebP/AVIF formats, explicit dimensions to prevent layout shift
3. **Bundle analysis**: Run `npx vite-bundle-visualizer` periodically to catch bloat
4. **Layout shifts**: Always set `width`/`height` on images and media elements
5. **Network waterfalls**: Use route loaders and parallel queries to avoid sequential fetches

---

## See Also

- [progressive-disclosure](progressive-disclosure.md) -- applies to UI design as well as agent context loading
