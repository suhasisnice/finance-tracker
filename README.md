Finance Tracker - Backend

Description:
-------------
Finance Tracker is a personal finance management backend built from scratch using Python and SQLite.
It allows users to create accounts, add income and expenses, view balances, and generate monthly reports.
This project was my first solo backend project with no tutorials or predefined structure.

Features:
----------
- Add and manage users
- Add transactions (income and expense)
- Calculate user balance
- Generate monthly reports
- Fetch full transaction history
- Basic input validation and error handling
- Relational database design with foreign key constraints

Tech Stack:
------------
- Python 3.11
- FastAPI for backend API
- Pydantic for data validation
- SQLite for database storage
- dateutil for handling dates and month boundaries

Project Structure:
-------------------
finance-tracker/
├─ main.py             # FastAPI app, routes, and transaction logic
├─ models.py (optional) # Pydantic models (TransactionsIn, UsersIN)
├─ finance_manager.py   # FinanceManager class handling calculations and reports
├─ transaction.py       # Transaction class handling database inserts
├─ requirements.txt     # Python dependencies
└─ README.txt           # Project description

Database Schema:
-----------------
Users Table:
- id INTEGER PRIMARY KEY AUTOINCREMENT
- username TEXT UNIQUE NOT NULL
- password TEXT NOT NULL
- created_at TEXT NOT NULL

Transactions Table:
- t_id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL (foreign key -> users.id)
- amount REAL NOT NULL
- t_type TEXT NOT NULL ("income" or "expense")
- category TEXT NOT NULL
- t_date TEXT NOT NULL

API Endpoints:
---------------
- GET /                  → Ping endpoint
- GET /balance           → Fetch balance for a username
- GET /monthly-report    → Fetch transactions for a specific month/year
- GET /transaction-history → Fetch all transactions for a user
- POST /addTransaction   → Add a transaction (income/expense)
- POST /add-user         → Create a new user

Usage:
-------
1. Clone the repository
   git clone https://github.com/yourusername/finance-tracker.git
   cd finance-tracker

2. Create a virtual environment and install dependencies
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt

3. Run the server
   uvicorn main:app --reload

4. Access API docs at http://127.0.0.1:8000/docs

Motivation:
------------
This project was my first solo backend project. I faced challenges like:
- Designing the database schema from scratch
- Structuring the application without tutorials
- Handling user validation and authentication logic
- Writing secure database queries

Next Steps:
------------
- Build a frontend for visualizing spending trends
- Highlight excessive spending patterns
- Integrate UPI SMS data for automatic transaction logging
- Add authentication and password hashing for security
- Deploy the project to a cloud platform (Heroku/AWS)
