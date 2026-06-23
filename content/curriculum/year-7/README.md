# content/curriculum/year-7 — Source Materials

## What the CSV files are

The `VC2M*.csv` files are official VCAA exports from the Victorian Curriculum v2.0 F–10.
They are downloaded directly from https://f10.vcaa.vic.edu.au and contain:

| Column | What it gives us |
|---|---|
| `Content description` | The exact learning objective — becomes the scope statement for the JSON file |
| `Content description code` | VC2M code (e.g. `VC2M7N01`) — maps 1-to-1 to the project's AC9M code |
| `Elaboration` | Concrete teaching examples — the richest source for question stems |

## Code mapping

The project uses ACARA v9 codes (`AC9M*`). The CSVs use Victorian Curriculum v2 codes (`VC2M*`).
They describe the same content — the numbering aligns directly:

| CSV code | Project code | Topic |
|---|---|---|
| VC2M7N01 | AC9M7N01 | Perfect squares and square roots |
| VC2M7N02 | AC9M7N02 | Index notation and powers of 10 |
| VC2M7N03 | AC9M7N03 | Prime factorisation |
| VC2M7N04 | AC9M7N04 | Fractions, decimals, percentages |
| VC2M7N05 | AC9M7N05 | Rounding decimals |
| VC2M7N06 | AC9M7N06 | Integer operations |
| VC2M7N07 | AC9M7N07 | Adding/subtracting fractions |
| VC2M7N08 | AC9M7N08 | Multiplying/dividing fractions |
| VC2M7N09 | AC9M7N09 | Percentages of quantities |

## How to turn a CSV into questions

Each elaboration row is a teaching scenario. A single elaboration typically yields 3–4 questions
at difficulty 1–3. Workflow:

1. Read the elaboration — it tells you exactly what students should be able to do
2. Write a question stem using the example (or a variation of it)
3. Write 3 progressive hints: nudge → more detail → near-answer
4. Write the worked solution step-by-step
5. Note 1–2 common wrong answers as `common_errors` with a `contextual_hint` for each
6. Set `verified: false` until a mathematician has reviewed it
7. Move the finished JSON to `content/curriculum/year-7/<strand>/AC9M7N0X.json`
   and set `verified: true` after sign-off

## Example — VC2M7N01 elaboration → question

**Elaboration:** "determining between which 2 consecutive natural numbers the square root of a
given number lies; for example, 43 is between 36 and 49 so √43 is between 6 and 7"

**Becomes:** "Between which two consecutive whole numbers does √70 lie?" (difficulty 2, numeric
range answer, common error: students try √70 ≈ 35 by halving)

## Files in this directory

### Single-code exports
- `VC2M7N01_23-06-2026.csv` — VCAA export for squares and square roots (maps to AC9M7N01)

### Full Year 7 bulk exports (`VC2-CurriculumExport_23-06-2026/`)
All four files cover the same 31 codes. Choose based on what you need:

| File | What's extra | Best for |
|---|---|---|
| `VC2_AS-CD-Elab_23-06-2026.csv` | Nothing extra — cleanest | Quick reference |
| `VC2_AS-CD-Elab-CCP_23-06-2026.csv` | Cross-curriculum priorities | Checking Indigenous/sustainability links |
| `VC2_ASExtract-CD-Elab_23-06-2026.csv` | Per-code AS extract + mode | Mapping each code to its achievement standard sentence |
| `VC2_ASExtract-CD-Elab-CCP_23-06-2026.csv` | AS extract + CCP — **richest** | Question authoring (use this one) |

The richest file has been processed into `docs/year-7-vc2m-content-descriptions.md` — that's the primary reference for question authors.

### Question files
- `number/AC9M7N01.json` — verified (20 questions, ready to ship)
