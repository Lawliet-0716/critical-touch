from flask import Flask, request, jsonify
from flask_cors import CORS
from langdetect import detect
import os

# ML
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

app = Flask(__name__)
CORS(app)

# =========================
# DATASET (ENGLISH + KANNADA + HINDI)
# =========================
training_data = [

    # ENGLISH
    ("mild fever", 1),
    ("cold and cough", 1),
    ("headache", 1),
    ("slight body pain", 1),
    ("minor cut", 1),
    ("low fever", 2),

    ("high fever for two days", 3),
    ("vomiting and stomach pain", 3),
    ("dizziness and weakness", 3),
    ("fever not reducing", 3),

    ("chest pain", 4),
    ("difficulty breathing", 4),
    ("fracture in leg", 4),
    ("severe abdominal pain", 4),

    ("heart attack symptoms", 5),
    ("not breathing properly", 5),
    ("major accident with bleeding", 5),
    ("unconscious patient", 5),

    # KANNADA
    ("ನನಗೆ ಜ್ವರ ಇದೆ", 2),
    ("ತಲೆನೋವು ಇದೆ", 1),
    ("ಸಣ್ಣ ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮು", 1),
    ("ದೇಹ ನೋವು ಇದೆ", 1),
    ("ಸ್ವಲ್ಪ ದಣಿವು ಇದೆ", 1),

    ("ಹೆಚ್ಚು ಜ್ವರ ಬಂದಿದೆ", 3),
    ("ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ವಾಂತಿ", 3),
    ("ತಲೆ ಸುತ್ತು ಮತ್ತು ದುರ್ಬಲತೆ", 3),
    ("ಜ್ವರ ಕಡಿಮೆಯಾಗುತ್ತಿಲ್ಲ", 3),

    ("ಛಾತಿಯಲ್ಲಿ ನೋವು ಇದೆ", 4),
    ("ಉಸಿರಾಟಕ್ಕೆ ತೊಂದರೆ ಇದೆ", 4),
    ("ಗಂಭೀರ ಹೊಟ್ಟೆ ನೋವು", 4),

    ("ಹೃದಯಾಘಾತದ ಲಕ್ಷಣಗಳು", 5),
    ("ಉಸಿರಾಟ ನಿಲ್ಲುತ್ತಿದೆ", 5),
    ("ಅಪಘಾತವಾಗಿದೆ ಮತ್ತು ರಕ್ತಸ್ರಾವವಾಗಿದೆ", 5),
    ("ಅವಚೇತನ ಸ್ಥಿತಿ", 5),

    # HINDI
    ("मुझे हल्का बुखार है", 2),
    ("सिर दर्द है", 1),
    ("सर्दी और खांसी है", 1),
    ("थोड़ी कमजोरी है", 1),
    ("हल्का दर्द है", 1),

    ("तेज बुखार है", 3),
    ("उल्टी और पेट दर्द है", 3),
    ("चक्कर और कमजोरी है", 3),
    ("बुखार कम नहीं हो रहा", 3),

    ("छाती में दर्द है", 4),
    ("सांस लेने में तकलीफ", 4),
    ("तेज पेट दर्द", 4),
    ("हड्डी टूट गई है", 4),

    ("हार्ट अटैक के लक्षण", 5),
    ("सांस नहीं ले पा रहा", 5),
    ("एक्सीडेंट हुआ है और खून बह रहा है", 5),
    ("बेहोश हो गया है", 5),
]

texts = [x[0] for x in training_data]
labels = [x[1] for x in training_data]

# =========================
# TRAIN MODEL
# =========================
vectorizer = CountVectorizer(ngram_range=(1, 2))
X = vectorizer.fit_transform(texts)

model = LogisticRegression(max_iter=200)
model.fit(X, labels)

# =========================
# LANGUAGE DETECTION
# =========================
def detect_language(text):
    try:
        if len(text) < 5:
            return "en"

        lang = detect(text)

        if lang.startswith("hi"):
            return "hi"
        elif lang.startswith("kn"):
            return "kn"
        return "en"
    except:
        return "en"

# =========================
# REMEDIES
# =========================
def get_remedy(severity, lang):
    remedies = {
        "en": {
            1: "Rest and drink fluids.",
            2: "Take basic medication and rest.",
            3: "Consult a doctor soon.",
            4: "Visit hospital immediately.",
            5: "Call ambulance immediately!"
        },
        "kn": {
            1: "ವಿಶ್ರಾಂತಿ ಮಾಡಿ ಮತ್ತು ನೀರು ಕುಡಿಯಿರಿ.",
            2: "ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಮಾಡಿ.",
            3: "ಡಾಕ್ಟರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            4: "ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ.",
            5: "ತಕ್ಷಣ ಆಂಬುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ!"
        },
        "hi": {
            1: "आराम करें और पानी पिएं।",
            2: "दवा लें और आराम करें।",
            3: "डॉक्टर से सलाह लें।",
            4: "तुरंत अस्पताल जाएं।",
            5: "एम्बुलेंस तुरंत बुलाएं!"
        }
    }
    return remedies.get(lang, remedies["en"]).get(severity, "Take care")

# =========================
# RULE-BASED SAFETY
# =========================
def rule_boost(text):
    text = text.lower()

    if any(k in text for k in ["heart attack", "not breathing", "stroke", "unconscious"]):
        return 5
    if any(k in text for k in ["accident", "bleeding"]):
        return 5
    if any(k in text for k in ["chest pain", "breathing problem"]):
        return 4

    if ("ಉಸಿರಾಟ" in text and "ನಿಲ್ಲ" in text):
        return 5
    if any(k in text for k in ["ಹೃದಯಾಘಾತ", "ಸ್ಟ್ರೋಕ್", "ಅವಚೇತನ"]):
        return 5
    if any(k in text for k in ["ಅಪಘಾತ", "ರಕ್ತಸ್ರಾವ"]):
        return 5
    if ("ಛಾತಿ" in text and "ನೋವು" in text):
        return 4
    if ("ಉಸಿರಾಟ" in text and "ತೊಂದರೆ" in text):
        return 4

    if ("सांस" in text and ("नहीं" in text or "रुक" in text)):
        return 5
    if any(k in text for k in ["हार्ट अटैक", "बेहोश", "स्ट्रोक"]):
        return 5
    if any(k in text for k in ["एक्सीडेंट", "खून"]):
        return 5
    if ("छाती" in text and "दर्द" in text):
        return 4
    if ("सांस" in text and "तकलीफ" in text):
        return 4

    return None

# =========================
# CLASSIFICATION
# =========================
def classify_text(text):
    X_input = vectorizer.transform([text])
    prediction = model.predict(X_input)[0]
    confidence = max(model.predict_proba(X_input)[0])

    rule = rule_boost(text)
    if rule:
        prediction = rule

    if prediction <= 2:
        action = "Self Care"
    elif prediction == 3:
        action = "Consult Doctor"
    else:
        action = "Auto Ambulance Dispatch"

    lang = detect_language(text)
    remedies = get_remedy(prediction, lang)

    return prediction, confidence, action, remedies

# =========================
# ROUTES
# =========================
@app.route("/")
def home():
    return "ML API Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        text = data.get("text")

        if not text:
            return jsonify({"error": "Text is required"}), 400

        severity, confidence, action, remedies = classify_text(text)

        return jsonify({
            "input_text": text,
            "confidence": round(float(confidence), 3),
            "recommended_action": action,
            "remedies": remedies,
            "sos_trigger": True if severity == 5 else False
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# RUN (RENDER FIX)
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)