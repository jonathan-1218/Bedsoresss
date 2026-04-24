import argparse
import json
import pickle
import re
from pathlib import Path

import pandas as pd

FEATURE_COLUMNS = ["S1", "S2", "S3", "S4", "S5", "S6"]
SENSOR_PATTERN = re.compile(
    r"S:\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)"
)


def parse_sensor_values(raw: str) -> list[int]:
    raw = raw.strip()

    match = SENSOR_PATTERN.search(raw)
    if match:
        return [int(v) for v in match.groups()]

    if "," in raw:
        parts = [p.strip() for p in raw.split(",")]
    else:
        parts = [p.strip() for p in raw.split()]

    if len(parts) != 6:
        raise ValueError("Provide exactly 6 sensor values.")

    try:
        return [int(v) for v in parts]
    except ValueError as exc:
        raise ValueError("Sensor values must be integers.") from exc


def load_model_bundle(model_path: Path):
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    with model_path.open("rb") as f:
        bundle = pickle.load(f)

    if isinstance(bundle, dict) and "model" in bundle:
        model = bundle["model"]
        features = bundle.get("feature_columns", FEATURE_COLUMNS)
        labels = bundle.get("labels", [])
        return model, features, labels

    return bundle, FEATURE_COLUMNS, []


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Predict body position from six pressure sensor values."
    )
    parser.add_argument(
        "--model",
        default="position_model.pkl",
        help="Path to trained model pickle file",
    )
    parser.add_argument(
        "--sensors",
        help="Sensor values as 'S:1,2,3,4,5,6' or '1,2,3,4,5,6'",
    )
    parser.add_argument(
        "--json",
        dest="json_payload",
        help='Sensor payload JSON, e.g. {"S1":100,"S2":50,"S3":0,"S4":200,"S5":0,"S6":0}',
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format for prediction result",
    )
    args = parser.parse_args()

    model, feature_columns, known_labels = load_model_bundle(Path(args.model))

    if args.json_payload:
        try:
            payload = json.loads(args.json_payload)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON payload.") from exc

        missing = [c for c in feature_columns if c not in payload]
        if missing:
            raise ValueError(f"Missing keys in JSON payload: {', '.join(missing)}")

        sensor_values = [int(payload[c]) for c in feature_columns]
    elif args.sensors:
        sensor_values = parse_sensor_values(args.sensors)
    else:
        raw = input("Enter sensors (S:1,2,3,4,5,6): ")
        sensor_values = parse_sensor_values(raw)

    sample = pd.DataFrame([sensor_values], columns=feature_columns)
    prediction = model.predict(sample)[0]
    confidence_map = {}
    top_confidence = None

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(sample)[0]
        classes = list(getattr(model, "classes_", known_labels))
        ranked = sorted(zip(classes, proba), key=lambda x: x[1], reverse=True)
        confidence_map = {label: float(score) for label, score in ranked}
        top_confidence = float(ranked[0][1]) if ranked else None

    if args.format == "json":
        print(
            json.dumps(
                {
                    "input": dict(zip(feature_columns, sensor_values)),
                    "prediction": str(prediction),
                    "confidence": confidence_map,
                    "topConfidence": top_confidence,
                }
            )
        )
        return

    print("Input:", dict(zip(feature_columns, sensor_values)))
    print("Predicted position:", prediction)
    if confidence_map:
        print("Confidence:")
        for label, score in confidence_map.items():
            print(f"  {label}: {score * 100:.2f}%")


if __name__ == "__main__":
    main()
