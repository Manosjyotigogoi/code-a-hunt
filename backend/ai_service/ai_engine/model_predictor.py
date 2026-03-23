import joblib
import os
import pandas as pd

# detect model path safely
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "..", "saved_model", "study_model.pkl")
model_path = os.path.abspath(model_path)

print("Loading model from:", model_path)

model = joblib.load(model_path)

# feature names must match training
feature_names = [
    "study_hours",
    "focus_level",
    "breaks_taken",
    "difficulty_level",
    "previous_score"
]


def predict_student(
        study_hours,
        focus_level,
        breaks_taken,
        difficulty_level,
        previous_score):

    input_data = pd.DataFrame([[
        study_hours,
        focus_level,
        breaks_taken,
        difficulty_level,
        previous_score
    ]], columns=feature_names)

    prediction = model.predict(input_data)

    recommended_hours = float(prediction[0][0])
    predicted_performance = float(prediction[0][1])

    return {
        "recommended_hours": round(recommended_hours, 2),
        "predicted_performance": round(predicted_performance, 2)
    }