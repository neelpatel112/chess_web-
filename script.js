class ChessGame {
    constructor() {
        this.board = null;
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.flipped = false;
        this.whiteTime = 15 * 60; // 15 minutes in seconds
        this.blackTime = 15 * 60;
        this.timerInterval = null;
        
        this.pieceUnicode = {
            'white': {
                'king': '♔',
                'queen': '♕',
                'rook': '♖',
                'bishop': '♗',
                'knight': '♘',
                'pawn': '♙'
            },
            'black': {
                'king': '♚',
                'queen': '♛',
                'rook': '♜',
                'bishop': '♝',
                'knight': '♞',
                'pawn': '♟'
            }
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.startTimer();
        this.updateStatus();
    }
    
    createBoard() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Initialize pieces
        // White pieces
        this.board[7][0] = { type: 'rook', color: 'white' };
        this.board[7][1] = { type: 'knight', color: 'white' };
        this.board[7][2] = { type: 'bishop', color: 'white' };
        this.board[7][3] = { type: 'queen', color: 'white' };
        this.board[7][4] = { type: 'king', color: 'white' };
        this.board[7][5] = { type: 'bishop', color: 'white' };
        this.board[7][6] = { type: 'knight', color: 'white' };
        this.board[7][7] = { type: 'rook', color: 'white' };
        
        // White pawns
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { type: 'pawn', color: 'white' };
        }
        
        // Black pieces
        this.board[0][0] = { type: 'rook', color: 'black' };
        this.board[0][1] = { type: 'knight', color: 'black' };
        this.board[0][2] = { type: 'bishop', color: 'black' };
        this.board[0][3] = { type: 'queen', color: 'black' };
        this.board[0][4] = { type: 'king', color: 'black' };
        this.board[0][5] = { type: 'bishop', color: 'black' };
        this.board[0][6] = { type: 'knight', color: 'black' };
        this.board[0][7] = { type: 'rook', color: 'black' };
        
        // Black pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black' };
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
                
                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.pieceUnicode[piece.color][piece.type];
                    square.style.color = piece.color === 'white' ? '#fff' : '#333';
                }
                
                boardElement.appendChild(square);
            }
        }
    }
    
    setupEventListeners() {
        // Board squares
        document.getElementById('chess-board').addEventListener('click', (e) => {
            if (!e.target.classList.contains('square')) return;
            if (!this.gameActive) return;
            
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            this.handleSquareClick(row, col);
        });
        
        // Control buttons
        document.getElementById('new-game').addEventListener('click', () => this.resetGame());
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        
        // Promotion modal
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', (e) => {
                const pieceType = e.target.dataset.piece;
                this.completePromotion(pieceType);
            });
        });
        
        // Settings
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
        
        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // In a real implementation, this would change piece images
            });
        });
    }
    
    handleSquareClick(row, col) {
        const piece = this.board[row][col];
        
        // If a piece is already selected
        if (this.selectedPiece) {
            // Check if the clicked square is a valid move
            const isMoveValid = this.validMoves.some(move => 
                move.row === row && move.col === col
            );
            
            if (isMoveValid) {
                this.makeMove(row, col);
            } else {
                // Deselect if clicking on another piece of same color
                if (piece && piece.color === this.currentPlayer) {
                    this.selectPiece(row, col);
                } else {
                    this.clearSelection();
                }
            }
        } 
        // If no piece is selected and clicked square has current player's piece
        else if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        }
    }
    
    selectPiece(row, col) {
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
    }
    
    calculateValidMoves(row, col, piece) {
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'queen':
                moves.push(...this.getRookMoves(row, col, piece.color));
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }
        
        // Filter out moves that would put king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Move forward one square
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Move forward two squares from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Diagonal captures
        const captureCols = [col - 1, col + 1];
        for (const captureCol of captureCols) {
            if (this.isValidSquare(row + direction, captureCol)) {
                const targetPiece = this.board[row + direction][captureCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: row + direction, col: captureCol });
                }
            }
        }
        
        return moves;
    }
    
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
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
        }
        
        return moves;
    }
    
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dr, dc] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (!piece || piece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of directions) {
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
        }
        
        return moves;
    }
    
    getKingMoves(row, col, color) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [dr, dc] of kingMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (!piece || piece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const originalBoard = JSON.parse(JSON.stringify(this.board));
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];
        
        // Make the move
        this.board[fromRow][fromCol] = null;
        this.board[toRow][toCol] = piece;
        
        // Find king position
        let kingRow, kingCol;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === 'king' && p.color === color) {
                    kingRow = r;
                    kingCol = c;
                    break;
                }
            }
        }
        
        // Check if any opponent piece can attack the king
        const inCheck = this.isSquareAttacked(kingRow, kingCol, color === 'white' ? 'black' : 'white');
        
        // Restore board
        this.board = originalBoard;
        
        return inCheck;
    }
    
    isSquareAttacked(row, col, attackingColor) {
        // Check for pawn attacks
        const pawnDirection = attackingColor === 'white' ? -1 : 1;
        const pawnAttackCols = [col - 1, col + 1];
        for (const c of pawnAttackCols) {
            if (this.isValidSquare(row + pawnDirection, c)) {
                const piece = this.board[row + pawnDirection][c];
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
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (piece && piece.type === 'knight' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        // Check for rook/queen attacks (straight lines)
        const straightDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of straightDirections) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (piece) {
                    if (piece.color === attackingColor && 
                        (piece.type === 'rook' || piece.type === 'queen')) {
                        return true;
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        
        // Check for bishop/queen attacks (diagonals)
        const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagonalDirections) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (piece) {
                    if (piece.color === attackingColor && 
                        (piece.type === 'bishop' || piece.type === 'queen')) {
                        return true;
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        
        // Check for king attacks (adjacent squares)
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        for (const [dr, dc] of kingMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidSquare(newRow, newCol)) {
                const piece = this.board[newRow][newCol];
                if (piece && piece.type === 'king' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    makeMove(toRow, toCol) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        const piece = this.selectedPiece;
        const capturedPiece = this.board[toRow][toCol];
        
        // Record move
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        };
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            move.promotion = true;
            this.showPromotionModal(toRow, toCol);
            this.pendingPromotion = { move, toRow, toCol };
            return;
        }
        
        // Execute the move
        this.executeMove(move);
    }
    
    executeMove(move) {
        const { from, to, piece, captured } = move;
        
        // Move the piece
        this.board[from.row][from.col] = null;
        this.board[to.row][to.col] = piece;
        
        // Handle captured piece
        if (captured) {
            this.capturedPieces[piece.color].push(captured);
            this.updateCapturedPieces();
        }
        
        // Record move history
        this.moveHistory.push(move);
        this.updateMoveHistory();
        
        // Clear selection and switch player
        this.clearSelection();
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check for game end conditions
        this.checkGameEnd();
        
        // Update UI
        this.renderBoard();
        this.updateStatus();
    }
    
    showPromotionModal(row, col) {
        document.getElementById('promotion-modal').style.display = 'flex';
    }
    
    completePromotion(pieceType) {
        if (!this.pendingPromotion) return;
        
        const { move, toRow, toCol } = this.pendingPromotion;
        
        // Update piece type
        this.board[toRow][toCol].type = pieceType;
        move.promotedTo = pieceType;
        
        // Hide modal
        document.getElementById('promotion-modal').style.display = 'none';
        
        // Complete the move
        this.executeMove(move);
        this.pendingPromotion = null;
    }
    
    checkGameEnd() {
        // Find king positions
        let whiteKing = null, blackKing = null;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king') {
                    if (piece.color === 'white') whiteKing = { row, col };
                    else blackKing = { row, col };
                }
            }
        }
        
        // Check for check
        const whiteInCheck = this.isSquareAttacked(whiteKing.row, whiteKing.col, 'black');
        const blackInCheck = this.isSquareAttacked(blackKing.row, blackKing.col, 'white');
        
        // Highlight kings in check
        this.highlightCheck(whiteInCheck, blackInCheck);
        
        // Check for checkmate or stalemate
        const currentColor = this.currentPlayer;
        const hasLegalMoves = this.hasLegalMoves(currentColor);
        
        if (!hasLegalMoves) {
            if (currentColor === 'white' && whiteInCheck) {
                this.endGame('Black wins by checkmate!');
            } else if (currentColor === 'black' && blackInCheck) {
                this.endGame('White wins by checkmate!');
            } else {
                this.endGame('Stalemate!');
            }
        }
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
    
    highlightCheck(whiteInCheck, blackInCheck) {
        // Remove previous check highlights
        document.querySelectorAll('.in-check').forEach(sq => sq.classList.remove('in-check'));
        
        // Find and highlight kings in check
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king') {
                    const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
                    if ((piece.color === 'white' && whiteInCheck) || 
                        (piece.color === 'black' && blackInCheck)) {
                        square.classList.add('in-check');
                    }
                }
            }
        }
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
        
        const checkText = this.currentPlayer === 'white' ? 
            (this.isWhiteInCheck() ? ' (White is in check!)' : '') :
            (this.isBlackInCheck() ? ' (Black is in check!)' : '');
        
        statusElement.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} to move${checkText}`;
    }
    
    isWhiteInCheck() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === 'white') {
                    return this.isSquareAttacked(row, col, 'black');
                }
            }
        }
        return false;
    }
    
    isBlackInCheck() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === 'black') {
                    return this.isSquareAttacked(row, col, 'white');
                }
            }
        }
        return false;
    }
    
    updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        historyElement.innerHTML = '';
        
        this.moveHistory.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move-entry';
            
            const fromNotation = this.getSquareNotation(move.from.row, move.from.col);
            const toNotation = this.getSquareNotation(move.to.row, move.to.col);
            const pieceSymbol = this.getPieceSymbol(move.piece);
            
            moveElement.innerHTML = `
                <span>${index + 1}. ${pieceSymbol} ${fromNotation} → ${toNotation}</span>
                <span>${move.captured ? '×' : ''}</span>
            `;
            
            historyElement.appendChild(moveElement);
        });
        
        // Scroll to bottom
        historyElement.scrollTop = historyElement.scrollHeight;
    }
    
    getSquareNotation(row, col) {
        const letters = 'abcdefgh';
        return letters[col] + (8 - row);
    }
    
    getPieceSymbol(piece) {
        const symbols = {
            'king': 'K', 'queen': 'Q', 'rook': 'R',
            'bishop': 'B', 'knight': 'N', 'pawn': ''
        };
        return symbols[piece.type];
    }
    
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('white-captured');
        const blackCaptured = document.getElementById('black-captured');
        
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
        
        this.capturedPieces.white.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.pieceUnicode[piece.color][piece.type];
            span.style.color = '#333';
            whiteCaptured.appendChild(span);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const span = document.createElement('span');
            span.className = 'captured-piece';
            span.textContent = this.pieceUnicode[piece.color][piece.type];
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
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        document.getElementById('white-clock').textContent = formatTime(this.whiteTime);
        document.getElementById('black-clock').textContent = formatTime(this.blackTime);
    }
    
    flipBoard() {
        this.flipped = !this.flipped;
        const board = document.getElementById('chess-board');
        board.style.transform = this.flipped ? 'rotate(180deg)' : 'rotate(0deg)';
        
        // Flip pieces
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            if (square.textContent) {
                square.style.transform = this.flipped ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore board state
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        
        // Remove from captured pieces if needed
        if (lastMove.captured) {
            const capturedArray = this.capturedPieces[lastMove.piece.color];
            const index = capturedArray.findIndex(p => 
                p.type === lastMove.captured.type && p.color === lastMove.captured.color
            );
            if (index > -1) {
                capturedArray.splice(index, 1);
            }
        }
        
        // Switch player back
        this.currentPlayer = lastMove.piece.color;
        
        // Update UI
        this.renderBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.checkGameEnd();
    }
    
    resetGame() {
        this.stopTimer();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.gameActive = true;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.whiteTime = 15 * 60;
        this.blackTime = 15 * 60;
        
        this.createBoard();
        this.updateStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateClocks();
        this.startTimer();
        
        document.getElementById('promotion-modal').style.display = 'none';
    }
    
    endGame(message) {
        this.gameActive = false;
        this.stopTimer();
        document.getElementById('status-message').textContent = message;
        
        // Add game over class to status
        const statusElement = document.getElementById('status-message');
        statusElement.style.background = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
        statusElement.style.color = 'white';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
}); 