# GamerZ Hub — Internal IP, Ownership & Legal Documentation Checklist

> ⚠️ **INTERNAL — DO NOT PUBLISH**
>
> This document is for the operators of GamerZ Hub only. It is **not** a public
> website page and must never be linked from, or copied to, the public
> website. It describes what *should* be legally documented, not what *is* —
> nothing here is a legal claim, an agreement, or a record of fact.
>
> This document does **not** constitute legal advice. Have it and the public
> legal pages reviewed by qualified legal counsel (including, where relevant,
> an Indian lawyer / patent attorney) before relying on them.

## 1. Purpose

This checklist identifies the ownership and intellectual-property (IP)
matters that GamerZ Hub should document as the project grows. Where a record
does not yet exist, the corresponding entry below is a **placeholder** to be
completed with verified facts. Do not fabricate names, ownership percentages,
signatures, dates, or agreements.

## 2. Contributors & Inventors

| Item | Status | Notes |
| --- | --- | --- |
| List of all people who have contributed code, design, or content | ⬜ To complete | Name, role, dates of contribution |
| Record of who conceived each major feature/invention | ⬜ To complete | Needed for any future patent analysis |

## 3. Ownership

| Item | Status | Notes |
| --- | --- | --- |
| Entity or individual that owns GamerZ Hub | ⬜ To complete | Registered company name / registration number, or clear statement of individual ownership |
| Ownership split / percentages between stakeholders | ⬜ To complete | Only if applicable |
| Who owns the domain names, social handles, and brand assets | ⬜ To complete | Registrar/account records |
| Who owns the hosting / cloud accounts (Vercel, Render, Supabase, Stripe, Cloudinary, OpenAI) | ⬜ To complete | Account-owner records |

## 4. IP Assignment & Contributor Agreements

| Item | Status | Notes |
| --- | --- | --- |
| Written IP-assignment agreement with every contributor | ⬜ To complete | Assigns copyright in contributed code to the owner |
| Contributor License Agreement (CLA) template | ⬜ To complete | Needed before accepting external contributors |
| Independent-contractor agreements for paid work | ⬜ To complete | Include IP-assignment + confidentiality clauses |
| Record of signed agreements (who, what, when) | ⬜ To complete | Keep originals in a private, backed-up location |

## 5. Source-Code Ownership

| Item | Status | Notes |
| --- | --- | --- |
| Confirm all repository code is owned by / assigned to the owner | ⬜ To complete | Check git history for unassigned contributions |
| Policy for accepting third-party code into the repository | ⬜ To complete | Must be license-compatible; see open-source section |
| Record of any code reused from other projects and its license | ⬜ To complete | Map to the /licenses attribution page |

## 6. Confidentiality

| Item | Status | Notes |
| --- | --- | --- |
| NDA (non-disclosure agreement) template | ⬜ To complete | For contributors, contractors, and partners |
| Policy on what counts as confidential information | ⬜ To complete | Source code, credentials, business plans, user data |
| Access control to production secrets and databases | ⬜ Partially in place | See `.env` handling and `SECURITY.md`; document who has access |

## 7. Third-Party Contributions

| Item | Status | Notes |
| --- | --- | --- |
| Process for reviewing and accepting pull requests from non-owners | ⬜ To complete | Require CLA / IP assignment first |
| Record of all external contributions and their licenses | ⬜ To complete | Feeds the public /licenses page |

## 8. Open-Source Dependencies

| Item | Status | Notes |
| --- | --- | --- |
| Curated attribution page (/licenses) | ✅ In place | See `web/src/app/licenses/page.tsx` |
| Machine-readable full notices file (`THIRD_PARTY_NOTICES`) | ⬜ To complete | Generate from lockfiles with `license-checker` / `license-report` |
| License-compatibility review of dependencies | ⬜ To complete | Check copyleft licenses (GPL/AGPL) are not inadvertently incorporated |
| Review of `package-lock.json` for newly added dependencies | ⬜ Ongoing | Do this on every dependency change |

## 9. Patent-Related Records

| Item | Status | Notes |
| --- | --- | --- |
| Patent search / freedom-to-operate analysis | ⬜ To complete | Only if the operator decides patent protection is needed |
| Invention-disclosure records | ⬜ To complete | Written descriptions, dates, inventors |
| Patent applications filed | ❌ None known | **Do not claim patent or “patent pending” status anywhere (public pages included) unless/until a filing is actually made** |
| Public patent-status statement | ✅ Neutral wording in place | `web/src/config/legal.ts` → `LEGAL_PLACEHOLDERS.patentStatement` |

## 10. Trademarks

| Item | Status | Notes |
| --- | --- | --- |
| Trademark search for "GamerZ Hub" / "Gamer Hub" | ⬜ To complete | Before any registration |
| Trademark registration(s) | ⬜ None known | Do **not** claim registered-trademark status until verified |
| Brand-usage policy for third parties | ⬜ To complete | If needed |

## 11. Data / Privacy Records

| Item | Status | Notes |
| --- | --- | --- |
| Data-collection map (what is collected, why, where it lives) | ✅ In place | See `web/src/app/privacy/page.tsx` (mirrors the schema) |
| Records of processing activities (GDPR-style) where required | ⬜ To complete | Per-jurisdiction obligation review |
| Data-protection agreements with processors (Supabase, Stripe, Cloudinary, OpenAI, etc.) | ⬜ To complete | Review each provider’s DPA |

## 12. Recommended Next Steps

1. Decide and record the legal entity that operates GamerZ Hub.
2. Replace every `[[...]]` placeholder in `web/src/config/legal.ts` with verified facts.
3. Have the public legal pages reviewed by qualified legal counsel before relying on them.
4. Put IP-assignment/CLA processes in place **before** accepting external contributors.
5. Generate `THIRD_PARTY_NOTICES` from the lockfiles and keep it in the repository.
6. Do **not** add any patent, trademark, or company-registration claims to the website until verified records exist.
