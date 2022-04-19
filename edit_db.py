import json

def load_db():
    with open("db.json") as f:
        return json.load(f)

def save_db(db):
    with open("db.json", "w") as f:
        return json.dump(db, f)

def delete(db, id):
    result = "NOT_OK"
    with open("db.json", "w") as f:
        data = db
        for i in range(len(data)):
            if data[i]["id"]==str(id):
                del data[i]
                save_db(data)
                result = "OK"
                break
    return result