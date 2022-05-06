

// Change calendar view, between day and week view, when button is pressed in browser
function change_view() {
  const view = document.getElementById("change_view").innerHTML;
  if (view == "Päivänäkymä") {
    nav.selectMode = "Day"
    dp.viewType = "Day"
    nav.update();
    dp.update();
    document.getElementById("change_view").innerHTML = "Viikkonäkymä";
  } else if (view == "Viikkonäkymä") {
    nav.selectMode = "Week"
    dp.viewType = "WorkWeek"
    nav.update();
    dp.update();
    document.getElementById("change_view").innerHTML = "Päivänäkymä"
  };
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



  // Ajanvarauksen lisääminen

  //Luodaan popup lomake
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

    const {data} = await DayPilot.Http.post('/add_event', event); // Lähettää varaustiedot palvelimelle

      
      // Lisää kalenteriin
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