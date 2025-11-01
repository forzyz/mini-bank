package services

import (
	"database/sql"
	"fmt"

	"mini-bank/internal/models"
	"mini-bank/internal/repository"

	"github.com/google/uuid"
)

type TransferService struct {
	db              *sql.DB
	accountRepo     *repository.AccountRepository
	transactionRepo *repository.TransactionRepository
}

func NewTransferService(db *sql.DB, accountRepo *repository.AccountRepository, transactionRepo *repository.TransactionRepository) *TransferService {
	return &TransferService{
		db:              db,
		accountRepo:     accountRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *TransferService) ProcessTransfer(userID uuid.UUID, req models.TransferRequest) (*models.TransactionResponse, error) {
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

	// Check if currencies match
	if fromAccount.Currency != toAccount.Currency {
		return nil, fmt.Errorf("currency mismatch: cannot transfer between different currencies")
	}

	// Check sufficient balance
	balance, err := s.accountRepo.GetAccountBalance(req.FromAccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account balance: %w", err)
	}

	if balance.LessThan(req.Amount) {
		return nil, fmt.Errorf("insufficient balance")
	}

	// Process transfer in transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Create debit transaction
	debitTransaction := &models.Transaction{
		ID:              uuid.New(),
		TransactionType: "transfer",
		Amount:          req.Amount,
		Currency:        fromAccount.Currency,
		FromAccountID:   &req.FromAccountID,
		ToAccountID:     &req.ToAccountID,
		Description:     req.Description,
		IdempotencyKey:  req.IdempotencyKey,
		CreatedBy:       userID,
	}

	err = s.transactionRepo.CreateTransaction(tx, debitTransaction)
	if err != nil {
		return nil, fmt.Errorf("failed to create debit transaction: %w", err)
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
		Description:     debitTransaction.Description,
		CreatedAt:       debitTransaction.CreatedAt,
	}

	return response, nil
}
