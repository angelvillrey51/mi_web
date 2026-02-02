from flask import Flask, request, jsonify, render_template
import requests, os

app = Flask(__name__)

ESP32_URL = "http://192.168.1.11/abrir"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/abrir", methods=["POST"])
def abrir_puerta():
    try:
        requests.post(ESP32_URL, timeout=2)
        return jsonify({"status": "ok"}), 200
    except:
        return jsonify({"error": "ESP32 no responde"}), 500

@app.route("/datos", methods=["POST"])
def datos():
    data = request.get_json()
    print("Datos recibidos:", data)
    return jsonify({"status": "recibido"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
