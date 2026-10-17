# P11: AirCond Servicing Marketplace

A two-sided marketplace where customers find and book aircond servicing. Customers keep a registry of their aircond units with full service history; contractors work from their own workspace. Payments go through the platform, which earns commission per booking plus a contractor subscription.

## Status

| Item | State |
| --- | --- |
| Product spec | Draft v0.1, for review |
| Decision records | 5 accepted |
| Database schema | Written and tested locally (33 tables, 10 migrations, 109 checks passing). Not yet applied to a Supabase project |
| Application (web, mobile) | Not started |

## Contents

```
P11-ACServiceMarketpplace/
├── README.md
├── docs/
│   ├── product/
│   │   └── 01-product-spec.md      Vision, roles, flows, features, payments, MVP scope
│   ├── decisions/
│   │   ├── README.md               Index of decision records
│   │   └── ADR-0001 … ADR-0005     Ownership, access, revenue, payments, database approach
│   └── database/
│       ├── README.md               Rules, access matrix, money, how to run the tests
│       ├── erd.md                  Entity relationship diagram (generated)
│       └── data-dictionary.md      Every table and column (generated)
└── supabase/
    ├── migrations/                 0001 … 0010, applied in order
    └── tests/                      Local test runner and the 109-check suite
```

## Start here

1. Read the [product spec](docs/product/01-product-spec.md).
2. Review the [decision records](docs/decisions/README.md).
3. Read the [database overview](docs/database/README.md).
4. Answer the open questions at the end of the spec (launch area, rates, payment gateway).

## Conventions

- Documents are Markdown; diagrams use Mermaid so they render on GitHub and in most editors.
- Numbered prefixes (`01-`) set reading order within a folder.
- Changes to settled decisions are made by adding a new decision record, not by editing an old one.
- Schema changes are new migration files. Do not edit a migration once it has been applied to a real project.
