

// Show month calendar for selecting days/weeks
const nav = new DayPilot.Navigator("nav", {
  showMonths: 1,
  skipMonths: 1,
  locale: "fi-fi",
  selectMode: "Week",
  onTimeRangeSelected: args => {
    dp.update({
    startDate: args.day
    });
    dp.loadEvents();
  }
});
nav.init();

// To create week calendar
const dp = new DayPilot.Calendar("dp", {
  viewType: "WorkWeek",
  businessBeginsHour: 8,
  businessEndsHour: 18,
  locale: "fi-fi",
  durationBarVisible : false,
  heightSpec: "BusinessHoursNoScroll",
  headerDateFormat: "dddd dd.MM.yyyy",
  eventDeleteHandling: "Update",

  // Custom reservation box and data
  onBeforeEventRender: args => {
    args.data.html = "<b>Reg nro:</b> "
    +args.data.reg_nro+" <b>Merkki:</b> "
    +args.data.merkki+"<br>"+"<b>Asiakas:</b> "
    +args.data.asiakas+"<br>"+ args.data.puh_nro+"<br>"
    +"<b>Työmääräys / selite:</b> <br>"+args.data.tyomaarays

    if (args.data.invoice === 0) {
      args.data.backColor = "linear-gradient(to left, #F5F763, #E0DD84)";
    } else if (args.data.invoice === 1) {
      args.data.backColor = "linear-gradient(to left, #6CF763, #56D56C)";
    };
  },

  // Confirm reservation delete
  onEventDelete: function(args) {
    if (!confirm("Haluatko varmasti poistaa varauksen?")) {
      args.preventDefault();
    }
  },

  onEventDeleted: async (args) => {
    const data = {
    id: args.e.id()
    };
    await DayPilot.Http.post('/delete_event', data);
  },

  // Confirm reservation move
  onEventMove: function (args) {
    if (!confirm("Haluatko muuttaa varauksen ajankohtaa?")) {
      args.preventDefault();
    }
  },

  onEventMoved: async (args) => {
    const data = {
    id: args.e.id(),
    newStart: args.newStart,
    newEnd: args.newEnd,
    };
    await DayPilot.Http.post(`/move_event`, data);
    console.log("Moved.");
  },

  onEventResized: async (args) => {
    const data = {
    id: args.e.id(),
    newStart: args.newStart,
    newEnd: args.newEnd,
    };
    await DayPilot.Http.post(`/move_event`, data);
    console.log("Resized.");
  },

  // To add reservation

  //  Create modal popup
  onTimeRangeSelected: async (args) => {
    const form = [
      {name: "Reg. nro", id: "reg_nro"},
      {name: "Merkki ja malli", id: "merkki"},
      {name: "Asiakas", id: "asiakas"},
      {name: "Puh. nro", id: "puh_nro"},
      {name: "Työmääräys / selite", id: "tyomaarays"}
    ];

    const modal = await DayPilot.Modal.form(form, {});
    dp.clearSelection();

    if (modal.canceled) {
      return;
    };

    const event = {
      start: args.start,
      end: args.end,
      id: DayPilot.guid(),
      reg_nro: modal.result.reg_nro,
      merkki: modal.result.merkki,
      asiakas: modal.result.asiakas,
      puh_nro: modal.result.puh_nro,
      tyomaarays: modal.result.tyomaarays,
      invoice: 0
    };

    const {data} = await DayPilot.Http.post('/add_event', event); // Send reservation data to server

      
      // Add reservation to calendar
    dp.events.add({
      start: args.start,
      end: args.end,
      id: data.id,
      reg_nro: data.reg_nro,
      merkki: data.merkki,
      asiakas: data.asiakas,
      puh_nro: data.puh_nro,
      tyomaarays: data.tyomaarays,
      invoice: data.invoice
    });
  },

  // Käyttäjä on valinnut tapahtuman muutettavaksi
  onEventClick: async (args) => {
    const form = [
      {name: "Reg. nro", id: "reg_nro"},
      {name: "Merkki ja malli", id: "merkki"},
      {name: "Asiakas", id: "asiakas"},
      {name: "Puh. nro", id: "puh_nro"},
      {name: "Työmääräys / selite", id: "tyomaarays"}
    ];

    // Näytetään vanhat tiedot
    const modal = await DayPilot.Modal.form(form, args.e.data);
    console.log(args.e.data)
    if (modal.canceled) {
      return;
    }

    // Otetaan uudet tiedot talteen ja lähetetään ne palvelimelle
    const event = {
      id: args.e.id(),
      reg_nro: modal.result.reg_nro,
      merkki: modal.result.merkki,
      asiakas: modal.result.asiakas,
      puh_nro: modal.result.puh_nro,
      tyomaarays: modal.result.tyomaarays
    };
    const {data} = await DayPilot.Http.post(`/update_event`, event);

    // args.e.data = {...args.data, ...data};
    dp.events.update({
      ...args.e.data,
      reg_nro: data.reg_nro,
      merkki: data.merkki,
      asiakas: data.asiakas,
      puh_nro: data.puh_nro,
      tyomaarays: data.tyomaarays
    });

  },

  loadEvents() {
    dp.events.load('/eventlist');
  }

});
dp.init();
dp.loadEvents();

