import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split

# ================= LOAD DATA =================
try:
    data = pd.read_csv("data.csv")
except:
    print("❌ ERROR: data.csv not found in this folder")
    exit()

# ================= CHECK DATA =================
print("📊 Dataset preview:")
print(data.head())

# ================= FEATURES + LABEL =================
X = data[["S1", "S2", "S3", "S4", "S5", "S6"]]
y = data["label"]

# ================= SPLIT =================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ================= TRAIN MODEL =================
model = DecisionTreeClassifier(max_depth=4)
model.fit(X_train, y_train)

# ================= ACCURACY =================
accuracy = model.score(X_test, y_test)
print("\n✅ Model Accuracy:", round(accuracy * 100, 2), "%")

# ================= SHOW RULES =================
print("\n🌳 Decision Tree Rules:\n")
rules = export_text(model, feature_names=list(X.columns))
print(rules)

# ================= TEST SAMPLE (OPTIONAL) =================
sample = X_test.iloc[0].values.reshape(1, -1)
prediction = model.predict(sample)

print("\n🔍 Example Prediction:")
print("Input:", X_test.iloc[0].to_dict())
print("Predicted:", prediction[0])
print("Actual:", y_test.iloc[0])