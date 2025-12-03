/**
 * Piperlove Chess Engine API Client
 * API: https://api.wwwtriplew.me
 */

const ChessEngine = {
  API_URL: 'https://api.wwwtriplew.me',
  
  /**
   * Get the best move from the chess engine
   * @param {string} fen - Current board position in FEN notation
   * @param {number} thinkingTime - Time in milliseconds (100-60000)
   * @returns {Promise<Object>} Move result
   */
  async getMove(fen, thinkingTime = 15000) {
    try {
      // Add generous timeout buffer for Vercel cold starts (can take 20-30s on free tier)
      const timeoutMs = thinkingTime + 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏱️ Request timeout after ${timeoutMs}ms - aborting...`);
        controller.abort();
      }, timeoutMs);
      
      console.log(`🚀 Sending request to engine: thinking=${thinkingTime}ms, timeout=${timeoutMs}ms`);
      console.log(`📋 FEN: ${fen}`);
      
      const requestBody = {
        fen: fen,
        ai_thinking_ms: Math.max(100, Math.min(60000, thinkingTime))
      };
      console.log(`📤 Request body:`, requestBody);
      
      const response = await fetch(`${this.API_URL}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log(`✅ Response received: status=${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response:`, errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { detail: errorText };
        }
        throw new Error(error.detail || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📥 Engine response:`, data);
      
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
      if (error.name === 'AbortError') {
        console.error('Chess engine timeout - request took too long');
        return {
          success: false,
          error: 'Request timeout - engine took too long to respond'
        };
      }
      // Network or CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network/CORS error - engine unreachable or blocked:', error);
        return {
          success: false,
          error: 'Engine unreachable or blocked by CORS; check API_BASE and CORS configuration'
        };
      }
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Health check failed with status ${response.status}:`, errorText);
        return false;
      }
      
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network/CORS error during health check - engine unreachable or blocked:', error);
      } else {
        console.error('Health check failed:', error);
      }
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
