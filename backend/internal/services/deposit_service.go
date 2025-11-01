package services

import (
	"database/sql"
	"fmt"

	"mini-bank/internal/models"
	"mini-bank/internal/repository"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type DepositService struct {
	db              *sql.DB
	accountRepo     *repository.AccountRepository
	transactionRepo *repository.TransactionRepository
}

func NewDepositService(db *sql.DB, accountRepo *repository.AccountRepository, transactionRepo *repository.TransactionRepository) *DepositService {
	return &DepositService{
		db:              db,
		accountRepo:     accountRepo,
		transactionRepo: transactionRepo,
	}
}

func (s *DepositService) ProcessDeposit(userID uuid.UUID, req models.DepositRequest) (*models.TransactionResponse, error) {
	// Validate account
	account, err := s.accountRepo.GetAccountByID(req.AccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	// Check if user owns the account
	if account.UserID != userID {
		return nil, fmt.Errorf("unauthorized: you don't own this account")
	}

	// Validate amount
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, fmt.Errorf("amount must be greater than zero")
	}

	// Process deposit in transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Create deposit transaction (from_account_id is NULL for deposits)
	depositTransaction := &models.Transaction{
		ID:              uuid.New(),
		TransactionType: "deposit",
		Amount:          req.Amount,
		Currency:        account.Currency,
		FromAccountID:   nil, // No from account for deposits
		ToAccountID:     &req.AccountID,
		Description:     req.Description,
		IdempotencyKey:  req.IdempotencyKey,
		CreatedBy:       userID,
	}

	err = s.transactionRepo.CreateTransaction(tx, depositTransaction)
	if err != nil {
		return nil, fmt.Errorf("failed to create deposit transaction: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return transaction response
	response := &models.TransactionResponse{
		ID:              depositTransaction.ID,
		TransactionType: depositTransaction.TransactionType,
		Amount:          depositTransaction.Amount,
		Currency:        depositTransaction.Currency,
		FromAccountID:   depositTransaction.FromAccountID,
		ToAccountID:     depositTransaction.ToAccountID,
		Description:     depositTransaction.Description,
		CreatedAt:       depositTransaction.CreatedAt,
	}

	return response, nil
}