// To change calendar view between day and week, when button is pressed in browser
function change_view() {
  const view = document.getElementById("change_view").innerHTML;
  if (view == "Päivänäkymä") {
    nav.selectMode = "Day"
    dp.viewType = "Day"
    document.getElementById("change_view").innerHTML = "Viikkonäkymä";
  } else if (view == "Viikkonäkymä") {
    nav.selectMode = "Week"
    dp.viewType = "WorkWeek"
    document.getElementById("change_view").innerHTML = "Päivänäkymä"
  };
  nav.update();
  dp.update();
};

// Function to close custom contextmenu
function hideContextMenu() {
  contextMenu.classList.remove("visible");
};

// Function to close invoice modal
function removeInvoiceModal() {
  invoice_modal.remove();
  invoice_background.remove();
  invoice_modal_active = false;
};

// Open custom contextmenu only when rightclick on calendar event
let click_right = MouseEvent;
const contextMenu = document.getElementById("context-menu");
window.addEventListener("contextmenu", (e) => {
  if (e.target && e.target.matches("div.calendar_default_event_inner")) {
    e.preventDefault();
    click_right = e;
    const { clientX: mouseX, clientY: mouseY } = e;
    
    contextMenu.style.top = `${mouseY}px`;
    contextMenu.style.left = `${mouseX}px`;
    
    hideContextMenu();
    setTimeout(() => {
      contextMenu.classList.add("visible");
    })
  }

  // Invoice form is shown when contextmenu button is pressed
  contextMenu.onclick = function() {
    hideContextMenu();
    invoiceModalCreate();

    // If services and prices have been added already, data from server is loaded and shown
    if (e.target.offsetParent.event.data.invoice == 1) {
      const event_id = {};
      event_id.id = click_right.target.offsetParent.event.data.id;
      const invoice_db = new XMLHttpRequest();
      
      invoice_db.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          let invoice_data = JSON.parse(this.response);
          form_lines = Object.keys(invoice_data).length / 2;

          invoice_modal.removeChild(invoice_modal.lastChild); // Removes buttons from invoice modal
          while (row_index < form_lines) {
            addLine();
          }
          
          for (let key in invoice_data) {
            console.log(`${key} : ${invoice_data[key]}`);
            document.forms["invoice_form"][key].value = invoice_data[key];
          }
          
          console.log(invoice_data);
          console.log(Object.keys(invoice_data).length/2);
          
        };
      }
      invoice_db.open('POST', "/get_invoice", true);
      invoice_db.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      invoice_db.send(JSON.stringify(event_id));
    };
  }

  if (contextMenu.classList.contains("visible")) {
    hideContextMenu();
  }
});

window.addEventListener("click", (clk) => {
  if (contextMenu.classList.contains("visible")) {
    hideContextMenu();
  }
  if (clk.target && clk.target.matches(".invoice_button_cancel") || clk.target.matches(".invoice_window_background")) {
    removeInvoiceModal();
  }
});

var invoice_modal_active = false;

