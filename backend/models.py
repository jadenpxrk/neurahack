from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question_id = db.Column(db.Integer, nullable=False)
    day = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    attempt_count = db.Column(db.Integer, default=0)
    time_taken = db.Column(db.Integer)  # in seconds
    first_guess_score = db.Column(db.Integer)
    overall_score = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<QuizAttempt {self.id} for question {self.question_id}>"
