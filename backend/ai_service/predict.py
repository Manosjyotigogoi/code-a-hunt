"""
Called by Node.js via child_process.execFile.
Reads JSON from stdin, writes JSON result to stdout.
"""
import sys, os, json
from io import StringIO

# Make ai_engine importable
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_engine"))

# Suppress "Loading model from:" print during import
_saved_stdout = sys.stdout
sys.stdout = StringIO()
from model_predictor import predict_student
from timetable_generator import generate_timetable
sys.stdout = _saved_stdout

def main():
    raw = sys.stdin.read().strip()
    body = json.loads(raw)

    study_hours      = float(body.get("study_hours", 3))
    focus_level      = float(body.get("focus_level", 5))
    breaks           = float(body.get("breaks", 1))
    difficulty_level = float(body.get("difficulty_level", 3))
    previous_score   = float(body.get("previous_score", 50))
    subjects         = body.get("subjects", [])

    prediction = predict_student(study_hours, focus_level, breaks, difficulty_level, previous_score)
    timetable  = generate_timetable(subjects, study_hours) if subjects else {}

    result = {
        "recommended_hours": prediction["recommended_hours"],
        "predicted_performance": prediction["predicted_performance"],
        "timetable": timetable
    }
    # Only print the JSON — suppress all other output
    print(json.dumps(result))

if __name__ == "__main__":
    main()
