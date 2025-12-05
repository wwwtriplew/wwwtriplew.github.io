# Critical Bug Report: Illegal Castling Moves in Chess Engine API

**Date:** December 5, 2025  
**Reporter:** Frontend Developer  
**Severity:** CRITICAL  
**Status:** REQUIRES IMMEDIATE ATTENTION

## Executive Summary

During gameplay testing, the backend chess engine API is returning illegal castling moves that violate chess rules. The engine attempts to castle when the required rook is not present on the board, leading to "null moves" where pieces move from empty squares. This breaks the game and produces invalid evaluation scores.

---

## Bug #1: Frontend FEN Generation Hardcodes Castling Rights
**Severity:** CRITICAL - ROOT CAUSE  
**File:** `piperlove/play.html` (frontend repository, line 932)  
**Function:** `boardToFEN()`

### Backend Team Analysis (December 4, 2025)
The backend developers identified this as the **primary root cause**. The `boardToFEN()` function always outputs castling rights as `"KQkq"` regardless of whether rooks have been captured or moved.

### Current Code (Line 932)
```javascript
function boardToFEN() {
  // ... piece placement code ...
  
  // HARDCODED castling rights!
  fen += ` ${turn} KQkq - 0 ${Math.floor(gameState.moveHistory.length / 2) + 1}`;
  return fen;
}
```

### Problem
Every FEN sent to backend has `KQkq` castling rights, even in positions where:
- Rooks have been captured
- Rooks have moved from their starting squares
- King has moved (eliminating all castling rights)
- It's an endgame with no rooks at all

### Impact
The backend receives incorrect board state information and generates castling moves based on the false `KQkq` flags in the FEN string, leading to illegal move generation.

### Required Fix
```javascript
function boardToFEN() {
  let fen = '';
  
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      
      if (piece) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece;
      } else {
        empty++;
      }
    }
    
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }
  
  // Determine whose turn it is based on move history
  const turn = gameState.moveHistory.length % 2 === 0 ? 'w' : 'b';
  
  // FIX: Calculate actual castling rights based on piece positions
  let castling = '';
  
  // Check white kingside castling (K)
  if (gameState.board[7][4] === 'K' && gameState.board[7][7] === 'R') {
    castling += 'K';
  }
  
  // Check white queenside castling (Q)
  if (gameState.board[7][4] === 'K' && gameState.board[7][0] === 'R') {
    castling += 'Q';
  }
  
  // Check black kingside castling (k)
  if (gameState.board[0][4] === 'k' && gameState.board[0][7] === 'r') {
    castling += 'k';
  }
  
  // Check black queenside castling (q)
  if (gameState.board[0][4] === 'k' && gameState.board[0][0] === 'r') {
    castling += 'q';
  }
  
  // If no castling rights available
  if (castling === '') castling = '-';
  
  fen += ` ${turn} ${castling} - 0 ${Math.floor(gameState.moveHistory.length / 2) + 1}`;
  return fen;
}
```

### Note
This fix validates piece positions but doesn't track whether pieces have **moved** (a king or rook that returns to its starting square would incorrectly restore castling rights). For production, implement proper move tracking in `gameState` to permanently remove castling rights once king or rooks move.

---

## Bug #2: Missing Rook Validation in Castling Move Generation
**Severity:** HIGH (Secondary issue - backend should validate too)  
**File:** `move_generator.py` (backend repository)  
**Function:** `generate_castling_moves()`

### Symptoms
- Engine returns moves like `e8g8` (kingside castling) when there is no rook on `h8`
- Engine returns moves like `e8c8` (queenside castling) when there is no rook on `a8`
- Evaluation consistently shows `0.0cp` for these illegal moves
- PV (Principal Variation) shows infinite loops of the same illegal castling move

### Root Cause
While Bug #1 (frontend FEN) is the primary cause, the backend's `generate_castling_moves()` function should also defend against invalid input by checking castling rights flags **and validating that the rook actually exists** on the starting square (a1, a8, h1, h8) before generating the castling move. Defense in depth.

### Reproduction Steps
1. Start a new game
2. Capture the black kingside rook on h8 (e.g., after opening moves)
3. Backend still has `can_castle_kingside[BLACK] = True` flag set
4. Engine generates `e8g8` castling move even though h8 is empty
5. Frontend receives illegal move from empty square

### Evidence from Console Logs
```
[ENGINE] Backend move: e8g8 evaluation: 0.0 pv: e8g8 e8g8 e8g8 e8g8 e8g8
[ENGINE] Source square e8 is EMPTY! Cannot move from empty square.
[ENGINE] Invalid move from backend, rejecting: e8g8
```

