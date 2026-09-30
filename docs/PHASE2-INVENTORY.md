# Phase 2 page and route inventory

Sources: **V** = walkthrough video (devsia.vercel.app, 10 Sep 2026), **H** = Handover Documentation, **D** = recovered Home design artifact, **S** = vendor API PDF.
Data: **Static** = local files in this repo, **Mock** = mock provider behind a service interface, **CRM later** = PropDesk, **MongoDB later** = CMS phase.
Confidence: **High** = seen clearly in V and/or D. **Medium** = seen in V, some parts unseen. **Low** = mostly inferred.

| Page | Route | Sources | Main sections | Data | Interactions | Confidence | Unresolved |
|---|---|---|---|---|---|---|---|
| Home | `/` | D, V, H | Hero + search tabs, trust strip, highlights (hidden when nothing featured), upcoming projects, localities, why DevSia, insights, enquiry CTA, associate strip | Mock properties, static content | Tab switch changes locations and budget placeholders, search opens `/properties?...` | High (D) / Medium (rest) | Upcoming projects, quote and credentials are placeholders in the original; localities rebuilt from live facets |
| Properties | `/properties` | V, H | Breadcrumb, count, filter panel, card grid, pagination, loading, empty, error | Mock now, CRM later | URL driven filters (type, location, minPrice, maxPrice), reset, save heart | High | Page size (12), multi-select URL form, and filter apply behaviour are assumed. No BHK or sale/rent filter: none is in V or S |
| Property detail | `/properties/[slug]` | V, H, S | Gallery, badges, price, tabs (Overview, Location, Approvals), enquiry sidebar (prefilled), advisory desk, listing details, site visit card | Mock now, CRM later | Gallery thumbnails, tabs, save, enquiry form | Medium | S has no detail endpoint. "Request a callback" and "Book a site visit" both jump to the enquiry form (inferred) |
| New projects | `/new-projects` | H | Project grid (same components as Home) | Static placeholders, CRM later | None | Low | Returns 404 while `NEW_PROJECTS_LIVE` is false (H). The original page was never seen in V |
| Insights | `/insights` | V | Heading, category chips with counts, search, featured article, grid, "Latest" list | Static, MongoDB later | `?q=` search, `?tag=` category, paging | High | Page size (9) assumed |
| Article | `/insights/[slug]` | V | Header, cover, On this page contents, body blocks, tags, author card, callback card, related reading | Static, MongoDB later | Contents anchors, callback form | Medium | Only 1 of 8 article bodies recovered. 5 of 8 slugs are guessed from titles |
| Enquire | `/enquire` | V, H, S | Numbered form (details, type, location and budget, purpose and timeline, notes, consent), side panel | Mock lead provider, CRM later | Validation, sending, success, call instead | High | Call-time options assumed |
| Associates | `/associates` | V, H, S | Contact, experience, property types, practice, consent, partner desk | Mock lead provider, CRM later | Validation, success, speak to desk | High | none beyond the CRM |
| About | `/about` | V, H | Intro + stats, values, services, navy contact panel with form | Static, MongoDB later | Contact form (mock) | Medium | Photo not recovered (placeholder). Form's top fields unseen. Subject options assumed. Contact has no CRM endpoint (S) |
| Legal | `/legal` | V, H | Side nav, Privacy policy, Terms of use | Static | Anchor navigation | High | Text not reviewed by a lawyer |
| Wishlist | `/wishlist` | H | Saved listings, loading, empty, error | Browser storage + mock API | Save and remove | Low | Never shown in V. Layout inferred |
| Sitemap | `/sitemap.xml` | H | Static routes, listings, articles | Mock + static | – | Medium | – |
| Robots | `/robots.txt` | H | Allow all, block `/api/`, `/dev/`, `/wishlist` | – | – | Medium | Rules not recovered |
| 404 | any unknown URL | – | Message, links | – | – | Low | Not shown in V |

## Location experience
V shows locations as **filters and Home tiles**, not as separate pages. There is no `/locations` route in H or V, so none was added.
Each Home locality tile links to `/properties?location=...`.

## Not built because the sources do not establish them
BHK and sale/rent filters, a featured properties page, a brochure download, social links (none appear in V or the footer), a mobile menu design (V is desktop only).
