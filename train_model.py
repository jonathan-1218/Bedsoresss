import argparse
import pickle
import re
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = ["S1", "S2", "S3", "S4", "S5", "S6"]
SENSOR_PATTERN = re.compile(
    r"S:\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)"
)


def parse_raw_sensor_log(file_path: Path) -> pd.DataFrame:
    rows = []
    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line_no, line in enumerate(f, start=1):
            match = SENSOR_PATTERN.search(line)
            if not match:
                continue
            values = [int(v) for v in match.groups()]
            rows.append({**dict(zip(FEATURE_COLUMNS, values)), "source_line": line_no})

    return pd.DataFrame(rows)


def infer_position_label(row: pd.Series, min_active_total: int = 140) -> str:
    # Keep position zones consistent with backend logic.
    left = row["S2"] + row["S5"]
    center = row["S1"] + row["S4"]
    right = row["S3"] + row["S6"]
    top = max(left, center, right)

    if top < min_active_total:
        return "No pressure"
    if left >= center and left >= right:
        return "Left"
    if right >= center and right >= left:
        return "Right"
    return "Center"


def load_dataset(file_path: Path) -> pd.DataFrame:
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    csv_df = None
    try:
        csv_df = pd.read_csv(file_path)
    except Exception:
        csv_df = None

    if csv_df is not None and set(FEATURE_COLUMNS).issubset(csv_df.columns):
        return csv_df

    parsed_df = parse_raw_sensor_log(file_path)
    if parsed_df.empty:
        raise ValueError(
            "No sensor rows found. Expected lines containing format like S:100,200,0,500,0,10"
        )
    return parsed_df


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train position model from either labeled CSV or raw ESP32 log lines."
    )
    parser.add_argument("--data", default="data.csv", help="Input dataset path")
    parser.add_argument("--out", default="position_model.pkl", help="Output model file")
    args = parser.parse_args()

    data_path = Path(args.data)
    output_path = Path(args.out)

    data = load_dataset(data_path)

    for col in FEATURE_COLUMNS:
        data[col] = pd.to_numeric(data[col], errors="coerce").fillna(0).clip(lower=0)

    if "label" not in data.columns:
        data["label"] = data.apply(infer_position_label, axis=1)
        print("ℹ️ No 'label' column found. Generated labels from sensor dominance rule.")

    data = data.dropna(subset=["label"])
    X = data[FEATURE_COLUMNS]
    y = data["label"].astype(str)

    if len(X) < 10:
        raise ValueError("Need at least 10 parsed samples to train a stable model.")

    class_counts = y.value_counts()
    min_count = class_counts.min()
    can_stratify = len(class_counts) > 1 and min_count >= 2

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if can_stratify else None,
    )

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=10,
        random_state=42,
        class_weight="balanced_subsample",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = (y_pred == y_test).mean()

    print("📊 Samples:", len(data))
    print("📚 Label distribution:")
    print(class_counts.to_string())
    print(f"\n✅ Test Accuracy: {accuracy * 100:.2f}%")
    print("\n🧾 Classification report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    model_bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "labels": sorted(y.unique().tolist()),
    }

    with output_path.open("wb") as f:
        pickle.dump(model_bundle, f)

    print(f"💾 Model saved to: {output_path}")


if __name__ == "__main__":
    main()