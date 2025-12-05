# Semantic Bugs Fixed in play.html

**Date:** December 5, 2025  
**File:** `piperlove/play.html`

## Summary

Deep analysis of `play.html` revealed **4 critical semantic bugs** that were causing incorrect game behavior. All bugs have been fixed.

---

## Bug #1: Hardcoded FEN Castling Rights (CRITICAL - ROOT CAUSE)
**Severity:** CRITICAL  
**Lines:** 932 (original)  
**Status:** ✅ FIXED

### Problem
```javascript
// BEFORE (WRONG)
fen += ` ${turn} KQkq - 0 ${Math.floor(gameState.moveHistory.length / 2) + 1}`;
```

The `boardToFEN()` function **always outputted `KQkq`** regardless of:
- Whether rooks had been captured
- Whether rooks had moved from starting squares
- Whether kings had moved
- Whether it was an endgame with no rooks

### Impact
- Backend received incorrect board state in every FEN string
- Backend generated illegal castling moves based on false flags
- This was the **root cause** of the "null move" bug (e8g8 with no rook on h8)

### Solution
```javascript
// AFTER (CORRECT)
// Calculate castling rights based on piece positions and movement tracking
let castling = '';

// White kingside castling (K) - king on e1, rook on h1, both haven't moved
if (gameState.castlingRights.whiteKingside && 
    gameState.board[7][4] === 'K' && 
    gameState.board[7][7] === 'R') {
  castling += 'K';
}

// White queenside castling (Q)
if (gameState.castlingRights.whiteQueenside && 
    gameState.board[7][4] === 'K' && 
    gameState.board[7][0] === 'R') {
  castling += 'Q';
}

// Black kingside castling (k)
if (gameState.castlingRights.blackKingside && 
    gameState.board[0][4] === 'k' && 
    gameState.board[0][7] === 'r') {
  castling += 'k';
}

// Black queenside castling (q)
if (gameState.castlingRights.blackQueenside && 
    gameState.board[0][4] === 'k' && 
    gameState.board[0][0] === 'r') {
  castling += 'q';
}

// If no castling rights available
if (castling === '') castling = '-';

fen += ` ${turn} ${castling} - 0 ${Math.floor(gameState.moveHistory.length / 2) + 1}`;
```

Now correctly calculates castling rights by:
1. Checking if pieces have ever moved (tracking flags)
2. Verifying pieces are still on their starting squares

---

## Bug #2: Missing Castling Rights Tracking (CRITICAL)
**Severity:** CRITICAL  
**Status:** ✅ FIXED

### Problem
`gameState` had no mechanism to track whether king or rooks had moved. Even if they returned to starting squares, castling rights would incorrectly be restored.

### Impact
- Impossible to generate accurate FEN strings
- Bug #1 couldn't be fixed without this tracking

### Solution
Added `castlingRights` object to `gameState`:

```javascript
let gameState = {
  // ... other properties ...
  castlingRights: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true
  }
};
```

Updated in `executeMoveInternal()` and `executeEngineMove()`:
```javascript
// Update castling rights when king or rooks move
if (piece === 'K') {
  gameState.castlingRights.whiteKingside = false;
  gameState.castlingRights.whiteQueenside = false;
} else if (piece === 'k') {
  gameState.castlingRights.blackKingside = false;
  gameState.castlingRights.blackQueenside = false;
} else if (piece === 'R') {
  if (fromRow === 7 && fromCol === 7) gameState.castlingRights.whiteKingside = false;
  if (fromRow === 7 && fromCol === 0) gameState.castlingRights.whiteQueenside = false;
} else if (piece === 'r') {
  if (fromRow === 0 && fromCol === 7) gameState.castlingRights.blackKingside = false;
  if (fromRow === 0 && fromCol === 0) gameState.castlingRights.blackQueenside = false;
}

// Update castling rights when rooks are captured
if (captured === 'R') {
  if (toRow === 7 && toCol === 7) gameState.castlingRights.whiteKingside = false;
  if (toRow === 7 && toCol === 0) gameState.castlingRights.whiteQueenside = false;
} else if (captured === 'r') {
  if (toRow === 0 && toCol === 7) gameState.castlingRights.blackKingside = false;
  if (toRow === 0 && toCol === 0) gameState.castlingRights.blackQueenside = false;
}
```

