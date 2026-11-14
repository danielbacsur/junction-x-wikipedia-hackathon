# The design council

Before the data model was fixed, two different frontier models were given
the same brief and asked to propose a design independently, then to attack
a synthesis of their proposals until they could sign it. The files here are
that argument, unedited apart from replacing paths on the laptop with what
they pointed at.

| File                                       | What it is                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| [0-brief.md](0-brief.md)                   | What both models were told: the challenge, the data, the machine, the deadline |
| [1-proposal-fable.md](1-proposal-fable.md) | Fable's proposal: every paragraph a row with a lifetime and a meaning          |
| [1-proposal-astra.md](1-proposal-astra.md) | Astra's proposal: evidence first, a bounded corpus, exact search               |
| [2-synthesis.md](2-synthesis.md)           | What had been measured by then, and the design put to both                     |
| [3-critique-fable.md](3-critique-fable.md) | Fable's attack on it, and what it conceded                                     |
| [3-critique-astra.md](3-critique-astra.md) | Astra's attack on it, and what it conceded                                     |

## What the argument changed

- **The key of a passage is the hash of its wording, not a paragraph slot.**
  Fable proposed stable slots that survive rewording. Astra objected that
  alignment can manufacture change, and Fable conceded after measuring that
  11 % of one article's versions are returns to an earlier state: rebuilding
  an article proves its text, not which paragraph became which. Slot
  survives as a scored column, and every page labels it as our reading.
- **Vectors are not versioned.** One vector per distinct wording in a plain
  table, time by joining the versioned table. The versioned vector index
  became a lab with a promotion rule (95 % recall), and failed it at 13 %.
- **A date-pinned session cannot be trusted to hide the future.** Fable
  withdrew its own claim: `system_versioning_asof` pins versioned tables
  only, so every query states its time clause on each versioned table.
- **Both asked for the same validation:** a wording alive only between two
  dates must be found inside that window and never outside it. It is one of
  the seven checks in `npm run validate`.

Both signed with the same amendment: evidence comes from exact wordings and
their lifetimes, and anything inferred is shown as interpretation.
