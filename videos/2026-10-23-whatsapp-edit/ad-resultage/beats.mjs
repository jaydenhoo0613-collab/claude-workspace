// Resultage ad: edit plan for engine.mjs. Phrases are looked up in assets/cut-asr.json (medium.en).
// Uncertain hearings (owner to confirm): "rollercoaster", "One month involves less humans being clients",
// "Resultage" spelling, "on a pay-up results basis", "4 calls a month".
export default ({ W, E, DUR }) => ({
  title: "Resultage ad v1",

  fix: {
    "We@0.00": "You",
    "we@2.64": "your", "are@2.68": null, "getting@3.00": "get", "results,@3.20": "results.",
    "blue@5.74": "rollercoaster?", "coaster?@5.76": null,
    "he@16.70": null,
    "15@25.92": "15-20", "-20@26.24": null,
    "social@27.26": "sales",
  },

  dev: [
    // hook: the qualifier as a count-up
    { id: "d01", s: 0, e: W("we are", 2),
      small: [[0, "You are a coach doing"]],
      big: { t: W("10K"), text: "10K A MONTH", enter: "count", count: { pre: "", to: 10, suf: "K A MONTH" } } },
    // the problem, letter by letter
    { id: "d02", s: W("so why"), e: W("one month"),
      small: [[W("so why"), "so why does your calendar"], [W("look like"), "look like a"]],
      big: { t: W("blue"), text: "ROLLERCOASTER?", enter: "letters" } },
    // the pain: red box
    { id: "d03", s: W("and it's always"), e: W("so", 2),
      small: [[W("and it's always"), "and it's always the"]],
      big: { t: W("sales calls"), text: "SALES CALLS", kind: "red" } },
    // the qualifier
    { id: "d04", s: W("so", 3), e: W("and our one"),
      small: [[W("so", 3), "we only work with"]],
      big: { t: W("online coaches"), text: "ONLINE COACHES", enter: "blurfade" } },
    // the risk reversal: win-color box
    { id: "d05", s: W("on a pay-up"), e: W("with the right"),
      small: [[W("on a pay-up"), "on a"]],
      big: { t: W("results basis"), text: "RESULTS BASIS", kind: "green" } },
    // proof
    { id: "d06", s: W("and one business"), e: DUR,
      small: [[W("and one business"), "one business coach went from"]],
      big: { parts: [[W("4 calls"), "4 CALLS"], [W("17"), " → 17", { pre: " → ", to: 17, suf: "" }]] },
      sub: [[W("a month", 3), "a month"]] },
  ],

  cards: [
    { id: "c01", type: "bullets", s: W("next month"), e: W("it's like"), mode: "fade",
      label: "Next month",
      items: [[W("demon"), "DELIVERING"], [W("the calendar"), "CALENDAR GOES QUIET"]] },
    { id: "c02", type: "flow", s: W("where the chef"), e: W("and it's always"),
      nodes: [[W("chef"), "THE CHEF"], [W("takes the orders"), "TAKES THE ORDERS"], [W("answers the call"), "ANSWERS THE CALL"]],
      circleT: W("something"), notes: [[W("something"), "something has to give"]] },
    { id: "c03", type: "name", s: W("so", 2), e: W("so", 3),
      name: "JAYDEN", t: W("jayden"), role: [W("founder"), "founder of Resultage"] },
    { id: "c04", type: "stat", s: W("and our one"), e: W("on a pay-up"),
      small: "booking you", t: W("15"), to: 20, pre: "15-", suf: "",
      subs: [[W("qualified"), "qualified sales calls"], [W("a month", 2), "a month"]] },
    { id: "c05", type: "bullets", s: W("with the right"), e: W("and one business"),
      items: [[W("with the right"), "RIGHT PEOPLE"], [W("with the right", 2), "RIGHT PROBLEM"], [W("ready to talk"), "READY TO TALK"]] },
  ],

  angles: [[W("so why"), "B"], [W("one month"), "A"], [W("it's like"), "B"], [W("and it's always"), "A"],
           [W("so", 3), "B"], [W("on a pay-up"), "A"], [W("and one business"), "B"]],
});
