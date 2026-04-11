---
rule: python-imports
scope: python
profile: all
tags: [python, imports, organization]
---

# Python Import Rules

## Order

Three groups, separated by blank lines:

```python
# 1. Standard library
import json
import logging
from datetime import datetime
from decimal import Decimal
from pathlib import Path

# 2. Third-party
import httpx
from pydantic import BaseModel

# 3. Local (absolute only)
from src.domain.entities import Order
from src.infrastructure.connectors import AmazonClient
```

Let ruff sort within each group — don't sort manually.

## Rules

1. **Absolute imports only** — no `from .module import thing`
2. **No star imports** — `from module import *` is always wrong
3. **No unused imports** — ruff will catch these
4. **Prefer specific imports** — `from datetime import datetime` over `import datetime`
5. **Use `collections.abc`** for abstract types, not `typing` — `from collections.abc import Sequence`

## Clean Architecture Import Boundaries

```python
# ALLOWED — inward dependencies
from src.domain.entities import Order           # interface → domain
from src.domain.ports import OrderRepository    # application → domain
from src.application.use_cases import ...       # interface → application

# FORBIDDEN — outward dependencies
from src.infrastructure.database import ...     # domain must NOT import infra
from src.interface.api import ...               # domain must NOT import interface
from fastapi import ...                         # domain must NOT import frameworks
```

These boundaries apply at `standard`+ profiles. For `minimal` projects, flat module structure is fine.

## See Also

- `rules/python/type-hints.md` — `TYPE_CHECKING` import pattern for avoiding circular imports
- `rules/python/class-structure.md` — file-to-class naming conventions
