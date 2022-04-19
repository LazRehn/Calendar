import json

def load_db():
    with open("db.json") as f:
        return json.load(f)

def save_db(db):
    with open("db.json", "w") as f:
        return json.dump(db, f)

def delete(db, id):
    result = "NOT_OK"
    for i in range(len(db)):
        if db[i]["id"]==str(id):
            del db[i]
            save_db(db)
            result = "OK"
            break
    return result