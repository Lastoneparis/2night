// 2NIGHT — country picker for the waitlist phone field.
// Flags + dial codes for every country, names in the page language
// (Intl.DisplayNames), and normalisation to E.164 so the list holds
// "+33766614655" + "FR" instead of a bare "0766614655" nobody can place.
(function () {
  // ISO 3166-1 alpha-2 -> calling code (ITU E.164), every assigned country.
  var DIAL = {
    AF:"93",AL:"355",DZ:"213",AS:"1",AD:"376",AO:"244",AI:"1",AG:"1",AR:"54",AM:"374",AW:"297",AU:"61",
    AT:"43",AZ:"994",BS:"1",BH:"973",BD:"880",BB:"1",BY:"375",BE:"32",BZ:"501",BJ:"229",BM:"1",BT:"975",
    BO:"591",BA:"387",BW:"267",BR:"55",IO:"246",VG:"1",BN:"673",BG:"359",BF:"226",BI:"257",KH:"855",CM:"237",
    CA:"1",CV:"238",BQ:"599",KY:"1",CF:"236",TD:"235",CL:"56",CN:"86",CX:"61",CC:"61",CO:"57",KM:"269",
    CG:"242",CD:"243",CK:"682",CR:"506",CI:"225",HR:"385",CU:"53",CW:"599",CY:"357",CZ:"420",DK:"45",DJ:"253",
    DM:"1",DO:"1",EC:"593",EG:"20",SV:"503",GQ:"240",ER:"291",EE:"372",SZ:"268",ET:"251",FK:"500",FO:"298",
    FJ:"679",FI:"358",AX:"358",FR:"33",GF:"594",PF:"689",GA:"241",GM:"220",GE:"995",DE:"49",GH:"233",GI:"350",
    GR:"30",GL:"299",GD:"1",GP:"590",GU:"1",GT:"502",GG:"44",GN:"224",GW:"245",GY:"592",HT:"509",HN:"504",
    HK:"852",HU:"36",IS:"354",IN:"91",ID:"62",IR:"98",IQ:"964",IE:"353",IM:"44",IL:"972",IT:"39",JM:"1",
    JP:"81",JE:"44",JO:"962",KZ:"7",KE:"254",KI:"686",XK:"383",KW:"965",KG:"996",LA:"856",LV:"371",LB:"961",
    LS:"266",LR:"231",LY:"218",LI:"423",LT:"370",LU:"352",MO:"853",MG:"261",MW:"265",MY:"60",MV:"960",ML:"223",
    MT:"356",MH:"692",MQ:"596",MR:"222",MU:"230",YT:"262",MX:"52",FM:"691",MD:"373",MC:"377",MN:"976",ME:"382",
    MS:"1",MA:"212",MZ:"258",MM:"95",NA:"264",NR:"674",NP:"977",NL:"31",NC:"687",NZ:"64",NI:"505",NE:"227",
    NG:"234",NU:"683",NF:"672",KP:"850",MK:"389",MP:"1",NO:"47",OM:"968",PK:"92",PW:"680",PS:"970",PA:"507",
    PG:"675",PY:"595",PE:"51",PH:"63",PL:"48",PT:"351",PR:"1",QA:"974",RE:"262",RO:"40",RU:"7",RW:"250",
    BL:"590",SH:"290",KN:"1",LC:"1",MF:"590",PM:"508",VC:"1",WS:"685",SM:"378",ST:"239",SA:"966",SN:"221",
    RS:"381",SC:"248",SL:"232",SG:"65",SX:"1",SK:"421",SI:"386",SB:"677",SO:"252",ZA:"27",KR:"82",SS:"211",
    ES:"34",LK:"94",SD:"249",SR:"597",SJ:"47",SE:"46",CH:"41",SY:"963",TW:"886",TJ:"992",TZ:"255",TH:"66",
    TL:"670",TG:"228",TK:"690",TO:"676",TT:"1",TN:"216",TR:"90",TM:"993",TC:"1",TV:"688",UG:"256",UA:"380",
    AE:"971",GB:"44",US:"1",UY:"598",UZ:"998",VU:"678",VA:"39",VE:"58",VN:"84",VI:"1",WF:"681",EH:"212",
    YE:"967",ZM:"260",ZW:"263"
  };
  // The country a shared code means when a number is typed with "+" and the
  // picker isn't already on one of its countries.
  var PRIMARY = { "1":"US","7":"RU","44":"GB","47":"NO","39":"IT","61":"AU","262":"RE","590":"GP",
                  "599":"CW","212":"MA","358":"FI" };
  // Italy, San Marino and the Vatican keep their leading 0 after the code.
  var KEEP_ZERO = { IT:1, SM:1, VA:1 };
  // Page language -> likely country, when the browser gives no region.
  var LANG_COUNTRY = { fr:"FR",de:"DE",es:"ES",it:"IT",pt:"PT","pt-BR":"BR",nl:"NL",pl:"PL",ru:"RU",uk:"UA",
    cs:"CZ",ro:"RO",hu:"HU",sv:"SE",nb:"NO",da:"DK",fi:"FI",el:"GR",tr:"TR",ar:"SA",he:"IL",ja:"JP",
    "zh-Hans":"CN","zh-Hant":"TW",ko:"KR",th:"TH",vi:"VN",id:"ID",ms:"MY",hi:"IN",bn:"BD",ur:"PK",sw:"KE",
    fil:"PH",en:"GB" };

  function flag(iso) {
    return iso.replace(/./g, function (c) { return String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65); });
  }
  function pageLang() { return document.documentElement.getAttribute("lang") || "en"; }
  function names() {
    try { return new Intl.DisplayNames([pageLang(), "en"], { type: "region" }); } catch (_) { return null; }
  }
  function nameOf(iso, dn) { try { return (dn && dn.of(iso)) || iso; } catch (_) { return iso; } }

  function guessCountry() {
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < langs.length; i++) {
      var m = /^[a-z]{2,3}(?:-[A-Za-z]{4})?-([A-Z]{2})\b/.exec(langs[i] || "");
      if (m && DIAL[m[1]]) return m[1];
    }
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      var TZ = { "Europe/Paris":"FR","Europe/Zurich":"CH","Europe/Brussels":"BE","Europe/Luxembourg":"LU",
        "Europe/Monaco":"MC","Europe/London":"GB","Europe/Berlin":"DE","Europe/Madrid":"ES","Europe/Rome":"IT",
        "Europe/Lisbon":"PT","Europe/Amsterdam":"NL","America/Montreal":"CA","America/Toronto":"CA",
        "Africa/Casablanca":"MA","Africa/Algiers":"DZ","Africa/Tunis":"TN","Africa/Dakar":"SN","Africa/Abidjan":"CI" };
      if (TZ[tz]) return TZ[tz];
    } catch (_) {}
    return LANG_COUNTRY[pageLang()] || LANG_COUNTRY[pageLang().split("-")[0]] || "FR";
  }

  // Normalise what was typed to E.164 for the chosen country.
  // Returns { e164, iso } or null when it can't be a phone number.
  function normalize(raw, iso) {
    var s = String(raw || "").trim();
    var intl = /^\s*(\+|00)/.test(s);
    var d = s.replace(/[^0-9]/g, "");
    if (intl) {
      if (s.replace(/^\s+/, "").indexOf("00") === 0) d = d.slice(2);
      // Longest calling code that matches (codes are 1-3 digits).
      for (var n = 3; n >= 1; n--) {
        var cc = d.slice(0, n), hit = null;
        if (DIAL[iso] === cc) hit = iso;
        else if (PRIMARY[cc]) hit = PRIMARY[cc];
        else for (var k in DIAL) if (DIAL[k] === cc) { hit = k; break; }
        if (hit) {
          var rest = d.slice(n);
          if (rest.charAt(0) === "0" && !KEEP_ZERO[hit]) rest = rest.slice(1);   // "+33 (0)6…"
          return valid(cc, rest) ? { e164: "+" + cc + rest, iso: hit } : null;
        }
      }
      return null;
    }
    var code = DIAL[iso]; if (!code) return null;
    var nat = d;
    if (code === "1" && nat.length === 11 && nat.charAt(0) === "1") nat = nat.slice(1);            // 1-555-…
    else if (code === "7" && nat.length === 11 && nat.charAt(0) === "8") nat = nat.slice(1);       // 8-9xx-…
    else if (!KEEP_ZERO[iso]) nat = nat.replace(/^0/, "");                                         // 06… -> 6…
    return valid(code, nat) ? { e164: "+" + code + nat, iso: iso } : null;
  }
  function valid(code, nat) { return nat.length >= 6 && (code + nat).length <= 15; }

  // Build the picker into <select id="wlCountry"> and its visible chip.
  function init() {
    var sel = document.getElementById("wlCountry"), chip = document.getElementById("wlCountryChip");
    var input = document.getElementById("wlPhone");
    if (!sel || !chip || !input) return;
    var dn = names();
    var list = Object.keys(DIAL).map(function (iso) { return { iso: iso, name: nameOf(iso, dn) }; });
    list.sort(function (a, b) { return a.name.localeCompare(b.name, pageLang()); });
    sel.innerHTML = "";
    list.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.iso; o.textContent = flag(c.iso) + "  " + c.name + "  +" + DIAL[c.iso];
      sel.appendChild(o);
    });
    sel.value = init.keep || guessCountry();
    function paint() { chip.textContent = flag(sel.value) + " +" + DIAL[sel.value]; }
    if (!init.wired) {            // init() re-runs on a language change: wire once
      init.wired = true;
      sel.addEventListener("change", function () { paint(); input.focus(); });
      // Typing "+41…" or "0041…" moves the picker to that country.
      input.addEventListener("input", function () {
        if (!/^\s*(\+|00)\d/.test(input.value)) return;
        var r = normalize(input.value, sel.value);
        if (r && r.iso !== sel.value) { sel.value = r.iso; paint(); }
      });
    }
    paint();
  }
  // The language switcher rewrites <html lang>: rebuild the names, keep the choice.
  new MutationObserver(function () {
    var s = document.getElementById("wlCountry"); init.keep = s && s.value; init();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  window.TN_PHONE = { normalize: normalize, flag: flag, dial: function (iso) { return DIAL[iso]; },
                      country: function () { var s = document.getElementById("wlCountry"); return s ? s.value : ""; },
                      init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
