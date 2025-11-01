package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Account struct {
	ID          uuid.UUID `json:"id" db:"id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	Currency    string    `json:"currency" db:"currency"`
	AccountType string    `json:"account_type" db:"account_type"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type AccountBalance struct {
	AccountID uuid.UUID       `json:"account_id" db:"account_id"`
	Balance   decimal.Decimal `json:"balance" db:"balance"`
	Currency  string          `json:"currency" db:"currency"`
	UpdatedAt time.Time       `json:"updated_at" db:"updated_at"`
}

type AccountWithBalance struct {
	Account
	Balance decimal.Decimal `json:"balance"`
}

type CreateAccountRequest struct {
	Currency    string `json:"currency" binding:"required,len=3"`
	AccountType string `json:"account_type" binding:"required"`
}
