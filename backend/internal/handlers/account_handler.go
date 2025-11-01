package handlers

import (
	"net/http"

	"mini-bank/internal/models"
	"mini-bank/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AccountHandler struct {
	accountRepo *repository.AccountRepository
}

func NewAccountHandler(accountRepo *repository.AccountRepository) *AccountHandler {
	return &AccountHandler{accountRepo: accountRepo}
}

func (h *AccountHandler) CreateAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req models.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.accountRepo.CreateAccount(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	c.JSON(http.StatusCreated, account)
}

func (h *AccountHandler) GetAccounts(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	accounts, err := h.accountRepo.GetAccountsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accounts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"accounts": accounts})
}
