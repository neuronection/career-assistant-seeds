# Format: `assessment_questions` (v1)

One item = one question of the standardised assessment bank.

```json
{
  "metadata": {
    "item_type": "assessment_questions",
    "format": "assessment_questions",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "assessment-question:charity-event-role",
      "prompt": "A friend asks you to help organize a big local charity event. Which role do you quietly hope for?",
      "help": "Pick the one that feels most like you — there is no wrong answer.",
      "phase": 2,
      "kind": "scenario_mcq",
      "options": [
        {
          "id": "o1",
          "label": "Running the spreadsheet: budget, donors, numbers",
          "detail": "Someone has to keep the money honest.",
          "scores": {
            "skill_levels": { "organization": 3 },
            "interest_keys": ["business-finance"]
          }
        }
      ],
      "sort_index": 1,
      "audience_stages": ["student"],
      "time_split": null
    }
  ]
}
```

- `seed_key` is `assessment-question:<question-key>`; the body is a stable slug, never the prompt text. Editing the prompt keeps the identity; a question whose prompt does not match a pinned key is never adopted.
- `phase` is 1..10; `kind` is one of `scenario_mcq`, `time_allocation`, `ranking`, `slider`.
- `options` carries at most 12 entries: `id`, `label`, optional `detail` and `scores` (`skill_levels`, `dimension_levels`, `interest_keys` up to 10, `constraint_value`).
- `sort_index` orders the phase; `audience_stages` (up to 10) narrows who sees the question; `time_split` is an optional allocation map.
- Caps: ≤ 50 questions per file; `prompt` and `help` ≤ 2,000 chars.
- Apply is immediate: a question lands `active`. Retirement sets `status='retired'` and never deletes the row — questions cloned into an assessment run and the answers referencing them survive a retirement.
- Bank packs require the `official` or `operator` trust tier; a community pack is refused at plan time.
