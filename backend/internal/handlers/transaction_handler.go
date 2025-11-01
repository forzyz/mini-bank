package handlers

import (
	"net/http"
	"strconv"

	"mini-bank/internal/models"
	"mini-bank/internal/repository"
	"mini-bank/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TransactionHandler struct {
	transactionRepo *repository.TransactionRepository
	transferService *services.TransferService
	exchangeService *services.ExchangeService
	depositService  *services.DepositService
}

func NewTransactionHandler(
	transactionRepo *repository.TransactionRepository,
	transferService *services.TransferService,
	exchangeService *services.ExchangeService,
	depositService *services.DepositService,
) *TransactionHandler {
	return &TransactionHandler{
		transactionRepo: transactionRepo,
		transferService: transferService,
		exchangeService: exchangeService,
		depositService:  depositService,
	}
}

func (h *TransactionHandler) Transfer(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req models.TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.transferService.ProcessTransfer(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *TransactionHandler) Exchange(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req models.ExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.exchangeService.ProcessExchange(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	transactions, err := h.transactionRepo.GetTransactionsByUserID(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	transactionIDStr := c.Param("id")
	transactionID, err := uuid.Parse(transactionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	transaction, err := h.transactionRepo.GetTransactionByID(transactionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

func (h *TransactionHandler) Deposit(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	
	var req models.DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.depositService.ProcessDeposit(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}
