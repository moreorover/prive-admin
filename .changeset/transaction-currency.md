---
"web": minor
---

feat: GBP/EUR currency support for transactions

- Stores currency on each transaction; defaults new transactions to the signed-in user's preferred currency (overridable per transaction).
- Adds `user_settings` table holding each app user's preferred currency; picker on the profile page.
- Customer summary, appointment totals, and dashboard stats render split per-currency totals — no FX conversion.
- Hair and order pricing remain GBP-only.
