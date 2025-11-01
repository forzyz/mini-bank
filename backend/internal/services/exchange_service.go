package services

import (
	"database/sql"
	"fmt"

	"mini-bank/internal/models"
	"mini-bank/internal/repository"

	"github.com/google/uuid"
)

type ExchangeService struct {
	db              *sql.DB
	accountRepo     *repository.AccountRepository
	transactionRepo *repository.TransactionRepository
}

func NewExchangeService(db *sql.DB, accountRepo *repository.AccountRepository, transactionRepo *repository.TransactionRepository) *ExchangeService {
	return &ExchangeService{
		db:              db,
		accountRepo:     accountRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *ExchangeService) ProcessExchange(userID uuid.UUID, req models.ExchangeRequest) (*models.TransactionResponse, error) {
	// Check if idempotency key already exists
	if req.IdempotencyKey != "" {
		exists, err := s.transactionRepo.CheckIdempotencyKey(req.IdempotencyKey)
		if err != nil {
			return nil, fmt.Errorf("failed to check idempotency key: %w", err)
		}
		if exists {
			return nil, fmt.Errorf("transaction with this idempotency key already exists")
		}
	}

	// Validate accounts
	fromAccount, err := s.accountRepo.GetAccountByID(req.FromAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get from account: %w", err)
	}

	toAccount, err := s.accountRepo.GetAccountByID(req.ToAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get to account: %w", err)
	}

	// Check if user owns the from account
	if fromAccount.UserID != userID {
		return nil, fmt.Errorf("unauthorized: you don't own the from account")
	}

	// Check if currencies are different
	if fromAccount.Currency == toAccount.Currency {
		return nil, fmt.Errorf("cannot exchange between same currencies")
	}

	// Check sufficient balance
	balance, err := s.accountRepo.GetAccountBalance(req.FromAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account balance: %w", err)
	}

	if balance.LessThan(req.Amount) {
		return nil, fmt.Errorf("insufficient balance")
	}

	// Calculate converted amount
	convertedAmount := req.Amount.Mul(req.ExchangeRate)

	// Process exchange in transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Create debit transaction (from source currency)
	debitTransaction := &models.Transaction{
		ID:              uuid.New(),
		TransactionType: "exchange",
		Amount:          req.Amount,
		Currency:        fromAccount.Currency,
		FromAccountID:   &req.FromAccountID,
		ToAccountID:     &req.ToAccountID,
		ExchangeRate:    &req.ExchangeRate,
		Description:     req.Description,
		IdempotencyKey:  req.IdempotencyKey,
		CreatedBy:       userID,
	}

	err = s.transactionRepo.CreateTransaction(tx, debitTransaction)
	if err != nil {
		return nil, fmt.Errorf("failed to create debit transaction: %w", err)
	}

	// Create credit transaction (to target currency)
	creditTransaction := &models.Transaction{
		ID:              uuid.New(),
		TransactionType: "exchange",
		Amount:          convertedAmount,
		Currency:        toAccount.Currency,
		FromAccountID:   &req.FromAccountID,
		ToAccountID:     &req.ToAccountID,
		ExchangeRate:    &req.ExchangeRate,
		Description:     req.Description,
		IdempotencyKey:  req.IdempotencyKey,
		CreatedBy:       userID,
	}

	err = s.transactionRepo.CreateTransaction(tx, creditTransaction)
	if err != nil {
		return nil, fmt.Errorf("failed to create credit transaction: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return transaction response
	response := &models.TransactionResponse{
		ID:              debitTransaction.ID,
		TransactionType: debitTransaction.TransactionType,
		Amount:          debitTransaction.Amount,
		Currency:        debitTransaction.Currency,
		FromAccountID:   debitTransaction.FromAccountID,
		ToAccountID:     debitTransaction.ToAccountID,
		ExchangeRate:    debitTransaction.ExchangeRate,
		Description:     debitTransaction.Description,
		CreatedAt:       debitTransaction.CreatedAt,
	}

	return response, nil
}
