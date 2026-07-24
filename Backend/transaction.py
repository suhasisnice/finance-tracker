"""Transaction module: responsible for persisting a single transaction."""

from fastapi import HTTPException

from database import get_connection, get_user_id


class Transaction:
    def __init__(self, username, amount, t_type, category, t_date, description=None, source="live"):
        self.username = username
        self.amount = amount
        self.t_type = t_type
        self.category = category
        self.t_date = t_date
        self.description = description
        self.source = source

    def save_to_db(self):
        con = get_connection()
        cur = con.cursor()

        user_id = get_user_id(cur, self.username)
        if user_id is None:
            con.close()
            raise HTTPException(
                status_code=404,
                detail="Username does not exist. Create the user first.",
            )

        cur.execute(
            """
            INSERT INTO transactions (user_id, amount, t_type, category, t_date, description, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, self.amount, self.t_type, self.category, str(self.t_date),
             self.description, self.source),
        )
        t_id = cur.lastrowid
        con.commit()
        con.close()

        return {
            "t_id": t_id,
            "username": self.username,
            "amount": self.amount,
            "t_type": self.t_type,
            "category": self.category,
            "t_date": str(self.t_date),
            "description": self.description,
            "source": self.source,
        }