### FEN Analysis
**Position where bug occurred:**
```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```
After rook captured, board shows no piece on h8, but backend still generates e8g8.

### Proposed Fix
```python
def generate_castling_moves(self, board, color, moves):
    """Generate castling moves with proper rook validation."""
    
    if color == WHITE:
        king_square = board.white_king_square
        
        # Kingside castling
        if board.can_castle_kingside[WHITE]:
            # CRITICAL: Validate rook exists on h1
            if board.squares[h1] == WHITE_ROOK:  # ADD THIS CHECK
                if board.is_square_empty(f1) and board.is_square_empty(g1):
                    if not board.is_square_attacked(e1, BLACK) and \
                       not board.is_square_attacked(f1, BLACK) and \
                       not board.is_square_attacked(g1, BLACK):
                        moves.append(Move(e1, g1, KING_CASTLE))
        
        # Queenside castling
        if board.can_castle_queenside[WHITE]:
            # CRITICAL: Validate rook exists on a1
            if board.squares[a1] == WHITE_ROOK:  # ADD THIS CHECK
                if board.is_square_empty(d1) and board.is_square_empty(c1) and board.is_square_empty(b1):
                    if not board.is_square_attacked(e1, BLACK) and \
                       not board.is_square_attacked(d1, BLACK) and \
                       not board.is_square_attacked(c1, BLACK):
                        moves.append(Move(e1, c1, QUEEN_CASTLE))
    
    else:  # BLACK
        king_square = board.black_king_square
        
        # Kingside castling
        if board.can_castle_kingside[BLACK]:
            # CRITICAL: Validate rook exists on h8
            if board.squares[h8] == BLACK_ROOK:  # ADD THIS CHECK
                if board.is_square_empty(f8) and board.is_square_empty(g8):
                    if not board.is_square_attacked(e8, WHITE) and \
                       not board.is_square_attacked(f8, WHITE) and \
                       not board.is_square_attacked(g8, WHITE):
                        moves.append(Move(e8, g8, KING_CASTLE))
        
        # Queenside castling
        if board.can_castle_queenside[BLACK]:
            # CRITICAL: Validate rook exists on a8
            if board.squares[a8] == BLACK_ROOK:  # ADD THIS CHECK
                if board.is_square_empty(d8) and board.is_square_empty(c8) and board.is_square_empty(b8):
                    if not board.is_square_attacked(e8, WHITE) and \
                       not board.is_square_attacked(d8, WHITE) and \
                       not board.is_square_attacked(c8, WHITE):
                        moves.append(Move(e8, c8, QUEEN_CASTLE))
```

### Test Case
```python
def test_castling_requires_rook():
    """Test that castling is not generated when rook is missing."""
    board = Board()
    board.set_fen("rnbqkbn1/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQq - 0 1")
    # Black rook on h8 is missing, but can_castle_kingside[BLACK] is True
    
    moves = []
    board.generate_castling_moves(BLACK, moves)
    
    # Should NOT contain e8g8 castling move
    assert not any(m.from_square == e8 and m.to_square == g8 for m in moves), \
        "Castling should not be generated when rook is missing"
```

---

## Bug #3: Unsafe PV Extraction Without Move Validation
**Severity:** MEDIUM  
**File:** `search.py` (backend repository)  
**Function:** `search()` - PV extraction logic

### Symptoms
- PV shows infinite loops: `e8g8 e8g8 e8g8 e8g8 e8g8`
- Same illegal move repeated in principal variation
- Indicates search is following transposition table entries without validating moves

### Root Cause
The PV extraction code retrieves moves from the transposition table and calls `board.make_move()` but **does not check the return value** to verify the move was legal and successfully applied.

### Reproduction
When Bug #1 occurs (incorrect FEN with `KQkq` sent to backend), and Bug #2 stores illegal castling in TT, the search extracts PV by:
1. Getting move from TT at current position
2. Calling `board.make_move(tt_move)` without checking if it returns False
3. If move is illegal, board state doesn't change
4. Next TT lookup returns same position → same illegal move → infinite loop

### Proposed Fix
```python
def extract_pv(self, board, depth):
    """Extract principal variation from transposition table."""
    pv = []
    positions_seen = set()
    
    for _ in range(depth):
        pos_hash = board.get_hash()
        
        # Prevent infinite loops
        if pos_hash in positions_seen:
            break
        positions_seen.add(pos_hash)
        
        tt_entry = self.tt.get(pos_hash)
        if not tt_entry or not tt_entry.best_move:
            break
        
        move = tt_entry.best_move
        
        # CRITICAL: Validate move before making it
        if not board.make_move(move):  # CHECK RETURN VALUE
            break  # Move was illegal, stop PV extraction
        
        pv.append(move)
    
    # Restore board state
    for _ in range(len(pv)):
        board.unmake_move()
    
    return pv
```

