from flask import Flask, render_template, jsonify, request, url_for,redirect
from edit_db import load_db, save_db, delete

app = Flask(__name__)

db = load_db()

@app.route("/")
def welcome():
    return render_template("new_index.html")

# funktio lähettää sivulle dataa db.jason tietostosta
@app.route("/eventlist")
def eventlist():
    return jsonify(db)

# Tallentaa db.json tietostoon
@app.route("/add_event", methods=["POST"])
def add_event():
    if request.method == "POST":
        event = request.get_json()
        db.append(event)
        save_db(db)
        return event

# Poistaa tapahtuman db.json-sta. Key = id
@app.route("/delete_event", methods=["POST"])
def delete_event():
    global db
    if request.method == "POST":
        event = request.get_json()
        id = event["id"]
        result = delete(db, id)
        #db = load_db()
        return result

@app.route("/move_event", methods=["POST"])
def move_event():
    result = "NOT_OK"
    if request.method == "POST":
        event = request.get_json()
        id = event["id"]
        for i in range(len(db)):
            if db[i]["id"]==str(id):
                db[i]["start"] = event["newStart"]
                db[i]["end"] = event["newEnd"]
                result = save_db(db)
                result = "OK"
                break
    return result

@app.route("/update_event", methods=["POST"])
def update_event():
    result = "NOT_OK"
    #result1 = {}
    if request.method == "POST":
        event = request.get_json()
        for i in range(len(db)):
            if event["id"] == db[i]["id"]:
                db[i]["reg_nro"] = event["reg_nro"]
                db[i]["merkki"] = event["merkki"]
                db[i]["asiakas"] = event["asiakas"]
                db[i]["puh_nro"] = event["puh_nro"]
                db[i]["tyomaarays"] = event["tyomaarays"]
                result = "OK"
                save_db(db)
                return event
