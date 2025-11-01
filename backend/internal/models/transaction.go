package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Transaction struct {
	ID              uuid.UUID        `json:"id" db:"id"`
	TransactionType string           `json:"transaction_type" db:"transaction_type"`
	Amount          decimal.Decimal  `json:"amount" db:"amount"`
	Currency        string           `json:"currency" db:"currency"`
	FromAccountID   *uuid.UUID       `json:"from_account_id" db:"from_account_id"`
	ToAccountID     *uuid.UUID       `json:"to_account_id" db:"to_account_id"`
	ExchangeRate    *decimal.Decimal `json:"exchange_rate" db:"exchange_rate"`
	Description     string           `json:"description" db:"description"`
	IdempotencyKey  string           `json:"idempotency_key" db:"idempotency_key"`
	CreatedAt       time.Time        `json:"created_at" db:"created_at"`
	CreatedBy       uuid.UUID        `json:"created_by" db:"created_by"`
}

type TransferRequest struct {
	FromAccountID  uuid.UUID       `json:"from_account_id" binding:"required"`
	ToAccountID    uuid.UUID       `json:"to_account_id" binding:"required"`
	Amount         decimal.Decimal `json:"amount" binding:"required,gt=0"`
	Description    string          `json:"description"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type ExchangeRequest struct {
	FromAccountID  uuid.UUID       `json:"from_account_id" binding:"required"`
	ToAccountID    uuid.UUID       `json:"to_account_id" binding:"required"`
	Amount         decimal.Decimal `json:"amount" binding:"required,gt=0"`
	ExchangeRate   decimal.Decimal `json:"exchange_rate" binding:"required,gt=0"`
	Description    string          `json:"description"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type DepositRequest struct {
	AccountID      uuid.UUID       `json:"account_id" binding:"required"`
	Amount         decimal.Decimal `json:"amount" binding:"required,gt=0"`
	Description    string          `json:"description"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type TransactionResponse struct {
	ID              uuid.UUID        `json:"id"`
	TransactionType string           `json:"transaction_type"`
	Amount          decimal.Decimal  `json:"amount"`
	Currency        string           `json:"currency"`
	FromAccountID   *uuid.UUID       `json:"from_account_id"`
	ToAccountID     *uuid.UUID       `json:"to_account_id"`
	ExchangeRate    *decimal.Decimal `json:"exchange_rate"`
	Description     string           `json:"description"`
	CreatedAt       time.Time        `json:"created_at"`
}
