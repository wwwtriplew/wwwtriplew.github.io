/**
 * Piperlove Chess Engine API Client
 * API: https://pipier-love-api.vercel.app
 */

const ChessEngine = {
  API_URL: 'https://pipier-love-api.vercel.app',
  
  /**
   * Get the best move from the chess engine
   * @param {string} fen - Current board position in FEN notation
   * @param {number} thinkingTime - Time in milliseconds (100-60000)
   * @returns {Promise<Object>} Move result
   */
  async getMove(fen, thinkingTime = 15000) {
    try {
      const response = await fetch(`${this.API_URL}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: fen,
          ai_thinking_ms: Math.max(100, Math.min(60000, thinkingTime))
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        move: data.move,        // UCI format: "e2e4" or "e7e8q"
        score: data.score,      // Centipawns (+ = white ahead, - = black ahead)
        depth: data.depth,      // Search depth
        nodes: data.nodes,      // Nodes searched
        nps: data.nps,         // Nodes per second
        time: data.time_ms,    // Actual time taken
        pv: data.pv            // Principal variation
      };
    } catch (error) {
      console.error('Chess engine error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Check if the API is healthy and online
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.API_URL}/health`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  /**
   * Parse UCI move string to components
   * @param {string} uci - UCI format move (e.g., "e2e4" or "e7e8q")
   * @returns {Object} { from, to, promotion }
   */
  parseUCI(uci) {
    return {
      from: uci.substring(0, 2),
      to: uci.substring(2, 4),
      promotion: uci.length > 4 ? uci[4] : null
    };
  },

  /**
   * Convert move components to UCI format
   * @param {string} from - Source square (e.g., "e2")
   * @param {string} to - Target square (e.g., "e4")
   * @param {string} promotion - Promotion piece ('q', 'r', 'b', 'n') or null
   * @returns {string} UCI format move
   */
  toUCI(from, to, promotion = null) {
    let uci = from.toLowerCase() + to.toLowerCase();
    if (promotion) {
      uci += promotion.toLowerCase();
    }
    return uci;
  },

  /**
   * Convert row/col coordinates to algebraic notation
   * @param {number} row - Row index (0-7)
   * @param {number} col - Column index (0-7)
   * @returns {string} Algebraic notation (e.g., "e4")
   */
  coordsToAlgebraic(row, col) {
    const files = 'abcdefgh';
    return files[col] + (8 - row);
  },

  /**
   * Convert algebraic notation to row/col coordinates
   * @param {string} algebraic - Algebraic notation (e.g., "e4")
   * @returns {Object} { row, col }
   */
  algebraicToCoords(algebraic) {
    const files = 'abcdefgh';
    return {
      col: files.indexOf(algebraic[0]),
      row: 8 - parseInt(algebraic[1])
    };
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessEngine;
}
