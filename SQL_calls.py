import sqlite3
from unittest import result

# Builds the list of events "db" from the database
def load_db():
    sqlite_connection = sqlite3.connect('database.db')
    try:
        sqlite_connection.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY ON CONFLICT FAIL, start TEXT, end TEXT, reg_nro TEXT, merkki TEXT, asiakas TEXT, puh_nro TEXT, tyomaarays TEXT, invoice INT NOT NULL CHECK (invoice IN (0, 1)));')
#        sqlite_connection.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY ON CONFLICT FAIL, start TEXT, end TEXT, reg_nro TEXT, merkki TEXT, asiakas TEXT, puh_nro TEXT, tyomaarays TEXT, invoice INT NOT NULL CHECK (invoice IN (0, 1)), FOREIGN KEY (id) REFERENCES services (varaus_id) ON DELETE CASCADE);')
#   could also be sqlite_connection.execute('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY ASC, start TEXT, end TEXT, reg_nro TEXT, merkki TEXT, asiakas TEXT, puh_nro TEXT, tyomaarays TEXT);')
#        sqlite_connection.execute('CREATE TABLE IF NOT EXISTS services (varaus_id TEXT, rivinumero INTEGER, service TEXT, price TEXT, FOREIGN KEY (varaus_id) REFERENCES events (id) ON DELETE CASCADE);')
        sqlite_connection.execute('CREATE TABLE IF NOT EXISTS services (varaus_id TEXT, rivinumero INTEGER, service TEXT, price TEXT);')
        sqlite_connection.commit()
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
    
    sqlite_connection.row_factory = sqlite3.Row #without this line, fetchall will return Tuples, not Row objects!
    sqlite_cursor = sqlite_connection.cursor()
    sqlite_cursor.execute('SELECT * FROM events ORDER BY start')
    db = [] # a list of dictionaries, to enable jsonify(db)
    for row in sqlite_cursor.fetchall():
        # print(type(row)) # it should be sqlite.Row (not Tuple).
        row_dictionary = dict(row)

        # a more difficult way...
#        row_dictionary = {}
#        row_keys = row.keys()
#        row_values = tuple(row)
#        value_index = 0
        # build a dictionary of this row
#        for key in row_keys:    # one key-value pair at a time
#            row_dictionary[key] = row_values[value_index] #could there be a smarter way? Yes, just use dict(row)  ;-)
#            value_index += 1
 
        db.append(row_dictionary)
    #sqlite_connection.close()  # not needed?
    return db

def append_db(event):
    print(event)
    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
        sql_string = "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);"
        sqlite_cursor.execute(sql_string, (
            event["id"],\
            event["start"],
            event["end"],
            event["reg_nro"],
            event["merkki"],\
            event["asiakas"],\
            event["puh_nro"],\
            event["tyomaarays"],
            event["invoice"] ) )
        sqlite_connection.commit()
        result = "OK"
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
        result = "NOT_OK"
    return result

def get_services(id):
    sqlite_connection = sqlite3.connect('database.db')
    sqlite_connection.row_factory = sqlite3.Row #without this line, fetchall will return Tuples, not Row objects!
    sqlite_cursor = sqlite_connection.cursor()
    sql_string = "SELECT rivinumero, service, price FROM services WHERE varaus_id = ? ORDER BY rivinumero;"
    sqlite_cursor.execute(sql_string, (id,))

    service_dictionary = {} # includes field names (service or price) and their values
    for row in sqlite_cursor.fetchall():
        wanted_row_dictionary = {}
        # here we don't use dict(row)
        row_keys = row.keys()
        row_values = tuple(row)
        row_number = row_values[0] # its type is class 'int', an integer

        # build a dictionary of this row
        wanted_row_dictionary[ row_keys[1] + str(row_number) ] = row_values[1] # service field
        wanted_row_dictionary[ row_keys[2] + str(row_number) ] = row_values[2] # price field
        service_dictionary.update(wanted_row_dictionary)
    #sqlite_connection.close()  # not needed?
    return service_dictionary

    # previous version returned a list of dictionaries without field names
    service_row_list = [] # a list of dictionaries, to enable jsonify()
    for row in sqlite_cursor.fetchall():
        row_dictionary = {}
        row_keys = row.keys()
        row_values = tuple(row)
        value_index = 0
        # build a dictionary of this row
        for key in row_keys:    # one key-value pair at a time
            row_dictionary[key] = row_values[value_index] #could there be a smarter way? Yes, row_dictionary = dict(row)
            value_index += 1
        service_row_list.append(row_dictionary)
    #sqlite_connection.close()  # not needed?
    return service_row_list

#def add_services(varaus_id, line_list):
def add_services(services):
    try:
        sqlite_connection = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_connection.cursor()
#        line_index = 0
        sql_string = "INSERT INTO services VALUES (?, ?, ?, ?);"
        varaus_id = services["id"]

        for line_index in range( len(services) // 2 ):
#            print(services["service"+str(line_index)], services["price"+str(line_index)] )
            sqlite_cursor.execute(sql_string, (varaus_id, line_index, services["service"+str(line_index)], services["price"+str(line_index)]) )

        sql_string = "UPDATE events SET invoice = ? WHERE id = ?"
        sqlite_cursor.execute(sql_string, ( 1, varaus_id ))

#       Old version
#        for row_dictionary in line_list:
#           line_index += 1
#           sqlite_cursor.execute(sql_string, (varaus_id, line_index, row_dictionary["service"], row_dictionary["price"]) )

        sqlite_connection.commit()
        result = "OK"
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
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
    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
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
        sqlite_cursor.execute(sql_string, (event_id,) ) # extra comma needed to define Tuple with only one element

        sql_string = "DELETE FROM services WHERE varaus_id = ?;"
        sqlite_cursor.execute(sql_string, (event_id,) ) # extra comma needed to define Tuple with only one element

        sqlite_connection.commit()
        result = "OK"

#       Test if CASCADE works. The services should have been deleted for this event
        print("The services for the deleted event:", get_services(event_id))

    except Exception as ex:
        template = "An exception of type {0} occurred. Arguments:\n{1!r}"
        message = template.format(type(ex).__name__, ex.args)
        print(message)
        result = "NOT_OK"
    return result