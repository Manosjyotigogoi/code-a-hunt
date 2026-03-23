from model_predictor import predict_student
from timetable_generator import generate_timetable
import json


def run_ai_engine(user_data):

    # ML prediction
    prediction = predict_student(
        user_data["study_hours"],
        user_data["focus_level"],
        user_data["breaks"],
        user_data["difficulty_level"],
        user_data["previous_score"]
    )

    # timetable generation
    timetable = generate_timetable(
        user_data["subjects"],
        user_data["study_hours"]
    )

    return {
        "prediction": prediction,
        "timetable": timetable
    }


if __name__ == "__main__":

    # sample test data
    user_data = {
        "study_hours": 6,
        "focus_level": 7,
        "breaks": 2,
        "difficulty_level": 4,
        "previous_score": 65,

        "subjects": [
        {"name": "Math", "correct_questions": 2, "total_questions": 10},
        {"name": "Physics", "correct_questions": 7, "total_questions": 10},
        {"name": "Chemistry", "correct_questions": 9, "total_questions": 10}
        ]}
    result = run_ai_engine(user_data)

    print("\nAI OUTPUT\n")
    print(json.dumps(result, indent=2))