from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from models import db, QuizAttempt
import json
from google import genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__, instance_path=os.path.join(os.path.dirname(__file__), "db"))
CORS(app)

# Create db directory if it doesn't exist
os.makedirs(app.instance_path, exist_ok=True)

# load QnA data
with open("./qna.json") as f:
    qna = json.load(f)

# db config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///quiz.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# create all database tables
with app.app_context():
    db.create_all()


# some method to fetch video/proof of question given the question_id and date
@app.route("/proof", methods=["GET"])
def get_proof():
    try:
        # get question_id from request
        question_id = request.args.get("question_id")

        if not question_id:
            return jsonify({"error": "Question ID is required"}), 400

        # Find the question in qna.json
        question = next((q for q in qna["questions"] if q["id"] == question_id), None)

        if not question or "proofLocation" not in question:
            return jsonify({"error": "Video not found"}), 404

        # Get the video path from the question
        proof_path = f"./{question['proofLocation']}"

        if not os.path.exists(proof_path):
            return jsonify({"error": "Video file not found"}), 404

        return send_file(proof_path, mimetype="video/mp4")
    except Exception as e:
        print(f"Error fetching video: {str(e)}")
        return jsonify({"error": "Failed to fetch video"}), 500


# some method to add question attempts to the db given the question_id, date, and attempt_count
@app.route("/attempts", methods=["POST"])
def add_question_attempts():
    try:
        data = request.get_json()
        question_id = data.get("question_id")
        date = data.get("date")
        attempt_count = data.get("attempt_count")
        time_taken = data.get("time_taken")
        first_guess_score = data.get("first_guess_score")
        overall_score = data.get("overall_score")

        if not all([question_id, date]):
            return jsonify({"error": "Missing required fields"}), 400

        quiz_attempt = QuizAttempt(
            question_id=question_id,
            day=date,
            attempt_count=attempt_count or 0,
            time_taken=time_taken,
            first_guess_score=first_guess_score,
            overall_score=overall_score,
        )

        db.session.add(quiz_attempt)
        db.session.commit()

        return jsonify({"message": "Quiz attempt added successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# some method to fetch the quiz results given the question_id and date
@app.route("/results", methods=["GET"])
def get_quiz_results():
    try:
        # Create a mapping of question_id to question type
        question_types = {int(q["id"]): q["questionType"] for q in qna["questions"]}

        # Get all attempts grouped by date and ordered by question_id
        results = (
            db.session.query(
                QuizAttempt.day,
                QuizAttempt.question_id,
                db.func.avg(QuizAttempt.first_guess_score).label(
                    "avg_first_guess_score"
                ),
                db.func.avg(QuizAttempt.overall_score).label("avg_overall_score"),
                db.func.avg(QuizAttempt.time_taken).label("avg_time_taken"),
                db.func.avg(QuizAttempt.attempt_count).label("avg_attempts"),
            )
            .group_by(QuizAttempt.day, QuizAttempt.question_id)
            .order_by(QuizAttempt.day, QuizAttempt.question_id)
            .all()
        )

        # Group results by day
        grouped_results = {}
        for result in results:
            if result.day not in grouped_results:
                grouped_results[result.day] = {
                    "mcqScores": [],
                    "mcqFirstGuessScores": [],
                    "shortAnswerScores": [],
                    "timeTaken": [],
                    "attempts": [],
                }

            # Add scores based on actual question type
            if question_types[result.question_id] == "mcq":
                grouped_results[result.day]["mcqScores"].append(
                    result.avg_overall_score or 0
                )
                grouped_results[result.day]["mcqFirstGuessScores"].append(
                    result.avg_first_guess_score or 0
                )
            else:
                grouped_results[result.day]["shortAnswerScores"].append(
                    result.avg_overall_score or 0
                )

            grouped_results[result.day]["timeTaken"].append(result.avg_time_taken or 0)
            grouped_results[result.day]["attempts"].append(result.avg_attempts or 0)

        # Format results
        formatted_results = [
            {
                "timestamp": day,
                "mcqScore": round(
                    sum(data["mcqScores"]) / len(data["mcqScores"])
                    if data["mcqScores"]
                    else 0
                ),
                "mcqFirstGuessScore": round(
                    sum(data["mcqFirstGuessScores"]) / len(data["mcqFirstGuessScores"])
                    if data["mcqFirstGuessScores"]
                    else 0
                ),
                "shortAnswerScore": round(
                    sum(data["shortAnswerScores"]) / len(data["shortAnswerScores"])
                    if data["shortAnswerScores"]
                    else 0
                ),
                "avgTimeTaken": round(
                    sum(data["timeTaken"]) / len(data["timeTaken"])
                    if data["timeTaken"]
                    else 0
                ),
                "avgAttempts": round(
                    sum(data["attempts"]) / len(data["attempts"])
                    if data["attempts"]
                    else 0
                ),
            }
            for day, data in sorted(grouped_results.items())
        ]

        return jsonify(formatted_results)
    except Exception as e:
        print(f"Error in get_quiz_results: {str(e)}")  # Add logging
        return jsonify({"error": str(e)}), 500


# some method to calculate accuracy of short answer by user
@app.route("/accuracy", methods=["GET"])
def get_accuracy():
    try:
        user_answer = request.args.get("user_answer")
        correct_answer = request.args.get("correct_answer")

        if not user_answer or not correct_answer:
            return jsonify({"error": "Missing required parameters"}), 400

        prompt = f"""
        Task: Compare a user's answer to the correct answer and determine its accuracy on a scale of 0-100.
        Questions will test the user's recall of the memory, not how similar the sentence itself is.

        Correct Answer: {correct_answer}
        User's Answer: {user_answer}
        
        Please analyze how well the user's answer matches the correct answer in terms of:
        1. Key concepts covered
        2. Accuracy of information
        3. Completeness
        
        Return only a number between 0 and 100 representing the accuracy percentage.
        """

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )

        if not response or not response.text:
            return jsonify({"error": "Failed to generate accuracy score"}), 500

        accuracy = float(response.text.strip())
        return jsonify(
            {"score": accuracy}
        )  # Changed from accuracy to score to match frontend
    except ValueError as e:
        print(f"Error parsing accuracy value: {e}")
        return jsonify({"error": "Failed to parse accuracy score"}), 500
    except Exception as e:
        print(f"Unexpected error in accuracy endpoint: {e}")
        return jsonify({"error": str(e)}), 500


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
