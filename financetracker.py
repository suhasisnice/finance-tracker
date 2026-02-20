from datetime import date,datetime
from fastapi import FastAPI

from typing import Dict,List,Literal
from pydantic import BaseModel,Field
from fastapi import HTTPException

from dateutil.relativedelta import relativedelta

import sqlite3

class Transaction():

    def __init__(self,username,amount,t_type,category,t_date):
        self.username = username
        self.amount = amount
        self.t_type = t_type
        self.category = category
        self.t_date = t_date
        
       
    def save_to_db(self):
        con = sqlite3.connect("finance.db")
        con.execute("PRAGMA foreign_keys = ON;")
        cur = con.cursor()
        cur.execute(
            "SELECT id FROM users WHERE username = ?",
            (self.username,)
                    )
        row = cur.fetchone()

        if row is None:
            con.close()
            raise HTTPException(status_code=404, detail="Username does not exist,create user if it does not exist.")
        
        cur.execute("""INSERT INTO transactions(user_id,amount,t_type,category,t_date)
                        values(?,?,?,?,?)""",(row[0],self.amount,self.t_type,self.category,str(self.t_date)))
        
        con.commit()
        con.close()
   
class FinanceManager():
    def __init__(self):
        pass
       
    def calculate_balance(self,username):
        username = username
        con = sqlite3.connect("finance.db")
        cur = con.cursor()
        cur.execute("SELECT id FROM users WHERE username=?",
                    (username,))
        row = cur.fetchone()
        if row is None:
            return {"message": "No user found"}

        user_id = row[0]
        cur.execute(
        "SELECT SUM(amount) FROM transactions WHERE t_type = ? AND user_id = ?",
         ("income", user_id)
        )
        row = cur.fetchone()
        income = row[0]
        cur.execute(
        "SELECT SUM(amount) FROM transactions WHERE t_type = ? AND user_id = ?",
         ("expense", user_id))
        row = cur.fetchone() 
        expense = row[0]
        if income == None:
            income =0
        if expense == None:
            expense=0
        balance = income - expense
        con.close()
        return balance
    
    def monthly_report(self,username_,month_,year_):
        username = username_
        month = month_
        year = year_
        start = datetime(year, month, 1)
        end = start + relativedelta(months=1)
        start_str = start.strftime("%Y-%m-%d")
        end_str = end.strftime("%Y-%m-%d")
        con = sqlite3.connect("finance.db")
        cur = con.cursor()
        cur.execute("PRAGMA foreign_keys = ON")
        cur.execute("SELECT id FROM users WHERE username = ?"
                    ,(username,))
        row = cur.fetchone()
        if row is None:
            return {"message": "No user found"}

        user_id = row[0]
        cur.execute("""SELECT * FROM transactions 
                    WHERE user_id = ?
                    AND t_date >= ?
                    AND t_date < ?
                    """,(user_id,start_str,end_str))
        row = cur.fetchall()
        con.close()
        return row 
    
    def transaction_history(self,username_):
        username = username_
        con = sqlite3.connect("finance.db")
        cur = con.cursor()
        cur.execute("PRAGMA foreign_keys = ON;")
        try:
            cur.execute("""SELECT id FROM users WHERE username = ?"""
                        ,(username,))
            row = cur.fetchone()
            if row is None:
                return {"message": "No user found"}

            user_id = row[0]
            cur.execute("SELECT * FROM transactions where user_id = ?"
                        ,(user_id,))
            row = cur.fetchall()
            if row == None:
                return {"message":"NO transactions present"}   
            return row
        finally:
            con.close()
    
class TransactionsIn(BaseModel):
    username: str
    amount: float = Field(gt=0)
    t_type: Literal["income", "expense"]
    category: str
    t_date: date

class UsersIN(BaseModel):
    username : str
    password : str
    created_at : date

fm = FinanceManager()

app = FastAPI()

@app.get("/")
def ping():
    return {"Message":"pong"}

@app.get("/balance")
def fetch_balance(username : str):
    return {"Balance":fm.calculate_balance(username)}

@app.get("/monthly-report")
def fetch_monthly_report(username:str,month : int, year : int):
    return fm.monthly_report(username,month,year)

@app.get("/transaction-history")
def fetch_history(username : str):
    return fm.transaction_history(username)

@app.post("/addTransaction")
def add_transaction(tx : TransactionsIn):
    t = Transaction(tx.username,    tx.amount,tx.t_type,tx.category,tx.t_date)
    t.save_to_db()
    return {
        "amount"   : t.amount,
        "type   "    :t.t_type,
        "category" : t.category,
        "date"     : t.t_date,
    }

@app.post("/add-user")
def add_user(Ux : UsersIN):
    con = sqlite3.connect("finance.db")
    cur = con.cursor()
    cur.execute("PRAGMA foreign_keys = ON;")
    try: 
        cur.execute("""INSERT INTO users(username,password,created_at)
                        values(?,?,?)""",(Ux.username,Ux.password,Ux.created_at))
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(
            status_code=400,
            detail="Username is already taken. Choose another username."
        )
    con.commit()
    con.close()



con = sqlite3.connect("finance.db")
con.execute("PRAGMA foreign_keys = ON;")
cur = con.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
        );""")  

cur.execute("""
CREATE TABLE IF NOT EXISTS transactions(
  t_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  t_type TEXT NOT NULL,
  category TEXT NOT NULL,
  t_date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
""")
con.commit()
con.close()   
