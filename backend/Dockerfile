FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

FROM golang:1.21-alpine

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the binary from builder stage (for production)
COPY --from=builder /app/main .

# Note: Environment variables are passed via docker-compose.yml
# No need to copy .env file
# For development with volumes, Go is already installed in this image

# Expose port
EXPOSE 8080

# Run the application
# Note: In docker-compose, volumes mount over this, so we need to build and run from /app
CMD ["./main"]
