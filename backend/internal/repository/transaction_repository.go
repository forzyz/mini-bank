package repository

import (
	"database/sql"
	"fmt"

	"mini-bank/internal/models"

	"github.com/google/uuid"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) CreateTransaction(tx *sql.Tx, transaction *models.Transaction) error {
	query := `
		INSERT INTO transactions (id, transaction_type, amount, currency, from_account_id, to_account_id, exchange_rate, description, idempotency_key, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at
	`

	// Convert empty string to NULL for idempotency_key to avoid unique constraint violations
	// PostgreSQL UNIQUE allows multiple NULLs but not multiple empty strings
	var idempotencyKey interface{}
	if transaction.IdempotencyKey == "" {
		idempotencyKey = nil
	} else {
		idempotencyKey = transaction.IdempotencyKey
	}

	err := tx.QueryRow(
		query,
		transaction.ID, transaction.TransactionType, transaction.Amount, transaction.Currency,
		transaction.FromAccountID, transaction.ToAccountID, transaction.ExchangeRate,
		transaction.Description, idempotencyKey, transaction.CreatedBy,
	).Scan(&transaction.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	return nil
}

func (r *TransactionRepository) GetTransactionsByUserID(userID uuid.UUID, limit, offset int) ([]models.TransactionResponse, error) {
	query := `
		SELECT t.id, t.transaction_type, t.amount, t.currency, t.from_account_id, t.to_account_id, 
		       t.exchange_rate, t.description, t.created_at
		FROM transactions t
		WHERE t.created_by = $1
		ORDER BY t.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}
	defer rows.Close()

	var transactions []models.TransactionResponse
	for rows.Next() {
		var transaction models.TransactionResponse
		err := rows.Scan(
			&transaction.ID, &transaction.TransactionType, &transaction.Amount, &transaction.Currency,
			&transaction.FromAccountID, &transaction.ToAccountID, &transaction.ExchangeRate,
			&transaction.Description, &transaction.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}
		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

func (r *TransactionRepository) GetTransactionByID(transactionID uuid.UUID) (*models.TransactionResponse, error) {
	transaction := &models.TransactionResponse{}
	query := `
		SELECT id, transaction_type, amount, currency, from_account_id, to_account_id, 
		       exchange_rate, description, created_at
		FROM transactions WHERE id = $1
	`

	err := r.db.QueryRow(query, transactionID).Scan(
		&transaction.ID, &transaction.TransactionType, &transaction.Amount, &transaction.Currency,
		&transaction.FromAccountID, &transaction.ToAccountID, &transaction.ExchangeRate,
		&transaction.Description, &transaction.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("transaction not found")
		}
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	return transaction, nil
}

func (r *TransactionRepository) CheckIdempotencyKey(idempotencyKey string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM transactions WHERE idempotency_key = $1)`

	err := r.db.QueryRow(query, idempotencyKey).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check idempotency key: %w", err)
	}

	return exists, nil
}
