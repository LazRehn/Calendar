

// Change calendar view, between day and week, when button is pressed in browser
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

// Näyttää kuukausikalenterin, jossa mahdollisuus valita viikkokalenteri
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

// Luodaan kalenteri
const dp = new DayPilot.Calendar("dp", {
  viewType: "WorkWeek",
  businessBeginsHour: 8,
  // dayBeginsHour: 8,
  // dayEndsHour: 19,
  locale: "fi-fi",
  durationBarVisible : false,

  headerDateFormat: "dddd dd.MM.yyyy",
  eventDeleteHandling: "Update",

  // onBeforeHeaderRender: args => {
  //   args.header.html = args.header.toString("dddd"+"<br>"+"dd.MM.yyyy");
  // },

  // Varauksen muotoilu
  onBeforeEventRender: args => {
    args.data.html = "<b>Reg nro:</b> "
    +args.data.reg_nro+" <b>Merkki:</b> "
    +args.data.merkki+"<br>"+"<b>Asiakas:</b> "
    +args.data.asiakas+"<br>"+ args.data.puh_nro+"<br>"
    +"<b>Työmääräys / selite:</b> <br>"
    +args.data.tyomaarays;
  },

  // Poistaa tapahtuman
  onEventDeleted: async (args) => {
    const data = {
    id: args.e.id()
    };
    await DayPilot.Http.post('/delete_event', data);
    // console.log("Deleted");
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

  //  Create modal
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
      tyomaarays: modal.result.tyomaarays
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
      tyomaarays: data.tyomaarays
    });
      // console.log("Created.");
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

// Function to close custom contextmenu
function hideContextMenu() {
  contextMenu.classList.remove("visible");
};

function removeInvoiceModal() {
  invoice_modal.remove();
  invoice_background.remove();
  invoice_modal_active = false;
};



// Open custom contextmenu only when rightclick on calendar event
const contextMenu = document.getElementById("context-menu");
window.addEventListener("contextmenu", (e) => {
  if (e.target && e.target.matches("div.calendar_default_event_inner")) {
    e.preventDefault();
    const { clientX: mouseX, clientY: mouseY } = e;
    
    contextMenu.style.top = `${mouseY}px`;
    contextMenu.style.left = `${mouseX}px`;
    
    hideContextMenu();
    setTimeout(() => {
      contextMenu.classList.add("visible");
    })
  } else {
    hideContextMenu();
  };
  
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


// Click on invoice button brings here. 
function invoice() {
  hideContextMenu();
  invoiceModalCreate();

};


function sendData() {
  const form_data = new FormData(document.querySelector("form"));
  
  const service_data = {
    // service1: form_data.get("service1"),
    // price1: form_data.get("price1")
  };
  for (let [key, value] of form_data) {
    service_data[key] = value;
  }
  removeInvoiceModal();
  console.log(service_data);
}


//  For creating modal
function invoiceModalCreate () {
  
  const invoice_background = document.createElement("div");
  invoice_background.setAttribute("id", "invoice_background");
  invoice_background.setAttribute("class", "invoice_window_background")

  const invoice_modal = document.createElement("div");
  invoice_modal.setAttribute("id", "invoice_modal");

  const form_header = document.createElement("div");
  form_header.setAttribute("class", "form_header");
  const input_field_service_header = document.createElement("label");
  input_field_service_header.setAttribute("class", "service_field_header");
  input_field_service_header.textContent = "Service";
  const input_field_price_header = document.createElement("label");
  input_field_price_header.setAttribute("class", "price_field_header");
  input_field_price_header.textContent = "Price";
  form_header.appendChild(input_field_service_header);
  form_header.appendChild(input_field_price_header);
  
  const invoice_form = document.createElement("form");
  invoice_form.setAttribute("id", "invoice_form");
  invoice_form.setAttribute("onsubmit", "sendData(); return false");

  const input_field_1 = document.createElement("div");
  input_field_1.setAttribute("class", "input_fields")
  const input_field_serv = document.createElement("input");
  input_field_serv.setAttribute("type", "text");
  input_field_serv.setAttribute("name", "service1");
  input_field_serv.setAttribute("class", "service");
  const input_field_price = document.createElement("input");
  input_field_price.setAttribute("type", "text");
  input_field_price.setAttribute("name", "price1");
  input_field_price.setAttribute("class", "price");
  input_field_1.appendChild(input_field_serv);
  input_field_1.appendChild(input_field_price);

  const input_field_2 = document.createElement("div");
  input_field_2.setAttribute("class", "input_fields");
  const input_field_serv2 = document.createElement("input");
  input_field_serv2.setAttribute("type", "text");
  input_field_serv2.setAttribute("name", "service2");
  input_field_serv2.setAttribute("class", "service");
  const input_field_price2 = document.createElement("input");
  input_field_price2.setAttribute("type", "text");
  input_field_price2.setAttribute("name", "price2");
  input_field_price2.setAttribute("class", "price");
  input_field_2.appendChild(input_field_serv2);
  input_field_2.appendChild(input_field_price2);



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

  invoice_form.appendChild(form_header);
  invoice_form.appendChild(input_field_1);
  invoice_form.appendChild(input_field_2);

  invoice_buttons.appendChild(ok_button);
  invoice_buttons.appendChild(cancel_button);
  
  invoice_modal.appendChild(invoice_form);
  invoice_modal.appendChild(invoice_buttons);

  document.body.appendChild(invoice_background);
  document.body.appendChild(invoice_modal);

  invoice_modal_active = true;
};