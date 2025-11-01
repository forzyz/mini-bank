package repository

import (
	"database/sql"
	"fmt"

	"mini-bank/internal/models"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type AccountRepository struct {
	db *sql.DB
}

func NewAccountRepository(db *sql.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) CreateAccount(userID uuid.UUID, req models.CreateAccountRequest) (*models.Account, error) {
	account := &models.Account{
		UserID:      userID,
		Currency:    req.Currency,
		AccountType: req.AccountType,
	}

	query := `
		INSERT INTO accounts (user_id, currency, account_type)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(query, account.UserID, account.Currency, account.AccountType).
		Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	return account, nil
}

func (r *AccountRepository) GetAccountsByUserID(userID uuid.UUID) ([]models.AccountWithBalance, error) {
	query := `
		SELECT a.id, a.user_id, a.currency, a.account_type, a.created_at, a.updated_at,
		       COALESCE(ab.balance, 0) as balance
		FROM accounts a
		LEFT JOIN account_balances ab ON a.id = ab.account_id
		WHERE a.user_id = $1
		ORDER BY a.currency, a.account_type
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get accounts: %w", err)
	}
	defer rows.Close()

	var accounts []models.AccountWithBalance
	for rows.Next() {
		var account models.AccountWithBalance
		err := rows.Scan(
			&account.ID, &account.UserID, &account.Currency, &account.AccountType,
			&account.CreatedAt, &account.UpdatedAt, &account.Balance,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan account: %w", err)
		}
		accounts = append(accounts, account)
	}

	return accounts, nil
}

func (r *AccountRepository) GetAccountByID(accountID uuid.UUID) (*models.Account, error) {
	account := &models.Account{}
	query := `
		SELECT id, user_id, currency, account_type, created_at, updated_at
		FROM accounts WHERE id = $1
	`

	err := r.db.QueryRow(query, accountID).Scan(
		&account.ID, &account.UserID, &account.Currency, &account.AccountType,
		&account.CreatedAt, &account.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("account not found")
		}
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	return account, nil
}

func (r *AccountRepository) GetAccountBalance(accountID uuid.UUID) (decimal.Decimal, error) {
	var balance decimal.Decimal
	query := `
		SELECT COALESCE(balance, 0) FROM account_balances WHERE account_id = $1
	`

	err := r.db.QueryRow(query, accountID).Scan(&balance)
	if err != nil {
		if err == sql.ErrNoRows {
			return decimal.Zero, nil
		}
		return decimal.Zero, fmt.Errorf("failed to get account balance: %w", err)
	}

	return balance, nil
}
