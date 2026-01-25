class EnhancedChessGame {
    constructor() {
        this.board = null;
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.flipped = false;
        this.whiteTime = 15 * 60;
        this.blackTime = 15 * 60;
        this.timerInterval = null;
        this.lastMove = null;
        this.enPassantSquare = null;
        this.castlingRights = {
            white: { king: true, queenside: true, kingside: true },
            black: { king: true, queenside: true, kingside: true }
        };
        this.moveCount = { white: 0, black: 0 };
        this.aiThinking = false;
        this.aiDepth = 3;
        this.soundEnabled = true;
        this.highlightEnabled = true;
        this.autoSaveEnabled = true;
        this.gameMode = 'player-vs-player';
        this.pieceValues = {
            pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.loadGameState();
        this.startTimer();
        this.updateStatus();
        this.updateMaterial();
        this.setupKeyboardShortcuts();
        this.showWelcomeMessage();
    }
    
    createBoard() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Initialize pieces
        // White pieces
        this.board[7][0] = { type: 'rook', color: 'white', moved: false };
        this.board[7][1] = { type: 'knight', color: 'white', moved: false };
        this.board[7][2] = { type: 'bishop', color: 'white', moved: false };
        this.board[7][3] = { type: 'queen', color: 'white', moved: false };
        this.board[7][4] = { type: 'king', color: 'white', moved: false };
        this.board[7][5] = { type: 'bishop', color: 'white', moved: false };
        this.board[7][6] = { type: 'knight', color: 'white', moved: false };
        this.board[7][7] = { type: 'rook', color: 'white', moved: false };
        
        // White pawns
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { type: 'pawn', color: 'white', moved: false };
        }
        
        // Black pieces
        this.board[0][0] = { type: 'rook', color: 'black', moved: false };
        this.board[0][1] = { type: 'knight', color: 'black', moved: false };
        this.board[0][2] = { type: 'bishop', color: 'black', moved: false };
        this.board[0][3] = { type: 'queen', color: 'black', moved: false };
        this.board[0][4] = { type: 'king', color: 'black', moved: false };
        this.board[0][5] = { type: 'bishop', color: 'black', moved: false };
        this.board[0][6] = { type: 'knight', color: 'black', moved: false };
        this.board[0][7] = { type: 'rook', color: 'black', moved: false };
        
        // Black pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black', moved: false };
        }
        
        this.renderBoard();
    }
    
    renderBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Highlight last move
                if (this.lastMove && 
                    ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                     (this.lastMove.to.row === row && this.lastMove.to.col === col))) {
                    square.classList.add('last-move');
                }
                
                // Highlight en passant square
                if (this.enPassantSquare && this.enPassantSquare.row === row && this.enPassantSquare.col === col) {
                    square.style.boxShadow = 'inset 0 0 0 3px #ff9900';
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    const unicode = this.getPieceUnicode(piece);
                    square.textContent = unicode;
                    square.style.color = piece.color === 'white' ? '#fff' : '#333';
                    square.style.textShadow = piece.color === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : '2px 2px 4px rgba(255,255,255,0.5)';
                    square.dataset.piece = `${piece.color}-${piece.type}`;
                }
                
                boardElement.appendChild(square);
            }
        }
    }
    
    getPieceUnicode(piece) {
        const unicodeMap = {
            'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖',
            'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
            'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜',
            'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟'
        };
        return unicodeMap[`${piece.color}-${piece.type}`];
    }
    
    setupEventListeners() {
        // Board squares
        document.getElementById('chess-board').addEventListener('click', (e) => {
            if (!e.target.classList.contains('square')) return;
            if (!this.gameActive) return;
            if (this.aiThinking && this.gameMode.includes('ai') && this.currentPlayer === 'black') return;
            
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            this.handleSquareClick(row, col);
        });
        
        // Control buttons
        document.getElementById('new-game').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        document.getElementById('export-pgn').addEventListener('click', () => this.exportPGN());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzePosition());
        document.getElementById('copy-notation').addEventListener('click', () => this.copyNotation());
        document.getElementById('clear-notation').addEventListener('click', () => this.clearNotation());
        
        // Settings
        document.getElementById('game-mode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            if (this.gameMode === 'ai-vs-ai') {
                this.startAIVsAI();
            } else if (this.gameMode.includes('ai') && this.currentPlayer === 'black') {
                this.makeAIMove();
            }
        });
        
        document.getElementById('time-control').addEventListener('change', (e) => {
            const minutes = parseInt(e.target.value);
            if (minutes === 0) {
                this.whiteTime = 0;
                this.blackTime = 0;
                this.stopTimer();
            } else {
                this.whiteTime = minutes * 60;
                this.blackTime = minutes * 60;
                this.startTimer();
            }
            this.updateClocks();
        });
        
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('highlight-toggle').addEventListener('change', (e) => {
            this.highlightEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('auto-save-toggle').addEventListener('change', (e) => {
            this.autoSaveEnabled = e.target.checked;
            this.saveSettings();
        });
        
        // Promotion modal
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', (e) => {
                const pieceType = e.target.closest('.promotion-piece').dataset.piece;
                this.completePromotion(pieceType);
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
        
        // Footer links
        document.getElementById('toggle-rules').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRules();
        });
        
        document.getElementById('toggle-shortcuts').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('shortcuts-modal').style.display = 'flex';
        });
        
        document.getElementById('toggle-about').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('about-modal').style.display = 'flex';
        });
        
        // Auto-save interval
        setInterval(() => {
            if (this.autoSaveEnabled && this.gameActive) {
                this.saveGameState();
            }
        }, 30000); // Auto-save every 30 seconds
        
        // Load settings
        this.loadSettings();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch(e.key.toLowerCase()) {
                case ' ': // Space - Flip board
                    e.preventDefault();
                    this.flipBoard();
                    break;
                case 'z': // Z - Undo move
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.undoMove();
                    }
                    break;
                case 'h': // H - Show hint
                    e.preventDefault();
                    this.showHint();
                    break;
                case 'n': // N - New game
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.resetGame();
                    }
                    break;
                case 'f': // F - Flip board
                    e.preventDefault();
                    this.flipBoard();
                    break;
                case 's': // S - Save game
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveGame();
                    }
                    break;
                case 'l': // L - Load game
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.loadGame();
                    }
                    break;
                case 'm': // M - Toggle sound
                    e.preventDefault();
                    const soundToggle = document.getElementById('sound-toggle');
                    soundToggle.checked = !soundToggle.checked;
                    soundToggle.dispatchEvent(new Event('change'));
                    break;
            }
        });
    }
    
    handleSquareClick(row, col) {
        const piece = this.board[row][col];
        
        if (this.selectedPiece) {
            const isMoveValid = this.validMoves.some(move => 
                move.row === row && move.col === col
            );
            
            if (isMoveValid) {
                this.makeMove(row, col);
            } else {
                if (piece && piece.color === this.currentPlayer) {
                    this.selectPiece(row, col);
                } else {
                    this.clearSelection();
                }
            }
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        }
    }
    
    selectPiece(row, col) {
        if (!this.highlightEnabled) return;
        
        this.clearSelection();
        
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer) return;
        
        this.selectedPiece = { row, col, ...piece };
        this.validMoves = this.calculateValidMoves(row, col, piece);
        
        // Highlight selected square
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('selected');
        
        // Highlight valid moves
        this.validMoves.forEach(move => {
            const targetSquare = document.querySelector(
                `.square[data-row="${move.row}"][data-col="${move.col}"]`
            );
            
            if (this.board[move.row][move.col]) {
                targetSquare.classList.add('valid-capture');
            } else {
                targetSquare.classList.add('valid-move');
            }
        });
        
        this.playSound('move');
    }
    
    calculateValidMoves(row, col, piece) {
        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }
        
        // Add castling moves for king
        if (piece.type === 'king') {
            moves = moves.concat(this.getCastlingMoves(row, col, piece.color));
        }
        
        // Filter moves that would put king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Move forward one square
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col, type: 'normal' });
            
            // Move forward two squares from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col, type: 'double' });
            }
        }
        
        // Diagonal captures
        [-1, 1].forEach(dc => {
            const newRow = row + direction;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
                
                // En passant capture
                if (this.enPassantSquare && 
                    this.enPassantSquare.row === newRow && 
                    this.enPassantSquare.col === newCol) {
                    moves.push({ row: newRow, col: newCol, type: 'enpassant' });
                }
            }
        });
        
        return moves;
    }
    
    getRookMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }
    
    getBishopMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }
    
    getQueenMoves(row, col, color) {
        return this.getRookMoves(row, col, color).concat(this.getBishopMoves(row, col, color));
    }
    
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        knightMoves.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (!piece || piece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getKingMoves(row, col, color) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        kingMoves.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (!piece || piece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getSlidingMoves(row, col, color, directions) {
        const moves = [];
        
        directions.forEach(([dr, dc]) => {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                
                if (!piece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (piece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dr;
                newCol += dc;
            }
        });
        
        return moves;
    }
    
    getCastlingMoves(row, col, color) {
        const moves = [];
        
        if (this.isInCheck(color)) return moves;
        
        // Kingside castling
        if (this.castlingRights[color].kingside) {
            if (!this.board[row][5] && !this.board[row][6] && 
                !this.wouldBeInCheck(row, col, row, 5, color) &&
                !this.wouldBeInCheck(row, col, row, 6, color)) {
                moves.push({ row, col: 6, type: 'castling', side: 'kingside' });
            }
        }
        
        // Queenside castling
        if (this.castlingRights[color].queenside) {
            if (!this.board[row][1] && !this.board[row][2] && !this.board[row][3] &&
                !this.wouldBeInCheck(row, col, row, 3, color) &&
                !this.wouldBeInCheck(row, col, row, 2, color)) {
                moves.push({ row, col: 2, type: 'castling', side: 'queenside' });
            }
        }
        
        return moves;
    }
    
    makeMove(toRow, toCol) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        const piece = this.selectedPiece;
        const targetPiece = this.board[toRow][toCol];
        const moveType = this.validMoves.find(m => m.row === toRow && m.col === toCol)?.type || 'normal';
        
        // Record move
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: targetPiece ? { ...targetPiece } : null,
            type: moveType,
            enPassantSquare: this.enPassantSquare,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights))
        };
        
        // Handle special moves
        if (moveType === 'enpassant') {
            move.captured = { type: 'pawn', color: piece.color === 'white' ? 'black' : 'white' };
            move.enPassantCapture = { row: fromRow, col: toCol };
        } else if (moveType === 'castling') {
            move.castling = true;
        } else if (moveType === 'double') {
            move.enPassantTarget = { row: fromRow + (piece.color === 'white' ? -1 : 1), col: fromCol };
        }
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.pendingPromotion = { move, toRow, toCol };
            this.showPromotionModal();
            return;
        }
        
        this.executeMove(move);
    }
    
    executeMove(move) {
        const { from, to, piece, captured, type } = move;
        
        // Clear previous en passant square
        this.enPassantSquare = null;
        
        // Move the piece
        this.board[from.row][from.col] = null;
        this.board[to.row][to.col] = { ...piece, moved: true };
        
        // Handle special moves
        if (type === 'enpassant' && move.enPassantCapture) {
            // Remove captured pawn in en passant
            this.board[move.enPassantCapture.row][move.enPassantCapture.col] = null;
        } else if (type === 'castling') {
            // Move rook for castling
            const rookCol = move.side === 'kingside' ? 7 : 0;
            const newRookCol = move.side === 'kingside' ? 5 : 3;
            const rook = this.board[to.row][rookCol];
            this.board[to.row][rookCol] = null;
            this.board[to.row][newRookCol] = { ...rook, moved: true };
        } else if (type === 'double') {
            // Set en passant square
            this.enPassantSquare = move.enPassantTarget;
        }
        
        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].king = false;
            this.castlingRights[piece.color].queenside = false;
            this.castlingRights[piece.color].kingside = false;
        } else if (piece.type === 'rook') {
            if (from.col === 0) this.castlingRights[piece.color].queenside = false;
            if (from.col === 7) this.castlingRights[piece.color].kingside = false;
        }
        
        // Handle captured piece
        if (captured) {
            this.capturedPieces[piece.color].push(captured);
            this.playSound('capture');
        } else if (type === 'castling') {
            this.playSound('castle');
        } else {
            this.playSound('move');
        }
        
        // Record move history
        this.moveHistory.push(move);
        this.lastMove = move;
        this.moveCount[piece.color]++;
        
        // Update UI
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateMaterial();
        this.updateEvaluation();
        
        // Clear selection and switch player
        this.clearSelection();
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check for game end conditions
        this.checkGameEnd();
        
        // Render board
        this.renderBoard();
        this.updateStatus();
        
        // Save game state
        if (this.autoSaveEnabled) {
            this.saveGameState();
        }
        
        // Make AI move if needed
        if (this.gameMode.includes('ai') && this.currentPlayer === 'black' && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const originalBoard = JSON.parse(JSON.stringify(this.board));
        const piece = this.board[fromRow][fromCol];
        
        // Make the move
        this.board[fromRow][fromCol] = null;
        this.board[toRow][toCol] = piece;
        
        // Find king position
        const kingPos = this.findKing(color);
        
        // Check if king is attacked
        const inCheck = this.isSquareAttacked(kingPos.row, kingPos.col, color === 'white' ? 'black' : 'white');
        
        // Restore board
        this.board = originalBoard;
        
        return inCheck;
    }
    
    isInCheck(color) {
        const kingPos = this.findKing(color);
        return this.isSquareAttacked(kingPos.row, kingPos.col, color === 'white' ? 'black' : 'white');
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return { row: -1, col: -1 };
    }
    
    isSquareAttacked(row, col, attackingColor) {
        // Check for pawn attacks
        const pawnDir = attackingColor === 'white' ? -1 : 1;
        for (const dc of [-1, 1]) {
            const r = row + pawnDir;
            const c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'pawn' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        // Check for knight attacks
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
            const r = row + dr;
            const c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'knight' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        // Check for sliding pieces (rook, bishop, queen)
        const slidingDirections = [
            [-1, 0], [1, 0], [0, -1], [0, 1],  // Rook/Queen
            [-1, -1], [-1, 1], [1, -1], [1, 1]  // Bishop/Queen
        ];
        
        for (const [dr, dc] of slidingDirections) {
            let r = row + dr;
            let c = col + dc;
            
            while (this.isValidSquare(r, c)) {
                const piece = this.board[r][c];
                if (piece) {
                    if (piece.color === attackingColor) {
                        const isRookAttack = (dr === 0 || dc === 0) && piece.type === 'rook';
                        const isBishopAttack = (dr !== 0 && dc !== 0) && piece.type === 'bishop';
                        const isQueenAttack = piece.type === 'queen';
                        
                        if (isRookAttack || isBishopAttack || isQueenAttack) {
                            return true;
                        }
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }
        
        // Check for king attacks
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        for (const [dr, dc] of kingMoves) {
            const r = row + dr;
            const c = col + dc;
            if (this.isValidSquare(r, c)) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'king' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    showPromotionModal() {
        document.getElementById('promotion-modal').style.display = 'flex';
        this.playSound('promote');
    }
    
    completePromotion(pieceType) {
        if (!this.pendingPromotion) return;
        
        const { move, toRow, toCol } = this.pendingPromotion;
        
        // Update piece type
        this.board[toRow][toCol].type = pieceType;
        move.promotion = pieceType;
        
        // Hide modal
        document.getElementById('promotion-modal').style.display = 'none';
        
        // Complete the move
        this.executeMove(move);
        this.pendingPromotion = null;
    }
    
    checkGameEnd() {
        const color = this.currentPlayer;
        const hasLegalMoves = this.hasLegalMoves(color);
        const inCheck = this.isInCheck(color);
        
        if (!hasLegalMoves) {
            if (inCheck) {
                const winner = color === 'white' ? 'Black' : 'White';
                this.endGame(`${winner} wins by checkmate!`);
                this.playSound('check');
            } else {
                this.endGame('Stalemate!');
            }
        } else if (inCheck) {
            this.playSound('check');
        }
        
        // Highlight king in check
        this.highlightCheck();
    }
    
    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const moves = this.calculateValidMoves(row, col, piece);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    highlightCheck() {
        // Remove previous check highlights
        document.querySelectorAll('.in-check').forEach(sq => sq.classList.remove('in-check'));
        
        // Highlight kings in check
        ['white', 'black'].forEach(color => {
            if (this.isInCheck(color)) {
                const kingPos = this.findKing(color);
                const square = document.querySelector(`.square[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
                if (square) square.classList.add('in-check');
            }
        });
    }
    
    clearSelection() {
        document.querySelectorAll('.selected, .valid-move, .valid-capture').forEach(el => {
            el.classList.remove('selected', 'valid-move', 'valid-capture');
        });
        this.selectedPiece = null;
        this.validMoves = [];
    }
    
    updateStatus() {
        const statusElement = document.getElementById('status-message');
        if (!this.gameActive) return;
        
        const inCheck = this.isInCheck(this.currentPlayer);
        const checkText = inCheck ? ' (Check!)' : '';
        
        let status = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} to move${checkText}`;
        
        if (this.gameMode.includes('ai') && this.currentPlayer === 'black') {
            status += ' | AI Thinking...';
        }
        
        statusElement.textContent = status;
        statusElement.style.color = inCheck ? '#ff6b6b' : '#fff';
    }
    
    updateMaterial() {
        let whiteMaterial = 0;
        let blackMaterial = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const value = this.pieceValues[piece.type];
                    if (piece.color === 'white') {
                        whiteMaterial += value;
                    } else {
                        blackMaterial += value;
                    }
                }
            }
        }
        
        // Add captured pieces value
        this.capturedPieces.white.forEach(piece => {
            blackMaterial += this.pieceValues[piece.type];
        });
        
        this.capturedPieces.black.forEach(piece => {
            whiteMaterial += this.pieceValues[piece.type];
        });
        
        document.getElementById('white-material').textContent = whiteMaterial;
        document.getElementById('black-material').textContent = blackMaterial;
        document.getElementById('white-moves').textContent = this.moveCount.white;
        document.getElementById('black-moves').textContent = this.moveCount.black;
    }
    
    updateEvaluation() {
        const whiteMaterial = parseInt(document.getElementById('white-material').textContent);
        const blackMaterial = parseInt(document.getElementById('black-material').textContent);
        const materialDiff = whiteMaterial - blackMaterial;
        
        // Update evaluation bar
        const evalBar = document.getElementById('eval-fill');
        const evalScore = document.getElementById('eval-score');
        
        // Calculate percentage (0-100%)
        let percentage = 50;
        if (materialDiff > 0) {
            percentage = 50 + Math.min(materialDiff * 2, 50);
        } else if (materialDiff < 0) {
            percentage = 50 - Math.min(Math.abs(materialDiff) * 2, 50);
        }
        
        evalBar.style.width = `${percentage}%`;
        
        // Update score text
        const score = materialDiff / 10; // Convert to decimal score
        evalScore.textContent = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        evalScore.style.color = score > 0 ? '#4ade80' : score < 0 ? '#f87171' : '#94a3b8';
    }
    
    updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        const notationElement = document.getElementById('algebraic-notation');
        
        historyElement.innerHTML = '';
        notationElement.innerHTML = '';
        
        this.moveHistory.forEach((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhite = index % 2 === 0;
            
            // Create move notation
            const notation = this.getAlgebraicNotation(move);
            
            if (isWhite) {
                const moveEntry = document.createElement('div');
                moveEntry.className = 'move-entry';
                moveEntry.innerHTML = `
                    <span>${moveNumber}. ${notation}</span>
                    ${move.captured ? '<span class="capture-indicator">×</span>' : ''}
                `;
                historyElement.appendChild(moveEntry);
            } else {
                const lastEntry = historyElement.lastChild;
                if (lastEntry) {
                    const span = document.createElement('span');
                    span.textContent = ` ${notation}`;
                    lastEntry.querySelector('span:first-child').appendChild(span);
                }
            }
            
            // Update algebraic notation
            if (isWhite) {
                notationElement.innerHTML += `${moveNumber}. ${notation} `;
            } else {
                notationElement.innerHTML += `${notation}<br>`;
            }
        });
        
        // Scroll to bottom
        historyElement.scrollTop = historyElement.scrollHeight;
        notationElement.scrollTop = notationElement.scrollHeight;
    }
    
    getAlgebraicNotation(move) {
        const { from, to, piece, captured, type, promotion } = move;
        const file = 'abcdefgh'[from.col];
        const rank = 8 - from.row;
        const destFile = 'abcdefgh'[to.col];
        const destRank = 8 - to.row;
        
        let notation = '';
        
        // Handle castling
        if (type === 'castling') {
            return move.side === 'kingside' ? 'O-O' : 'O-O-O';
        }
        
        // Piece letter (except pawn)
        if (piece.type !== 'pawn') {
            notation = piece.type === 'knight' ? 'N' : piece.type.charAt(0).toUpperCase();
        }
        
        // Add file/rank for disambiguation (simplified)
        if (piece.type !== 'pawn') {
            notation += file;
        }
        
        // Capture indicator
        if (captured) {
            if (piece.type === 'pawn') notation += file;
            notation += 'x';
        }
        
        // Destination
        notation += destFile + destRank;
        
        // Promotion
        if (promotion) {
            notation += '=' + (promotion === 'knight' ? 'N' : promotion.charAt(0).toUpperCase());
        }
        
        // Check indicator (simplified)
        // Note: Would need to check if move results in check
        
        return notation;
    }
    
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('white-captured');
        const blackCaptured = document.getElementById('black-captured');
        
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
        
        this.capturedPieces.white.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.getPieceUnicode(piece);
            span.style.color = '#333';
            whiteCaptured.appendChild(span);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.getPieceUnicode(piece);
            span.style.color = '#fff';
            blackCaptured.appendChild(span);
        });
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (this.currentPlayer === 'white' && this.whiteTime > 0) {
                this.whiteTime--;
            } else if (this.currentPlayer === 'black' && this.blackTime > 0) {
                this.blackTime--;
            }
            
            this.updateClocks();
            
            // Check for timeout
            if (this.whiteTime <= 0 && this.gameActive) {
                this.endGame('Black wins on time!');
            } else if (this.blackTime <= 0 && this.gameActive) {
                this.endGame('White wins on time!');
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateClocks() {
        const formatTime = (seconds) => {
            if (seconds <= 0) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        document.getElementById('white-clock').textContent = formatTime(this.whiteTime);
        document.getElementById('black-clock').textContent = formatTime(this.blackTime);
        
        // Add warning colors
        const whiteClock = document.getElementById('white-clock');
        const blackClock = document.getElementById('black-clock');
        
        whiteClock.style.color = this.whiteTime < 60 ? '#ff6b6b' : '#fff';
        blackClock.style.color = this.blackTime < 60 ? '#ff6b6b' : '#fff';
    }
    
    flipBoard() {
        this.flipped = !this.flipped;
        const board = document.getElementById('chess-board');
        const squares = document.querySelectorAll('.square');
        
        if (this.flipped) {
            board.style.transform = 'rotate(180deg)';
            squares.forEach(square => {
                if (square.textContent) {
                    square.style.transform = 'rotate(180deg)';
                }
            });
        } else {
            board.style.transform = 'rotate(0deg)';
            squares.forEach(square => {
                if (square.textContent) {
                    square.style.transform = 'rotate(0deg)';
                }
            });
        }
        
        this.showNotification('Board flipped');
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore board state
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured || null;
        
        // Restore special moves
        if (lastMove.type === 'enpassant' && lastMove.enPassantCapture) {
            this.board[lastMove.enPassantCapture.row][lastMove.enPassantCapture.col] = 
                { type: 'pawn', color: lastMove.piece.color === 'white' ? 'black' : 'white', moved: true };
        } else if (lastMove.type === 'castling') {
            // Restore rook position
            const rookCol = lastMove.side === 'kingside' ? 7 : 0;
            const newRookCol = lastMove.side === 'kingside' ? 5 : 3;
            const rook = this.board[lastMove.to.row][newRookCol];
            this.board[lastMove.to.row][newRookCol] = null;
            this.board[lastMove.to.row][rookCol] = { ...rook, moved: false };
        }
        
        // Restore castling rights
        this.castlingRights = lastMove.castlingRights;
        
        // Restore en passant square
        this.enPassantSquare = lastMove.enPassantSquare;
        
        // Restore captured pieces
        if (lastMove.captured) {
            const capturedArray = this.capturedPieces[lastMove.piece.color];
            const index = capturedArray.findIndex(p => 
                p.type === lastMove.captured.type && p.color === lastMove.captured.color
            );
            if (index > -1) {
                capturedArray.splice(index, 1);
            }
        }
        
        // Update move count
        this.moveCount[lastMove.piece.color]--;
        
        // Update last move
        this.lastMove = this.moveHistory[this.moveHistory.length - 1] || null;
        
        // Switch player back
        this.currentPlayer = lastMove.piece.color;
        
        // Update UI
        this.renderBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateMaterial();
        this.updateEvaluation();
        this.checkGameEnd();
        
        this.showNotification('Move undone');
    }
    
    resetGame() {
        this.stopTimer();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.enPassantSquare = null;
        this.castlingRights = {
            white: { king: true, queenside: true, kingside: true },
            black: { king: true, queenside: true, kingside: true }
        };
        this.moveCount = { white: 0, black: 0 };
        this.aiThinking = false;
        
        // Reset time based on selected control
        const timeControl = document.getElementById('time-control');
        const minutes = parseInt(timeControl.value);
        if (minutes === 0) {
            this.whiteTime = 0;
            this.blackTime = 0;
        } else {
            this.whiteTime = minutes * 60;
            this.blackTime = minutes * 60;
        }
        
        this.createBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateMaterial();
        this.updateEvaluation();
        this.updateClocks();
        this.startTimer();
        
        document.getElementById('promotion-modal').style.display = 'none';
        document.getElementById('ai-thinking').classList.remove('active');
        
        this.showNotification('New game started');
    }
    
    endGame(message) {
        this.gameActive = false;
        this.stopTimer();
        document.getElementById('status-message').textContent = message;
        
        // Add game over styling
        const statusElement = document.getElementById('status-message');
        statusElement.style.background = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
        statusElement.style.color = 'white';
        statusElement.style.fontSize = '1.3rem';
        statusElement.style.padding = '20px';
        
        this.showNotification(message, 'success');
    }
    
    // AI Functions
    makeAIMove() {
        if (!this.gameActive || this.currentPlayer !== 'black' || this.aiThinking) return;
        
        this.aiThinking = true;
        document.getElementById('ai-thinking').classList.add('active');
        
        // Set AI difficulty based on game mode
        let depth = 2;
        if (this.gameMode.includes('medium')) depth = 3;
        if (this.gameMode.includes('hard')) depth = 4;
        
        // Simulate AI thinking
        let nodes = 0;
        const startTime = Date.now();
        const thinkingInterval = setInterval(() => {
            nodes += Math.floor(Math.random() * 1000);
            document.getElementById('ai-nodes').textContent = nodes.toLocaleString();
        }, 100);
        
        setTimeout(() => {
            clearInterval(thinkingInterval);
            
            // Get all possible moves
            const moves = this.getAllPossibleMoves('black');
            if (moves.length === 0) {
                this.aiThinking = false;
                document.getElementById('ai-thinking').classList.remove('active');
                return;
            }
            
            // Choose best move based on difficulty
            let bestMove;
            if (depth === 2) {
                // Easy: Random move, but prefer captures
                const captureMoves = moves.filter(m => m.captured);
                bestMove = captureMoves.length > 0 ? 
                    captureMoves[Math.floor(Math.random() * captureMoves.length)] : 
                    moves[Math.floor(Math.random() * moves.length)];
            } else {
                // Medium/Hard: Use minimax
                bestMove = this.minimax(depth, -Infinity, Infinity, 'black');
            }
            
            // Execute the move
            this.selectedPiece = { 
                row: bestMove.from.row, 
                col: bestMove.from.col, 
                ...bestMove.piece 
            };
            this.validMoves = [{ row: bestMove.to.row, col: bestMove.to.col }];
            
            setTimeout(() => {
                this.makeMove(bestMove.to.row, bestMove.to.col);
                this.aiThinking = false;
                document.getElementById('ai-thinking').classList.remove('active');
                
                // Update AI info
                document.getElementById('ai-depth').textContent = depth;
                document.getElementById('ai-best-move').textContent = 
                    this.getAlgebraicNotation(bestMove);
            }, 500);
            
        }, depth === 2 ? 1000 : depth === 3 ? 2000 : 3000);
    }
    
    getAllPossibleMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = this.calculateValidMoves(row, col, piece);
                    pieceMoves.forEach(move => {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col },
                            piece: { ...piece },
                            type: move.type || 'normal'
                        });
                    });
                }
            }
        }
        
        return moves;
    }
    
    minimax(depth, alpha, beta, maximizingPlayer) {
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }
        
        const color = maximizingPlayer ? 'black' : 'white';
        const moves = this.getAllPossibleMoves(color);
        
        if (moves.length === 0) {
            if (this.isInCheck(color)) {
                return { score: maximizingPlayer ? -1000 : 1000 };
            }
            return { score: 0 }; // Stalemate
        }
        
        let bestMove = null;
        
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            
            for (const move of moves) {
                // Simulate move
                const simulated = this.simulateMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, false).score;
                
                // Restore board
                this.undoSimulatedMove(move, simulated);
                
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            
            return { move: bestMove, score: maxEval };
        } else {
            let minEval = Infinity;
            
            for (const move of moves) {
                // Simulate move
                const simulated = this.simulateMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, true).score;
                
                // Restore board
                this.undoSimulatedMove(move, simulated);
                
                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            
            return { move: bestMove, score: minEval };
        }
    }
    
    simulateMove(move) {
        const { from, to, piece } = move;
        const captured = this.board[to.row][to.col];
        
        // Save current state
        const simulated = {
            captured,
            pieceMoved: this.board[from.row][from.col]?.moved,
            enPassantSquare: this.enPassantSquare
        };
        
        // Make move
        this.board[from.row][from.col] = null;
        this.board[to.row][to.col] = { ...piece, moved: true };
        
        return simulated;
    }
    
    undoSimulatedMove(move, simulated) {
        const { from, to, piece } = move;
        const { captured, pieceMoved, enPassantSquare } = simulated;
        
        // Restore move
        this.board[from.row][from.col] = { ...piece, moved: pieceMoved };
        this.board[to.row][to.col] = captured;
        this.enPassantSquare = enPassantSquare;
    }
    
    evaluateBoard() {
        let score = 0;
        
        // Material evaluation
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    let pieceScore = this.pieceValues[piece.type];
                    
                    // Add position bonuses
                    if (piece.type === 'pawn') {
                        // Pawns are better when advanced
                        const advancement = piece.color === 'white' ? (7 - row) : row;
                        pieceScore += advancement * 0.1;
                    } else if (piece.type === 'knight' || piece.type === 'bishop') {
                        // Centralize minor pieces
                        const centrality = (3.5 - Math.abs(3.5 - col)) * (3.5 - Math.abs(3.5 - row));
                        pieceScore += centrality * 0.05;
                    }
                    
                    score += piece.color === 'white' ? pieceScore : -pieceScore;
                }
            }
        }
        
        // Add mobility bonus
        const whiteMoves = this.getAllPossibleMoves('white').length;
        const blackMoves = this.getAllPossibleMoves('black').length;
        score += (whiteMoves - blackMoves) * 0.1;
        
        return score;
    }
    
    startAIVsAI() {
        this.resetGame();
        this.gameMode = 'ai-vs-ai';
        
        const playAIMove = () => {
            if (!this.gameActive) return;
            
            this.makeAIMove();
            
            if (this.gameActive) {
                setTimeout(playAIMove, 2000);
            }
        };
        
        setTimeout(playAIMove, 1000);
    }
    
    showHint() {
        if (!this.gameActive || this.currentPlayer !== 'white') return;
        
        // Get best move for current player
        const hint = this.minimax(2, -Infinity, Infinity, this.currentPlayer === 'black');
        
        if (hint.move) {
            // Highlight the suggested move
            this.clearSelection();
            
            const fromSquare = document.querySelector(
                `.square[data-row="${hint.move.from.row}"][data-col="${hint.move.from.col}"]`
            );
            const toSquare = document.querySelector(
                `.square[data-row="${hint.move.to.row}"][data-col="${hint.move.to.col}"]`
            );
            
            if (fromSquare && toSquare) {
                fromSquare.classList.add('hint-square');
                toSquare.classList.add('hint-square');
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    fromSquare.classList.remove('hint-square');
                    toSquare.classList.remove('hint-square');
                }, 3000);
            }
            
            this.showNotification(`Hint: ${this.getAlgebraicNotation(hint.move)}`);
            this.playSound('hint');
        }
    }
    
    analyzePosition() {
        const evaluation = this.evaluateBoard();
        const message = evaluation > 0 ? 
            `White is better by ${(evaluation/10).toFixed(1)}` :
            evaluation < 0 ? 
            `Black is better by ${(-evaluation/10).toFixed(1)}` :
            'Position is equal';
        
        this.showNotification(`Analysis: ${message}`);
    }
    
    // Save/Load Functions
    saveGame() {
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces,
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            moveCount: this.moveCount,
            enPassantSquare: this.enPassantSquare,
            castlingRights: this.castlingRights,
            lastMove: this.lastMove,
            gameActive: this.gameActive
        };
        
        localStorage.setItem('chess_save', JSON.stringify(gameState));
        this.showNotification('Game saved successfully', 'success');
    }
    
    loadGame() {
        const saved = localStorage.getItem('chess_save');
        if (!saved) {
            this.showNotification('No saved game found', 'error');
            return;
        }
        
        try {
            const gameState = JSON.parse(saved);
            
            this.board = gameState.board;
            this.currentPlayer = gameState.currentPlayer;
            this.moveHistory = gameState.moveHistory;
            this.capturedPieces = gameState.capturedPieces;
            this.whiteTime = gameState.whiteTime;
            this.blackTime = gameState.blackTime;
            this.moveCount = gameState.moveCount;
            this.enPassantSquare = gameState.enPassantSquare;
            this.castlingRights = gameState.castlingRights;
            this.lastMove = gameState.lastMove;
            this.gameActive = gameState.gameActive;
            
            this.renderBoard();
            this.updateStatus();
            this.updateMoveHistory();
            this.updateCapturedPieces();
            this.updateMaterial();
            this.updateEvaluation();
            this.updateClocks();
            this.startTimer();
            
            this.showNotification('Game loaded successfully', 'success');
        } catch (error) {
            this.showNotification('Error loading game', 'error');
            console.error(error);
        }
    }
    
    saveGameState() {
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory.slice(-10), // Save only last 10 moves
            whiteTime: this.whiteTime,
            blackTime: this.blackTime
        };
        
        localStorage.setItem('chess_autosave', JSON.stringify(gameState));
    }
    
    loadGameState() {
        const saved = localStorage.getItem('chess_autosave');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                if (confirm('Continue previous game?')) {
                    this.board = gameState.board;
                    this.currentPlayer = gameState.currentPlayer;
                    this.moveHistory = gameState.moveHistory;
                    this.whiteTime = gameState.whiteTime;
                    this.blackTime = gameState.blackTime;
                    
                    this.renderBoard();
                    this.updateStatus();
                    this.updateMoveHistory();
                    this.updateClocks();
                    this.startTimer();
                }
            } catch (error) {
                console.error('Error loading autosave:', error);
            }
        }
    }
    
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            highlightEnabled: this.highlightEnabled,
            autoSaveEnabled: this.autoSaveEnabled,
            gameMode: this.gameMode
        };
        
        localStorage.setItem('chess_settings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('chess_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.soundEnabled = settings.soundEnabled;
                this.highlightEnabled = settings.highlightEnabled;
                this.autoSaveEnabled = settings.autoSaveEnabled;
                this.gameMode = settings.gameMode || 'player-vs-player';
                
                document.getElementById('sound-toggle').checked = this.soundEnabled;
                document.getElementById('highlight-toggle').checked = this.highlightEnabled;
                document.getElementById('auto-save-toggle').checked = this.autoSaveEnabled;
                document.getElementById('game-mode').value = this.gameMode;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }
    
    exportPGN() {
        let pgn = '[Event "Enhanced Chess Game"]\n';
        pgn += '[Site "https://your-chess-game.vercel.app"]\n';
        pgn += '[Date "' + new Date().toISOString().split('T')[0] + '"]\n';
        pgn += '[White "Player"]\n';
        pgn += '[Black "Player"]\n';
        pgn += '[Result "*"]\n\n';
        
        this.moveHistory.forEach((move, index) => {
            if (index % 2 === 0) {
                pgn += (Math.floor(index / 2) + 1) + '. ';
            }
            pgn += this.getAlgebraicNotation(move) + ' ';
        });
        
        // Create download link
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chess-game.pgn';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('PGN exported successfully', 'success');
    }
    
    copyNotation() {
        const notation = document.getElementById('algebraic-notation').textContent;
        navigator.clipboard.writeText(notation)
            .then(() => this.showNotification('Notation copied to clipboard', 'success'))
            .catch(() => this.showNotification('Failed to copy notation', 'error'));
    }
    
    clearNotation() {
        if (confirm('Clear all notation?')) {
            this.moveHistory = [];
            this.updateMoveHistory();
            this.showNotification('Notation cleared');
        }
    }
    
    // Utility Functions
    playSound(type) {
        if (!this.soundEnabled) return;
        
        const audio = document.getElementById(`${type}-sound`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    showNotification(message, type = 'info') {
        if (typeof toastr !== 'undefined') {
            const options = {
                closeButton: true,
                progressBar: true,
                positionClass: 'toast-top-right',
                timeOut: 3000
            };
            
            switch(type) {
                case 'success':
                    toastr.success(message, 'Success', options);
                    break;
                case 'error':
                    toastr.error(message, 'Error', options);
                    break;
                case 'warning':
                    toastr.warning(message, 'Warning', options);
                    break;
                default:
                    toastr.info(message, 'Info', options);
            }
        } else {
            console.log(message);
        }
    }
    
    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('Welcome to Enhanced Chess! Use keyboard shortcuts for faster play.', 'info');
        }, 1000);
    }
    
    showRules() {
        const rules = [
            '1. Click a piece to select it, then click a destination square',
            '2. Castle by moving the king two squares toward a rook',
            '3. En passant: Capture pawn that just moved two squares',
            '4. Pawns promote when reaching the opposite side',
            '5. Checkmate ends the game',
            '6. Use Ctrl+Z to undo moves',
            '7. Press H for hints'
        ];
        
        alert('Chess Rules:\n\n' + rules.join('\n'));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new EnhancedChessGame();
    
    // Initialize toastr
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-top-right',
            timeOut: 3000
        };
    }
});