### Test Case
```python
def test_pv_stops_on_illegal_move():
    """Test that PV extraction stops when encountering illegal moves."""
    board = Board()
    board.set_fen("rnbqkbn1/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQq - 0 1")
    
    # Manually insert illegal castling move in TT (simulating Bug #1)
    illegal_move = Move(e8, g8, KING_CASTLE)
    tt.store(board.get_hash(), TTEntry(best_move=illegal_move))
    
    pv = search.extract_pv(board, depth=10)
    
    # PV should be empty (stopped at illegal move)
    assert len(pv) == 0, "PV should not include illegal moves"
    assert pv != [illegal_move] * 10, "PV should not loop infinitely"
```

---

## Frontend Mitigations Implemented

To protect against these backend bugs, the frontend now includes defensive validation:

```javascript
async function executeEngineMove(moveStr, evaluation, pv) {
    // Validate source square is not empty
    const fromSquare = document.getElementById(moveStr.substring(0, 2));
    const piece = fromSquare.querySelector('.piece');
    
    if (!piece) {
        console.error('[ENGINE] Source square is EMPTY! Cannot move from empty square.');
        console.error(`[ENGINE] Invalid move from backend, rejecting: ${moveStr}`);
        isPlayerTurn = true;
        return;
    }
    
    // Validate piece color matches engine color
    if (!piece.classList.contains('black')) {
        console.error('[ENGINE] Source piece is WHITE! Engine cannot move white pieces.');
        console.error(`[ENGINE] Invalid move from backend, rejecting: ${moveStr}`);
        isPlayerTurn = true;
        return;
    }
    
    // ... rest of move execution ...
}
```

This prevents the game from breaking when backend returns illegal moves, but **does not fix the root cause**.

---

## Deployment Priority

### Immediate (Deploy ASAP)
1. **Bug #1 Fix**: Fix frontend `boardToFEN()` to calculate actual castling rights based on piece positions (ROOT CAUSE)
2. **Bug #2 Fix**: Add rook validation to backend `generate_castling_moves()` for defense in depth

### Short-term (Next Sprint)
3. **Bug #3 Fix**: Add move validation to PV extraction
4. **Enhancement**: Track piece movements in `gameState` to permanently remove castling rights when king/rooks move
5. Add comprehensive unit tests for all castling scenarios
6. Add integration tests for illegal move rejection

### Testing Checklist Before Deployment
- [ ] Test castling after rook captured (Bug #1 fix)
- [ ] Test castling after rook moved (needs movement tracking enhancement)
- [ ] Test castling after king moved (needs movement tracking enhancement)
- [ ] Test backend robustness with invalid FEN input (Bug #2 fix)
- [ ] Test PV extraction with illegal TT entries (Bug #3 fix)
- [ ] Verify evaluation scores are non-zero for all legal moves
- [ ] Confirm no infinite loops in PV output

---

## Root Cause Analysis

The bug chain works as follows:

1. **Bug #1 (Frontend)**: `boardToFEN()` always sends `KQkq` castling rights
2. **Bug #2 (Backend)**: Backend trusts the FEN and generates castling moves without validating rook presence
3. **Bug #3 (Backend)**: Illegal moves get stored in TT and create infinite loops in PV

**Fix Priority**: Bug #1 must be fixed first (frontend), then Bug #2 (backend defense), then Bug #3 (backend polish).

---

## Additional Notes

**Backend Team Feedback Incorporated**: The backend developers correctly identified that the frontend FEN generation is the root cause. This report has been updated to reflect their analysis from December 4, 2025.

The frontend defensive validation (checking for empty source squares, wrong piece colors, king captures) prevents game corruption and provides a good user experience while the root cause is being fixed. However, these are **workarounds** that should remain as defense-in-depth even after the FEN generation is fixed.

The proper fix sequence is:
1. Fix frontend `boardToFEN()` (Bug #1) - eliminates root cause
2. Add backend rook validation (Bug #2) - defense against bad input
3. Fix PV extraction (Bug #3) - eliminates infinite loops

This approach follows the principle of defense in depth: fix the source of bad data, but also validate at each layer.

---

## Contact

For questions about this bug report or reproduction steps, contact the frontend developer team.

**Urgency:** These bugs were discovered during actual gameplay and make the chess engine unusable in certain positions. Please prioritize these fixes.
