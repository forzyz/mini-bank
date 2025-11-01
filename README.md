# Mini Bank - Modern Banking Application

A full-stack banking application built with Go, Next.js, and PostgreSQL, featuring double-entry accounting, multi-currency support, and real-time transaction processing.

## 🏗️ Architecture

### Backend (Go)

-   **Framework**: Gin HTTP framework
-   **Database**: PostgreSQL with double-entry ledger
-   **Authentication**: JWT-based authentication
-   **Concurrency**: Serializable transactions with row-level locking
-   **Features**: Transfer, exchange, account management

### Frontend (Next.js)

-   **Framework**: Next.js 14 with App Router
-   **Styling**: Tailwind CSS
-   **State Management**: React hooks with context
-   **UI Components**: Custom components with Lucide React icons

### Database

-   **Engine**: PostgreSQL 15
-   **Schema**: Double-entry accounting with materialized balances
-   **Migrations**: SQL migration files
-   **Seeding**: Pre-populated with test users and accounts

## 🚀 Quick Start

### Prerequisites

-   Docker and Docker Compose
-   Go 1.21+ (for local development)
-   Node.js 18+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone and setup**:

```bash
git clone <repository-url>
cd mini-bank
```

2. **Start all services**:

```bash
docker-compose up -d
```

3. **Access the application**:
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:8080
    - Database: localhost:5432

### Local Development

1. **Start PostgreSQL**:

```bash
docker-compose up postgres -d
```

2. **Run database migrations**:

```bash
# The migrations will run automatically when PostgreSQL starts
# Or manually:
psql -h localhost -U minibank -d minibank -f backend/migrations/001_initial_schema.sql
psql -h localhost -U minibank -d minibank -f backend/migrations/002_seed_data.sql
```

3. **Start the backend**:

```bash
cd backend
go mod download
go run cmd/api/main.go
```

4. **Start the frontend**:

```bash
cd frontend
npm install
npm run dev
```

## 🏦 Features

### Core Banking Features

-   **Account Management**: Create and manage multiple currency accounts
-   **Money Transfers**: Send money between accounts (same currency)
-   **Currency Exchange**: Convert between different currencies
-   **Transaction History**: View all transactions with pagination
-   **Real-time Balances**: Materialized view for instant balance updates

### Security Features

-   **JWT Authentication**: Secure token-based authentication
-   **Password Hashing**: bcrypt password hashing
-   **Input Validation**: Comprehensive request validation
-   **SQL Injection Protection**: Parameterized queries

### Accounting Features

-   **Double-Entry Ledger**: Every transaction creates balanced entries
-   **Concurrency Safety**: Serializable transactions with row locks
-   **Idempotency**: Prevent duplicate transactions
-   **Audit Trail**: Complete transaction history

## 📊 Database Schema

### Core Tables

-   **users**: User accounts and authentication
-   **accounts**: Bank accounts with currency support
-   **transactions**: Double-entry transaction ledger
-   **account_balances**: Materialized view for performance

### Key Features

-   **Automatic Balance Updates**: Triggers maintain account balances
-   **Currency Support**: Multi-currency account management
-   **Transaction Types**: Transfer, exchange, deposit, withdrawal
-   **Audit Fields**: Created/updated timestamps and user tracking

## 🔐 Test Users

The system comes pre-seeded with test users:

| User  | Email             | Password | USD Balance | EUR Balance |
| ----- | ----------------- | -------- | ----------- | ----------- |
| Alice | alice@example.com | password | $10,000.00  | €8,500.00   |
| Bob   | bob@example.com   | password | $5,000.00   | €4,200.00   |
| Carol | carol@example.com | password | $7,500.00   | €6,300.00   |

## 🛠️ API Endpoints

### Authentication

-   `POST /auth/register` - User registration
-   `POST /auth/login` - User login

### Accounts

-   `GET /api/accounts` - List user accounts
-   `POST /api/accounts` - Create new account

### Transactions

-   `POST /api/transactions/transfer` - Transfer money
-   `POST /api/transactions/exchange` - Exchange currency
-   `GET /api/transactions` - Transaction history
-   `GET /api/transactions/:id` - Get specific transaction

## 🎨 Frontend Pages

### Authentication

-   **Login/Register**: Toggle between login and registration forms
-   **Form Validation**: Real-time validation with error messages

### Dashboard

-   **Account Overview**: Display all accounts with balances
-   **Quick Actions**: Transfer, exchange, history, accounts
-   **Responsive Design**: Mobile-friendly interface

### Transfer Page

-   **Account Selection**: Choose from/to accounts
-   **Amount Input**: Decimal amount with validation
-   **Balance Checking**: Real-time balance validation
-   **Same Currency**: Only allow transfers between same currency

### Exchange Page

-   **Currency Conversion**: Exchange between different currencies
-   **Exchange Rate**: Manual rate input with preview
-   **Amount Calculation**: Real-time conversion preview
-   **Different Currency**: Only allow exchanges between different currencies

### History Page

-   **Transaction List**: Paginated transaction history
-   **Transaction Types**: Visual indicators for transfer/exchange
-   **Load More**: Infinite scroll pagination
-   **Transaction Details**: Amount, currency, description, timestamp

### Accounts Page

-   **Account Management**: View all accounts with balances
-   **Create Account**: Add new currency accounts
-   **Account Types**: Checking and savings accounts
-   **Currency Support**: USD, EUR, GBP, JPY

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=minibank
DB_PASSWORD=password
DB_NAME=minibank
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=8080
ENV=development
```

#### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Docker Compose Services

-   **postgres**: PostgreSQL database with migrations
-   **backend**: Go API server
-   **frontend**: Next.js application

## 🧪 Testing

### Manual Testing

1. **Register/Login**: Create account or use test users
2. **Create Accounts**: Add USD/EUR accounts
3. **Transfer Money**: Send money between same-currency accounts
4. **Exchange Currency**: Convert between different currencies
5. **View History**: Check transaction history

### API Testing

```bash
# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password"}'

# Get accounts (with JWT token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/accounts
```

## 🚀 Production Deployment

### Security Considerations

-   Change default JWT secret
-   Use environment-specific database credentials
-   Enable HTTPS
-   Configure proper CORS settings
-   Set up database backups
-   Use connection pooling

### Performance Optimizations

-   Database indexing
-   Connection pooling
-   Caching strategies
-   CDN for static assets

## 📝 Development

### Project Structure

```
mini-bank/
├── backend/
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repository/
│   │   └── services/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Adding New Features

1. **Backend**: Add models, repository, service, handler
2. **Database**: Create migration files
3. **Frontend**: Add components and pages
4. **Testing**: Update test scenarios

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:

1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ using Go, Next.js, and PostgreSQL**


