# Developer Docs Sources

This folder is the **canonical source** for the public SwiftBiu developer website.

## Edit here, not generated HTML

| Audience | Canonical files | Do not treat as source |
| --- | --- | --- |
| Official website (`swiftbiu.com/developer/...`) | `developer-modules/<slug>.md` and `<slug>.zh.md` | `SwiftBiuWeb/**/developer/*/index.html` |
| AI / plugin-generation skill | `references/*.md`, `AI_SKILL.md` | Generated `AI_SKILL_FULL.md` unless you are regenerating it |
| In-app plugin README | `SwiftBiu/Plugin/README.md` | Website HTML |

Website build path:

```text
SwiftBiuX-Template/developer-modules/*.md
    → SwiftBiuWeb/locales/developer-modules.json (slug + source paths)
    → SwiftBiuWeb/build.js
    → SwiftBiuWeb/developer/<slug>/index.html
    → SwiftBiuWeb/{lang}/developer/<slug>/index.html
```

Rules:

1. Change API wording in the matching `developer-modules` markdown first.
2. Keep EN and ZH pairs in sync (`background-api.md` / `background-api.zh.md`, etc.).
3. After editing, rebuild the website (`npm run build` in `SwiftBiuWeb`) so HTML is regenerated.
4. Do **not** hand-edit `SwiftBiuWeb/**/developer/**/index.html`. The next build overwrites it.
5. `references/` is for AI assistants and plugin authors. It is **not** rendered as the official site.
6. If an API change is user-facing, also update `SwiftBiu/Plugin/README.md` and the skill tables in `AI_SKILL.md` / `.agents/skills/swiftbiux-extension-dev/SKILL.md`.
