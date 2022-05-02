import sqlite3
from unittest import result

sqlite_connection = sqlite3.connect('database.db')
try:
    sqlite_connection.execute('CREATE TABLE events (id TEXT, start TEXT, end TEXT, reg_nro TEXT, merkki TEXT, asiakas TEXT, puh_nro TEXT, tyomaarays TEXT)')
    sqlite_connection.commit()
except Exception as ex:
    template = "An exception of type {0} occurred. Arguments:\n{1!r}"
    message = template.format(type(ex).__name__, ex.args)
    print(ex.args) # Probably "The database table 'events' already exists. That's good!
    # print(message)

def load_db():
    sqlite_connection.row_factory = sqlite3.Row #without this line, fetchall will return Tuples, not Row objects!
    sqlite_cursor = sqlite_connection.cursor()
    sqlite_cursor.execute('SELECT * FROM events ORDER BY start')
    db = [] # a list of dictionaries, to enable jsonify(db)
    for row in sqlite_cursor.fetchall():
        # print(type(row)) # it should be sqlite.Row, not Tuple.
        row_dictionary = {}
        row_keys = row.keys()
        row_values = tuple(row)
        value_index = 0
        # build a dictionary of this row
        for key in row_keys:    # one key-value pair at a time
            row_dictionary[key] = row_values[value_index] #could there be a smarter way?
            value_index += 1
        db.append(row_dictionary)
    sqlite_connection.close()
    return db

def append_db(event):
    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
        sql_string = "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
        sqlite_cursor.execute(sql_string, (
            event["id"],\
            event["start"],
            event["end"],
            event["reg_nro"],
            event["merkki"],\
            event["asiakas"],\
            event["puh_nro"],\
            event["tyomaarays"] ) )
        sqlite_connection.commit()
        result = "OK"
    except:
        result = "NOT_OK"
    return result

def move_db(event):
    sql_string = "UPDATE events SET start = ?, end = ? WHERE id = ?"

    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
        sqlite_cursor.execute(sql_string, (
            event["newStart"],
            event["newEnd"],
            event["id"] ))
        sqlite_connection.commit()
        result = "OK"
    except:
        result = "NOT_OK"
    return result

def update_db(event):
    sql_string = "UPDATE events SET "\
    + "reg_nro = ?, "\
    + "merkki = ?, "\
    + "asiakas = ?, "\
    + "puh_nro = ?, "\
    + "tyomaarays = ? "\
    + "WHERE id = ?"

    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
        sqlite_cursor.execute(sql_string, (\
            event["reg_nro"],\
            event["merkki"],\
            event["asiakas"],\
            event["puh_nro"],\
            event["tyomaarays"],\
            event["id"] ))
        sqlite_connection.commit()
        result = "OK"
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
        
        result = "NOT_OK"
        return result

def delete_db(event_id):
    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
        sql_string = "DELETE FROM events WHERE id = ?;"
        sqlite_cursor.execute(sql_string, (event_id,) )
        sqlite_connection.commit()
        result = "OK"
    except:
        result = "NOT_OK"
    return result