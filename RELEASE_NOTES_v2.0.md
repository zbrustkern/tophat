# Tophat Financial 2.0 Release Notes 🎩✨

Welcome to **Tophat Financial 2.0**—a major evolution of our holistic financial planning platform!

## 🌟 What's New in 2.0

### 1. Tuxedo Deco Design System
- **Modern 1920s Art Deco Aesthetics**: Black onyx backdrop (`#0A0A0A`), crisp dress-shirt typography (Outfit & Inter), and brushed gold (`#D4AF37`) & brass (`#C5A059`) accents.
- **Architectural Lines & Glassmorphic UI**: Defined sharp geometry (`rounded-sm`), dark frosted-glass cards, and custom CSS geometric background patterns.
- **Recharts Color Themes**: Custom high-contrast metallic color schemes for all net worth and cash flow graphs.

### 2. Single Master Plan & Sub-Plan Integration
- **Unified Master Engine**: `useMasterCalculations` aggregates all active income sources, portfolios, budget items, real estate equity, 529 college funds, and savings goals into **One Master Plan**.
- **Interactive Click-Through Cues**: Master Dashboard cards feature interactive hover states and quick-jump navigation directly to sub-planner editors.
- **Graceful Fallbacks & Deduplication**: Smart deduplication ensures mortgages and auto debts are never double-counted between debt trackers, real estate PITI, and budget line items. Goal plans link directly to physical portfolios (`linkedPortfolioIds`).

### 3. Granular Asset Holdings & "Setup Later" Placeholders
- **Holdings Level Granularity**: Portfolios now support individual ticker holdings with share counts, current prices, and risk tier assignments (`Core`, `Growth`, `Speculative`, `Cash`).
- **Placeholder Accounts**: Support for "Setup Later" placeholder accounts so users can reserve portfolios by name during onboarding and detail them later.

### 4. Credit Card Float Maximization Engine
- **30-Day HYSA Cash Buffer Analysis**: Automatically calculates card-eligible monthly expenses (groceries, dining, utilities, travel) and calculates passive interest earned by retaining operating cash in a High-Yield Savings Account (HYSA) during the 30-day grace period.

### 5. Unified Onboarding Wizard
- Seamless 6-step wizard (`Step1_Welcome` through `Step6_Goals`) that automatically constructs a Firestore-ready Master Plan with pre-linked budget baselines and portfolios.

---

*Tophat Financial 2.0 — Tailored Wealth Engineering.*
