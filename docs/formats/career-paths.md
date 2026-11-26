# Format: `career_paths` (v1)

One item = one curated starter path to a destination job.

```json
{
  "metadata": {
    "item_type": "career_paths",
    "format": "career_paths",
    "format_version": 1,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "career-path:software-developer/classic-study-route",
      "job": "software-developer",
      "title": "The classic study route",
      "description": "Secondary school → CS degree → junior developer.",
      "steps": [
        { "kind": "education", "education_level": "high_school", "label": "Focus on maths and CS" },
        { "kind": "experience", "skill_key": "programming", "label": "Build small projects" }
      ]
    }
  ]
}
```

- `seed_key` is `career-path:<job>/<title-slug>`; titles are display-only and
  never used for identity.
- Steps are typed: `education` (level), `experience`/`certification` (optional
  skill), `job` (optional family); `label` is display copy.
- A removed path retires (`status='retired'`); user/AI paths are untouched.
- Caps: ≤ 500 paths per file; ≤ 20 steps; slug + job must fit the 120-char
  key-body limit.
