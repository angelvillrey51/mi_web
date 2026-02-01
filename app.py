
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "¡Hola! Esta es mi primera pagina web 😎"

app.run()
