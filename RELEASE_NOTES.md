# Release Notes

## [v1.1.0] - 2026-06-24

### Added
- **Fixed Savings Amount for Income Planner**: Introduced option to plan annual savings as a fixed dollar amount instead of just a percentage of income.
- **Safe Withdrawal Rate (SWR) for Savings Planner**: Exposed withdrawal rate configuration to let users tweak the percentage of portfolio assets they withdraw annually to make up their passive income.
- **Advisory Info Banner on SWR**: Added a detailed context panel to guide users on safe withdrawal practices, highlighting the industry-standard "4% Rule" (Trinity Study) and explaining the risks of sequence-of-returns volatility.
- **Vitest Unit Testing Framework**: Set up Vitest and React Testing Library to test custom hook calculations and verify mathematical correctness.
- **Saved Plan Loading & Routing**: Configured routing and lifecycle rendering to automatically load and calculate state for saved plans from firebase.

### Changed
- Refactored `useIncomeCalculations` and `useSavingsCalculations` hooks to incorporate the new fixed savings amount and withdrawal rate math.
- Extended the `IncomeDetails` and `SavingsDetails` interfaces to include optional `saveMode`, `saveAmount`, and `withdrawalRate` types.
- Updated `PlanPreview` to conditionally show either savings rate or savings amount based on the plan's savings mode.