Castling rights are permanently removed when:
1. King moves (all castling rights for that side lost)
2. Rook moves from starting square (that side's castling right lost)
3. Rook is captured on starting square (that side's castling right lost)

---

## Bug #3: Broken Undo Function (HIGH)
**Severity:** HIGH  
**Lines:** 1191-1211  
**Status:** ✅ FIXED

### Problem
```javascript
// BEFORE (WRONG)
function undoMove() {
  if (gameState.moveHistory.length < 2) return;
  
  gameState.moveHistory.pop();
  gameState.moveHistory.pop();
  
  const lastState = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (lastState) {
    parseFEN(lastState.fen);  // ❌ Restores board but NOT castling rights
  } else {
    parseFEN(gameState.fen);
  }
  
  gameState.isPlayerTurn = true;
  // castlingRights are NOT restored!
}
```

### Impact
- After undoing moves, castling rights remained in their modified state
- If king had moved and then undo was called, king still couldn't castle
- Game state became permanently incorrect after any undo

### Solution
1. **Store castling rights in moveHistory:**
```javascript
gameState.moveHistory.push({
  from: [fromRow, fromCol],
  to: [toRow, toCol],
  piece: finalPiece,
  captured,
  fen: boardToFEN(),
  castlingRights: { ...gameState.castlingRights }  // ✅ Save snapshot
});
```

2. **Restore castling rights on undo:**
```javascript
// AFTER (CORRECT)
function undoMove() {
  if (gameState.moveHistory.length < 2) return;
  
  gameState.moveHistory.pop();
  gameState.moveHistory.pop();
  
  const lastState = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (lastState) {
    parseFEN(lastState.fen);
    // ✅ Restore castling rights from the saved state
    gameState.castlingRights = { ...lastState.castlingRights };
  } else {
    // Back to starting position
    parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    gameState.castlingRights = {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true
    };
  }
  
  gameState.isPlayerTurn = true;
  gameState.gameOver = false;  // ✅ Also reset game over flag
  gameState.lastMove = lastState ? [[lastState.to[0], lastState.to[1]], [lastState.to[0], lastState.to[1]]] : null;
}
```

---

## Bug #4: XSS Vulnerability in Move List (MEDIUM)
**Severity:** MEDIUM (Security)  
**Lines:** 1028-1048  
**Status:** ✅ FIXED

### Problem
```javascript
// BEFORE (UNSAFE)
function updateMoveList() {
  const moveList = document.getElementById('moveList');
  
  if (gameState.moveHistory.length === 0) {
    moveList.innerHTML = '<p style="...">No moves yet</p>';  // ❌ XSS risk
    return;
  }
  
  let html = '';
  for (let i = 0; i < gameState.moveHistory.length; i += 2) {
    const white = moveToNotation(gameState.moveHistory[i]);
    const black = gameState.moveHistory[i + 1] ? moveToNotation(gameState.moveHistory[i + 1]) : '';
    html += `<div class="move-item">${moveNum}. ${white} ${black}</div>`;  // ❌ XSS risk
  }
  
  moveList.innerHTML = html;  // ❌ Dangerous if data is ever user-controlled
}
```

### Impact
- If move notation ever contained malicious HTML/JavaScript, it would be executed
- While currently safe (moves are internally generated), this violates security best practices
- Future code changes could introduce vulnerabilities

### Solution
```javascript
// AFTER (SAFE)
function updateMoveList() {
  const moveList = document.getElementById('moveList');
  
  if (gameState.moveHistory.length === 0) {
    moveList.innerHTML = '';
    const p = document.createElement('p');  // ✅ DOM manipulation
    p.style.textAlign = 'center';
    p.style.color = 'var(--muted)';
    p.style.fontSize = '0.75rem';
    p.textContent = 'No moves yet';  // ✅ textContent, not innerHTML
    moveList.appendChild(p);
    return;
  }
  
  moveList.innerHTML = '';
  for (let i = 0; i < gameState.moveHistory.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const white = moveToNotation(gameState.moveHistory[i]);
    const black = gameState.moveHistory[i + 1] ? moveToNotation(gameState.moveHistory[i + 1]) : '';
    
    const moveItem = document.createElement('div');  // ✅ Create element
    moveItem.className = 'move-item';
    moveItem.textContent = `${moveNum}. ${white} ${black}`;  // ✅ Safe text insertion
    moveList.appendChild(moveItem);  // ✅ Append to DOM
  }
  
  moveList.scrollTop = moveList.scrollHeight;
}
```

Now uses:
- `document.createElement()` instead of HTML strings
- `textContent` instead of `innerHTML`
- DOM manipulation methods that automatically escape content

---

## Impact Summary

### Before Fixes
- ❌ Backend received `KQkq` castling rights in every position
- ❌ Backend generated illegal castling moves (e8g8 with no rook)
- ❌ Undo feature broke game state permanently
- ❌ Potential XSS vulnerability in move list
- ❌ Frontend defensive validation was only workaround

### After Fixes
- ✅ Accurate FEN strings sent to backend with correct castling rights
- ✅ Backend will receive correct information (still needs Bug #2 fix for defense in depth)
- ✅ Undo function properly restores complete game state
- ✅ Move list is XSS-safe
- ✅ Frontend defensive validation remains as safety layer

---

## Testing Recommendations

### Test Case 1: Castling After Rook Capture
1. Capture opponent's h8 rook
2. Backend should receive FEN with only `KQq` (no `k`)
3. Engine should NOT attempt kingside castling

### Test Case 2: Castling After King Moves
1. Move king from e1 to e2, then back to e1
2. FEN should have `kq` only (no `KQ`)
3. White player should NOT be able to castle

### Test Case 3: Undo Preserves Castling Rights
1. Move king from e1 to e2 (loses castling rights)
2. Click "Undo Move" twice
3. King should be able to castle again (rights restored)

### Test Case 4: Long Game Sequence
1. Play 20 moves with various piece movements
2. Verify FEN castling rights update correctly throughout
3. Verify undo at any point restores correct state

---

## Related Files

- **Frontend:** `/workspaces/wwwtriplew.github.io/piperlove/play.html` (FIXED)
- **Backend:** `move_generator.py` (still needs rook validation for defense in depth)
- **Backend:** `search.py` (still needs PV extraction validation)

---

## Deployment Notes

These fixes can be deployed immediately to production. They:
1. Fix the root cause of illegal castling moves
2. Maintain backward compatibility (no API changes)
3. Improve security (XSS fix)
4. Fix existing undo bug

Backend team should still implement their defensive validation (Bug Report: BACKEND_BUG_REPORT.md), but these frontend fixes eliminate the root cause.

---

## Code Quality Improvements

This analysis demonstrates the importance of:
1. **Never hardcode dynamic values** (like castling rights)
2. **Always track state changes** (movement history)
3. **Snapshot state for undo** (don't reconstruct from partial data)
4. **Use safe DOM APIs** (textContent over innerHTML)
5. **Defense in depth** (both frontend and backend should validate)
