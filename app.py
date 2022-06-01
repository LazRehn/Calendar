from flask import Flask, render_template, jsonify, request, url_for,redirect, session
#from  edit_db import load_db, append_db, move_db, update_db, delete_db
from SQL_calls import load_db, append_db, move_db, update_db, delete_db,  get_services, add_services
from functools import wraps


app = Flask(__name__)
# if __name__ == "__main__":
#     app.run(use_reloader=False)

app.secret_key = 'mykey'

def access_required(f):
    @wraps(f)
    def access(*args, **kwargs):
        if 'accessed' in session:
            return f(*args, **kwargs)
        else:
            return redirect(url_for('login'))
    return access
       

# Main calendar page
@app.route("/")
@access_required
def main_page():
    return render_template("new_index.html")

# This page is shown in the beginnig
# Also logging out reloads the login page

@app.route("/login", methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != 'admin' or request.form['password'] != 'admin':
            error = 'Kirjautuminen ei onnistunut!'
        else:
            session['accessed'] = True
            return redirect(url_for('main_page'))
    return render_template('login_page.html', error= error)

@app.route('/logout')
def logout():
    session.pop('accessed', None)
    return redirect('/')


global db

# funktio lähettää sivulle koko varauslistan json-muodossa
@app.route("/eventlist") # GET by default
def eventlist():  # uses date limits
    global db
    if request.method != "GET":
        print("Expected GET method in function eventlist!")

    start=request.values.get('start')
    end = request.values.get('end')
    db = load_db(start, end)
    print("Loaded db with ", len(db), " elements.")
    events_list = jsonify(db)
    return events_list

    data = request.get_json() # ei toimi tässä


# lähettää tietyn varauksen tehtävät ja hinnat json-muodossa
@app.route("/get_invoice", methods=["POST"])
def get_invoice():
    result = "NOT_OK"
    if request.method == "POST":
        id_dictionary = request.get_json()
        id = id_dictionary["id"]
        result = get_services(id)

    service_lines = jsonify(result)
    return service_lines

# Tallentaa tietyn varauksen tehtävät ja hinnat
@app.route("/add_invoice", methods=["POST"])
def add_invoice():
    if request.method == "POST":
        services = request.get_json()
        add_services(services) # also sets the invoice fiels to 1 in the events database table

        id = services["id"]
        for i in range(len(db)):
            if db[i]["id"]==str(id):
                db[i]["invoice"] = 1
                break

        return services

# Tallentaa db.json tietostoon
@app.route("/add_event", methods=["POST"])
def add_event():
    global db
    if request.method == "POST":
        event = request.get_json()
        db.append(event)
        append_db(event)
        return event

@app.route("/move_event", methods=["POST"])
def move_event():
    global db
    result = "NOT_OK"
    if request.method == "POST":
        event = request.get_json()
#        print(event)
        id = event["id"]
        for i in range(len(db)):
            if db[i]["id"]==str(id):
                db[i]["start"] = event["newStart"]
                db[i]["end"] = event["newEnd"]
                result = move_db(event)
                break

      # just to test if get_services works
#        services_test = get_services(id)
#        print(services_test)
#        service_lines_test = jsonify(result)
#        print(service_lines_test)
    return result

@app.route("/update_event", methods=["POST"])
def update_event():
    global db
    result = "NOT_OK"
    if request.method == "POST":
        event = request.get_json()
        for i in range(len(db)):
            if event["id"] == db[i]["id"]:
                db[i]["reg_nro"] = event["reg_nro"]
                db[i]["merkki"] = event["merkki"]
                db[i]["asiakas"] = event["asiakas"]
                db[i]["puh_nro"] = event["puh_nro"]
                db[i]["tyomaarays"] = event["tyomaarays"]
                result = update_db(event)
                break
    if result == "OK":
        return event
    else:
        return {}

# Poistaa tapahtuman db.json:sta. Key = id
@app.route("/delete_event", methods=["POST"])
def delete_event():
    global db
    result = "NOT_OK"
    if request.method == "POST":
        event = request.get_json()
        event_id = event["id"]
        for i in range(len(db)):
            if db[i]["id"]==event_id:
                del db[i]
                result = delete_db(event_id) # also deletes the service lines for the event
                break
    return result


@app.route("/add_invoice_testing_only", methods=["POST"])
def add_invoice_testing():
    if request.method == "POST":
        event = request.get_json()
        print(event)
        print(type(event))
        return event