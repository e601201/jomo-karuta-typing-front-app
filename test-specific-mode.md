# Test Instructions for Specific Card Practice Mode Fix

## Test Steps:

1. Navigate to http://localhost:5173/practice/specific
2. Select 2-3 cards (e.g., あ, い, う)
3. Click "練習開始" (Start Practice)
4. Open browser console to see debug logs
5. Verify the game only shows the selected cards

## Expected Console Output:

```
=== SPECIFIC MODE START PRACTICE ===
Selected cards count: 3
Generated practice cards: 3 cards
Practice cards IDs: ['a', 'i', 'u']
First practice card: {id: 'a', ...}
Practice mode store after init: {
  cardsLength: 3,
  firstCard: {id: 'a', ...},
  currentIndex: 0
}
+page.ts: practice mode from specific, skipping card load
initializeGame started
cards from data: 0 first card: undefined isFromSpecificMode: true
Initializing practice mode
Using existing cards from specific mode: 3
```

## What Was Fixed:

1. **+page.ts**: Modified to not load all cards when `specific=true` parameter is present
2. **+page.svelte**: Updated to use `isFromSpecific` flag from page data instead of URL params
3. **specific/+page.svelte**: Added detailed logging to track card selection and initialization
4. **Game initialization logic**: Properly handles the case when coming from specific mode selection

## Key Changes:

- The page load function now returns an `isFromSpecific` flag
- When this flag is true, the page.ts doesn't load all 44 cards
- The game page checks for existing cards in practiceModeStore when isFromSpecific is true
- Added proper error handling for edge cases

## Success Criteria:

✅ Only selected cards appear in the game (not all 44)
✅ Cards are shown in the correct order/shuffle based on settings
✅ Progress bar shows correct total (e.g., 3/3 not 3/44)
✅ Game completes after typing all selected cards
