# Contributing Guidelines

To ensure the quality and clarity of the project's history, this repository enforces the **Conventional Commits** specification for all commit messages.

### Automated Validation

We provide a Git hook that automatically checks your commit message format. To enable it, you **must** run the following command once after cloning the repository:

```bash
./scripts/install-hooks.sh
```

After installation, any `git commit` with a non-compliant message will be automatically rejected with a helpful guide.

### Commit Message Format

Your commit message must follow this structure:

```
<type>(<scope>): <subject>
```

*   **Type**: Must be one of the following: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.
*   **Scope**: (Optional) The module affected by the change (e.g., `Smart AI`, `UI`, `build`).
*   **Subject**: A short, clear description of the change.

**Example:**
```bash
git commit -m "feat(Smart AI): add support for streaming responses"
```

### Extension Kind (Required)

SwiftBiu now separates action routing by classified selection type:
* Plain text-only selections trigger `textAction` extensions.
* File-like selections trigger `fileAction` extensions. This includes native local file URLs, Finder file copies, temporary files materialized from rich clipboard/image/HTML/WebArchive payloads, and remote file-like URLs.
* If both text and file-like data are present, `fileAction` wins.

Each action entry must also include `actions[].extensionKind`. Keep it explicit and consistent with the action behavior to avoid routing mismatches.
