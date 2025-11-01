package main

import (
	"log"
	"os"

	"mini-bank/internal/database"
	"mini-bank/internal/handlers"
	"mini-bank/internal/middleware"
	"mini-bank/internal/repository"
	"mini-bank/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	db, err := database.NewConnection()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	accountRepo := repository.NewAccountRepository(db.DB)
	transactionRepo := repository.NewTransactionRepository(db.DB)

	// Initialize services
	transferService := services.NewTransferService(db.DB, accountRepo, transactionRepo)
	exchangeService := services.NewExchangeService(db.DB, accountRepo, transactionRepo)
	depositService := services.NewDepositService(db.DB, accountRepo, transactionRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo)
	accountHandler := handlers.NewAccountHandler(accountRepo)
	transactionHandler := handlers.NewTransactionHandler(transactionRepo, transferService, exchangeService, depositService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(userRepo)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes
	router.POST("/auth/register", authHandler.Register)
	router.POST("/auth/login", authHandler.Login)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(authMiddleware.RequireAuth())
	{
		// Account routes
		protected.POST("/accounts", accountHandler.CreateAccount)
		protected.GET("/accounts", accountHandler.GetAccounts)

		// Transaction routes
		protected.POST("/transactions/transfer", transactionHandler.Transfer)
		protected.POST("/transactions/exchange", transactionHandler.Exchange)
		protected.POST("/transactions/deposit", transactionHandler.Deposit)
		protected.GET("/transactions", transactionHandler.GetTransactions)
		protected.GET("/transactions/:id", transactionHandler.GetTransaction)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
