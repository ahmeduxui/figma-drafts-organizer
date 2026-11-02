# Starter category projects

A starter set of numbered category projects that works well for UI and
dashboard design files. Your team may have none of these yet — the skill
creates each one the first time a file needs it. Adapt the names to your work.

These are the numbered category projects files get filed into. The folder **key**
is what `window.moveFile(key, "<folder key>", name)` expects — match it exactly
as it appears in `window.__folders` (most carry a trailing ` Dashboard`).

| # | Category | Folder key |
|---|---|---|
| 01 | Blog | 01 - Blog Dashboard |
| 02 | Finance & Insurance | 02 - Finance & Insurance Dashboard |
| 03 | SaaS | 03 - SaaS Dashboard |
| 04 | UI Components | 04 - UI Components |
| 05 | LMS | 05 - LMS Dashboard |
| 06 | Real Estate | 06 - Real Estate Dashboard |
| 07 | Crypto | 07 - Crypto Dashboard |
| 08 | HR | 08 - HR Dashboard |
| 09 | Analytics | 09 - Analytics Dashboard |
| 10 | AI | 10 - AI Dashboard |
| 11 | Delivery | 11 - Delivery Dashboard |
| 12 | Food & Restaurant | 12 - Food & Restaurant Dashboard |
| 13 | Job & Career | 13 - Job & Career Dashboard |
| 14 | Medical & Health | 14 - Medical & Health Dashboard |
| 16 | Influencer & Creator | 16 - Influencer & Creator Dashboard |
| 17 | Sports | 17 - Sports Dashboard |
| 18 | Beauty | 18 - Beauty Dashboard |
| 19 | E-Commerce | 19 - E-Commerce Dashboard |
| 20 | Transportation | 20 - Transportation Dashboard |
| 21 | Event | 21 - Event Dashboard |
| 22 | Music | 22 - Music Dashboard |
| 23 | Advertising | 23 - Advertising Dashboard |
| 24 | Project Management | 24 - Project Management Dashboard |
| 25 | Social Media | 25 - Social Media Dashboard |
| 27 | Booking & Scheduling | 27 - Booking & Scheduling Dashboard |
| 29 | Smart Home & IoT | 29 - Smart Home & IoT Dashboard |
| 30 | CRM | 30 - CRM Dashboard |
| 31 | Video Conferencing | 31 - Video Conferencing Dashboard |
| 32 | Document Editor | 32 - Document Editor Dashboard |
| 33 | Cloud Storage | 33 - Cloud Storage Dashboard |
| 34 | Association & Membership | 34 - Association & Membership Dashboard |
| 35 | Inventory & ERP | 35 - Inventory & ERP Dashboard |
| 36 | Chat & Messaging | 36 - Chat & Messaging Dashboard |
| 37 | Agency & Portfolio Website | 37 - Agency & Portfolio Website |
| 38 | NFT Marketplace | 38 - NFT Marketplace Dashboard |
| 39 | Legal | 39 - Legal Dashboard |
| 40 | Email & Inbox | 40 - Email & Inbox Dashboard |
| 41 | Streaming & Video | 41 - Streaming & Video Dashboard |
| 42 | Weather | 42 - Weather Dashboard |
| 43 | Settings & Account | 43 - Settings & Account Dashboard |
| 44 | Gaming & Esports | 44 - Gaming & Esports Dashboard |
| 45 | Library & Reading | 45 - Library & Reading Dashboard |
| 46 | Time Tracking | 46 - Time Tracking Dashboard |
| 47 | Pitch Deck & Presentation | 47 - Pitch Deck & Presentation |
| 48 | UX Case Study | 48 - UX Case Study |
| 49 | Crowdfunding & Fundraising | 49 - Crowdfunding & Fundraising Dashboard |

## Keys WITHOUT the trailing " Dashboard"

`04 - UI Components`, `37 - Agency & Portfolio Website`,
`47 - Pitch Deck & Presentation`, `48 - UX Case Study`.

## Finding the next free number (for new categories)

This table is a snapshot — the live truth is `window.__folders` after
`loadFolders()`. To pick the next number for a brand-new category, scan the keys,
parse the leading integer, and add 1 to the max:

```javascript
Math.max(...Object.keys(window.__folders)
  .map(k => parseInt((k.match(/^(\d+)/)||[])[1] || 0))) + 1
```

If the sequence has gaps, that's fine — use the
**max + 1** so numbering keeps climbing, matching how the set has grown.

Name a new category in the same style: `<N> - <Category Name> Dashboard`
(drop ` Dashboard` only for website/case-study/deck/components-type categories,
following the four exceptions above).
