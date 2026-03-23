import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor

print("\n===== Training AI Study Model =====\n")

# detect dataset path safely
current_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(current_dir, "..", "data", "study_data_full.csv")

data = pd.read_csv(data_path)

print("Dataset loaded successfully\n")
print(data.head())

# FEATURES (sleep_hours removed)
X = data[
    [
        "study_hours",
        "focus_level",
        "breaks_taken",
        "difficulty_level",
        "previous_score"
    ]
]

# TARGETS
y = data[
    [
        "recommended_hours",
        "predicted_performance"
    ]
]

print("\nTraining features:")
print(X.head())

print("\nTargets:")
print(y.head())

# split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Random Forest model
base_model = RandomForestRegressor(n_estimators=150)

model = MultiOutputRegressor(base_model)

print("\nTraining model...")

model.fit(X_train, y_train)

print("Training complete!")

score = model.score(X_test, y_test)

print("\nModel score:", score)

# save model
save_dir = os.path.join(current_dir, "..", "saved_model")
os.makedirs(save_dir, exist_ok=True)

model_path = os.path.join(save_dir, "study_model.pkl")

joblib.dump(model, model_path)

print("\nModel saved at:", model_path)

print("\n===== Training Finished =====")