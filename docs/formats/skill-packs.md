# Format: `skill_packs` (v1)

One item = one immutable version of an AI skill-pack instruction set.

```json
{
  "metadata": {
    "item_type": "skill_packs",
    "format": "skill_packs",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "skill-pack:cover-letter-voice/v1",
      "key": "cover-letter-voice",
      "version": 1,
      "title": "Cover letter voice",
      "task": "cv_cover_letter",
      "instructions": "Write confident, concrete, unhedged sentences..."
    }
  ]
}
```

- `seed_key` is `skill-pack:<key>/v<version>`; the body is the pack identity plus
  its version.
- `key` is a slug; `version` is a positive integer; `task` is a task key from the
  app's AI task registry (`interview_turn`, `cv_cover_letter`, `autopilot_run`, …).
- `instructions` is 1..20,000 chars of *tone and structure* guidance. Pack
  instructions are system-prompt data: no factual claims about a candidate, no
  user data.
- Caps: ≤ 50 pack versions per file.
- **Apply never publishes.** A new or changed version lands `draft`, so no model
  ever sees unreviewed instructions. An admin publishes explicitly
  (`POST /admin/providers/{source_id}/publish` with
  `{"seed_key": "skill-pack:<key>/v<version>"}`), which also retires the
  same-key predecessor; the last published version of a key cannot be retired.
- A published version is immutable: the same version with different instructions
  is a plan-time conflict. A correction bumps `version`.
- A key removed from the pack is a `SKILL_PACK_REMOVAL` warning, not an automatic
  retirement: retiring live AI behavior is an explicit admin action.
- Bank packs require the `official` or `operator` trust tier; a community pack is
  refused at plan time.
