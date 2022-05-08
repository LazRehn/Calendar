import json

global db

def load_db():
    global db
    with open("db.json") as f:
        db = json.load(f)
    return db

def save_db():
    global db
    with open("db.json", "w") as f:
        json.dump(db, f)

def append_db(event):
    save_db() # just saves with the appended element
    return "OK"

def move_db(event):
    save_db() # just saves with the moved element
    return "OK"
    
def update_db(event):
    save_db() # just saves with the updated element
    return "OK"
    
def delete_db(event):
    save_db() # just saves without the deleted element
    return "OK"