// To send invoice data to server
function sendData() {
  const form_data = new FormData(document.querySelector("form"));
  
  const service_data = {};
  service_data.id = click_right.target.offsetParent.event.data.id;
  for (let [key, value] of form_data) {
    service_data[key] = value;
  }

  const invoice_db = new XMLHttpRequest();

  invoice_db.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      click_right.target.offsetParent.event.data.invoice = 1;
      dp.update();
    };
  }
  invoice_db.open('POST', "/add_invoice", true);
  invoice_db.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  invoice_db.send(JSON.stringify(service_data));
  removeInvoiceModal();
};

// Add lines to modal form, max 15
let row_index = 0;
function addLine() {
  if (row_index < 15) {
    const input_field = document.createElement("div");
    input_field.setAttribute("class", "input_fields")
    const input_field_serv = document.createElement("input");
    input_field_serv.setAttribute("type", "text");
    input_field_serv.setAttribute("class", "service");
    input_field_serv.setAttribute("name", `service${row_index}`);
    input_field_serv.setAttribute("required", "");
    input_field_serv.setAttribute("value", "");
    const input_field_price = document.createElement("input");
    input_field_price.setAttribute("type", "text");
    input_field_price.setAttribute("class", "price");
    input_field_price.setAttribute("name", `price${row_index}`);
    input_field_price.setAttribute("required", "");
    input_field_price.setAttribute("value", "");

    input_field.appendChild(input_field_serv);
    input_field.appendChild(input_field_price);
    row_index++;
    invoice_form.appendChild(input_field);
  }
};

// To remove line(s) from invoice modal form
function removeLine() {
  if (invoice_form.childElementCount > 2) {
    invoice_form.removeChild(invoice_form.lastChild);
  }
};

// For creating modal dynamically
function invoiceModalCreate () {
  row_index = 0;
  const invoice_background = document.createElement("div");
  invoice_background.setAttribute("id", "invoice_background");
  invoice_background.setAttribute("class", "invoice_window_background")

  const invoice_modal = document.createElement("div");
  invoice_modal.setAttribute("id", "invoice_modal");

  const form_header = document.createElement("div");
  form_header.setAttribute("class", "form_header");
  const input_field_service_header = document.createElement("label");
  input_field_service_header.setAttribute("class", "service_field_header");
  input_field_service_header.textContent = "Huoltotyö / varaosat / selite";
  const input_field_price_header = document.createElement("label");
  input_field_price_header.setAttribute("class", "price_field_header");
  input_field_price_header.textContent = "Hinta";
  form_header.appendChild(input_field_service_header);
  form_header.appendChild(input_field_price_header);
  
  const invoice_form = document.createElement("form");
  invoice_form.setAttribute("id", "invoice_form");
  invoice_form.setAttribute("onsubmit", "sendData(); return false");
  
  
  const invoice_buttons = document.createElement("div");
  invoice_buttons.setAttribute("class", "invoice_buttons");
  const ok_button = document.createElement("button");
  ok_button.setAttribute("class", "invoice_button_ok")
  ok_button.setAttribute("type", "submit");
  ok_button.setAttribute("form", "invoice_form");
  ok_button.textContent = "OK";
  const cancel_button = document.createElement("button");
  cancel_button.setAttribute("class", "invoice_button_cancel");
  cancel_button.setAttribute("type", "button");
  cancel_button.textContent = "Cancel";
  
  const add_button = document.createElement("button");
  add_button.setAttribute("class", "invoice_button_add");
  add_button.setAttribute("type", "button");
  add_button.setAttribute("onclick", "addLine()");
  add_button.textContent = "Lisää rivi";
  
  const remove_button = document.createElement("button");
  remove_button.setAttribute("class", "invoice_button_remove");
  remove_button.setAttribute("type", "button");
  remove_button.setAttribute("onclick", "removeLine()");
  remove_button.textContent = "Poista rivi";
  
  invoice_form.appendChild(form_header);
  
  invoice_buttons.appendChild(ok_button);
  invoice_buttons.appendChild(cancel_button);
  invoice_buttons.appendChild(remove_button);
  invoice_buttons.appendChild(add_button);
  
  invoice_modal.appendChild(invoice_form);
  invoice_modal.appendChild(invoice_buttons);
  
  document.body.appendChild(invoice_background);
  document.body.appendChild(invoice_modal);
  
  addLine();
  invoice_modal_active = true;
};