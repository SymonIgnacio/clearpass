## Issue
Vite/Babel error: Adjacent JSX elements must be wrapped. The Dialog component was added as a sibling to the Box root element in the component return, causing multiple root elements.

## Fix
- Wrap the Box and the Dialog in a single enclosing element using a JSX fragment.
- No functional changes; only structure.

## Implementation
- In client/src/pages/Requests.jsx, change the component return to:
  - return (
    <> 
      <Box>...</Box>
      <Dialog>...</Dialog>
    </>
    )

## Verification
- Dev server compiles without the adjacent JSX error.
- Page renders normally; Reject modal opens and functions as expected.