"""
STAI AI Microservice — Flask wrapper around the study prediction model.
Runs on port 5001. Called internally by the Node.js backend.
"""

from flask import Flask, request, jsonify
import sys, os

# Make ai_engine importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ai_engine"))

from model_predictor import predict_student
from timetable_generator import generate_timetable

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON body:
    {
        "study_hours": 6,
        "focus_level": 7,          -- 1–10 (derived from time on site / total online hours * 10)
        "breaks": 2,               -- number of break periods detected
        "difficulty_level": 3.5,   -- 5 - (accuracy * 4), range 1–5
        "previous_score": 65,      -- last quiz score (0–100), or current if first time
        "subjects": [
            {"name": "Math", "correct_questions": 3, "total_questions": 10},
            ...
        ]
    }

    Returns:
    {
        "recommended_hours": 7.07,
        "predicted_performance": 87.28,
        "timetable": { "Math": 4.36, "Physics": 1.64 }
    }
    """
    body = request.get_json(force=True)

    study_hours      = float(body.get("study_hours", 3))
    focus_level      = float(body.get("focus_level", 5))
    breaks           = float(body.get("breaks", 1))
    difficulty_level = float(body.get("difficulty_level", 3))
    previous_score   = float(body.get("previous_score", 50))
    subjects         = body.get("subjects", [])
    total_hours      = study_hours  # used for timetable allocation

    prediction = predict_student(study_hours, focus_level, breaks, difficulty_level, previous_score)
    timetable  = generate_timetable(subjects, total_hours) if subjects else {}

    return jsonify({
        "recommended_hours":    prediction["recommended_hours"],
        "predicted_performance": prediction["predicted_performance"],
        "timetable": timetable
    })


@app.route("/retrain", methods=["POST"])
def retrain():
    """
    Append new student data row and retrain the model.
    Body: same as /predict plus optional actual outcome fields.
    Used when a user's real data accumulates enough to improve the model.
    """
    import pandas as pd
    import joblib
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.multioutput import MultiOutputRegressor

    body = request.get_json(force=True)
    data_path  = os.path.join(os.path.dirname(__file__), "data", "study_data_full.csv")
    model_path = os.path.join(os.path.dirname(__file__), "saved_model", "study_model.pkl")

    try:
        df = pd.read_csv(data_path)

        # Build new row if actual outputs are provided
        if "recommended_hours" in body and "predicted_performance" in body:
            next_id = f"STU{len(df)+1:03d}"
            new_row = {
                "student_id": next_id,
                "study_hours": body.get("study_hours", 3),
                "focus_level": body.get("focus_level", 5),
                "breaks_taken": body.get("breaks", 1),
                "difficulty_level": body.get("difficulty_level", 3),
                "previous_score": body.get("previous_score", 50),
                "recommended_hours": body["recommended_hours"],
                "predicted_performance": body["predicted_performance"],
            }
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            df.to_csv(data_path, index=False)

        X = df[["study_hours","focus_level","breaks_taken","difficulty_level","previous_score"]]
        y = df[["recommended_hours","predicted_performance"]]

        model = MultiOutputRegressor(RandomForestRegressor(n_estimators=150))
        model.fit(X, y)
        joblib.dump(model, model_path)

        # Hot-reload
        import importlib, model_predictor as mp
        mp.model = joblib.load(model_path)

        return jsonify({"success": True, "rows": len(df)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"\n🤖 STAI AI Service running on http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
