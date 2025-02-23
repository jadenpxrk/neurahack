from flask import Flask, jsonify
from flask_cors import CORS
from models import db
import json

app = Flask(__name__)
CORS(app)

# load QnA data
with open("./qna.json") as f:
    qna = json.load(f)

# db config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///quiz.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Create all database tables
with app.app_context():
    db.create_all()

# some method to fetch video/proof of question given the question_id and date


# some method to add question attempts to the db given the question_id, date, and attempt_count


# some method to fetch the quiz results given the question_id and date


# some method to fetch quiz questions and answers
@app.route("/questions", methods=["GET"])
def get_quiz_questions():
    return jsonify(qna["questions"])


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=9000)
