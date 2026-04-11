---
skill: concurrency-async
scope: python
profile: standard, full
tags: [async, concurrency, asyncio, threading, multiprocessing]
requires_bins: [python3, uv]
---

# Skill: Concurrency and Async Patterns

When and how to use `asyncio`, threading, and multiprocessing in Python. The wrong concurrency model for the workload type will either waste resources or provide no speedup at all.

---

## Decision Tree -- Which Concurrency Model

```
What type of work?
  |
  +-- I/O bound (HTTP, DB, file)?
  |     |
  |     +-- Library supports async? --> asyncio
  |     +-- Library is sync-only?   --> threading or asyncio.to_thread()
  |
  +-- CPU bound (computation, parsing, image processing)?
  |     --> multiprocessing or ProcessPoolExecutor
  |
  +-- Simple parallel tasks (no shared state)?
        --> concurrent.futures (ThreadPool or ProcessPool)
```

Why this matters: Python's GIL means threads do not provide CPU parallelism. Using threads for CPU-bound work gives the illusion of concurrency with no actual speedup. Conversely, using multiprocessing for I/O-bound work wastes memory on separate processes when threads or async would suffice.

---

## Asyncio Patterns

### Gathering Multiple Requests

```python
async def fetch_all(urls: list[str]) -> list[Response]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        return await asyncio.gather(*tasks)
```

### Semaphore for Rate Limiting

Without a semaphore, launching 10,000 tasks simultaneously will exhaust connections or trigger rate limits.

```python
sem = asyncio.Semaphore(10)  # max 10 concurrent

async def fetch_limited(client: httpx.AsyncClient, url: str) -> Response:
    async with sem:
        return await client.get(url)
```

### TaskGroup (Python 3.11+)

```python
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch("url1"))
    task2 = tg.create_task(fetch("url2"))
# Both done here, exceptions propagate properly
```

Why TaskGroup over gather:

| Aspect | `asyncio.gather` | `asyncio.TaskGroup` |
|--------|------------------|---------------------|
| Exception handling | Swallows exceptions by default | Cancels remaining tasks on first failure |
| Cancellation | Manual | Automatic -- structured concurrency |
| Ownership | Fire-and-forget style | Clear scope -- tasks belong to the group |
| Python version | 3.4+ | 3.11+ |

Prefer TaskGroup when targeting Python 3.11+. It makes the failure mode explicit: if one task fails, the others are cancelled and the exception propagates. With `gather`, failed tasks can go unnoticed.

---

## Error Handling in Async

1. Use TaskGroup (not gather) for exception propagation
2. Always handle cancellation explicitly:
   ```python
   try:
       await long_operation()
   except asyncio.CancelledError:
       await cleanup()
       raise  # Re-raise -- do not swallow cancellation
   ```
3. Use timeouts to prevent tasks from hanging indefinitely:
   ```python
   async with asyncio.timeout(30):
       result = await slow_operation()
   ```
4. Never use bare `except:` in async code -- it catches `CancelledError`, which breaks structured concurrency

---

## Threading Patterns

Use threading when you need to run sync-only libraries concurrently for I/O-bound work.

### ThreadPoolExecutor

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=5) as pool:
    futures = [pool.submit(sync_fetch, url) for url in urls]
    results = [f.result() for f in futures]
```

### Bridging Sync to Async

```python
async def process_file(path: str) -> Data:
    # Offloads blocking file I/O to a thread
    content = await asyncio.to_thread(Path(path).read_text)
    return parse(content)
```

### Thread Safety

- Use `threading.Lock` for shared mutable state (keep critical sections short)
- Use `queue.Queue` for producer/consumer patterns
- Prefer immutable data structures passed between threads over shared mutation

---

## When NOT to Use Async

Not everything benefits from concurrency. Async adds complexity -- only use it when the workload justifies it.

- Simple scripts with sequential logic (no concurrent I/O)
- CPU-bound work (use multiprocessing instead -- async provides zero benefit here)
- When the only I/O is reading local files (usually fast enough synchronously)
- When all libraries in use are synchronous (wrapping everything in `to_thread()` adds complexity with marginal benefit)

---

## Common Pitfalls

| Pitfall | Problem | Fix |
|---------|---------|-----|
| `asyncio.gather` with exceptions | Swallows errors silently | Use `TaskGroup` (3.11+) |
| Blocking call in async function | Freezes the entire event loop | Use `asyncio.to_thread()` |
| Global mutable state in threads | Race conditions, corrupted data | Use `Lock` or `Queue` |
| Creating too many tasks at once | Memory/connection exhaustion | Use `Semaphore` to cap concurrency |
| `async def` that never awaits | Wastes coroutine overhead, confuses readers | Make it a regular function |
| Mixing asyncio and threading | Complexity explosion, deadlock risk | Pick one model per component |
| `asyncio.run()` inside async context | `RuntimeError` -- loop already running | Restructure to stay async, or use `nest_asyncio` as last resort |
| `time.sleep()` in async code | Blocks the event loop | Use `asyncio.sleep()` |
| Catching `Exception` broadly | Also catches `CancelledError` (Python <3.11) | Catch specific exceptions, or re-raise `CancelledError` |
| Fire-and-forget tasks | Errors vanish, no cleanup | Always await tasks or use TaskGroup |
| Global event loop manipulation | Breaks when multiple libraries use asyncio | Use `asyncio.run()` at the top level only |

---

## Anti-Patterns

- `asyncio.run()` called from within an already-running event loop
- Fire-and-forget tasks (`create_task` without storing or awaiting the reference) -- errors are silently dropped
- Using `time.sleep()` instead of `asyncio.sleep()` in coroutines
- Global event loop variables (`loop = asyncio.get_event_loop()`) -- let `asyncio.run()` manage the loop
- Catching bare `Exception` in async code without re-raising `CancelledError`

---

## See Also

- [python-testing](python-testing.md) -- patterns for testing async code with `pytest-asyncio`
- [debugging-methodology](debugging-methodology.md) -- debugging concurrent race conditions and deadlocks
