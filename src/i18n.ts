// Lightweight i18n string dictionary. Slovak ("sk") is currently the only
// and default locale, but the structure allows adding more locales later
// by adding a sibling key under `strings` and passing a different Locale
// to `getStrings`.

export const strings = {
  sk: {
    app: {
      name: "Surikata",
      tagline: "Vaša minimalistická RSS čítačka",
    },
    nav: {
      feed: "Príspevky",
      manageSources: "Spravovať zdroje",
      logout: "Odhlásiť sa",
    },
    tabs: {
      new: "Nové články",
      readLater: "Neskôr",
      favorites: "Obľúbené",
      read: "Prečítané",
    },
    feed: {
      allSources: "Všetky zdroje",
      empty: "Zatiaľ tu nie sú žiadne články.",
      undated: "Bez dátumu",
      today: "Dnes",
      yesterday: "Včera",
    },
    article: {
      readLater: "Uložiť na neskôr",
      favorite: "Obľúbené",
    },
    admin: {
      title: "Spravovať zdroje",
      selectSources: "Vybrať zdroje",
      selectSourcesDesc: "Tu si môžete vybrať noviny a časopisy, ktoré sa zobrazia vo vašom feede.",
      selectAll: "Vybrať všetko",
      addCustomFeed: "Pridať vlastný zdroj",
      addCustomFeedDesc: "Vložte priamu adresu RSS alebo Atom zdroja (napr. https://example.com/rss.xml) a kliknite na Načítať zdroj.",
      urlPlaceholder: "Vložte adresu RSS zdroja",
      fetchFeed: "Načítať zdroj",
      fetching: "Načítavam…",
      feedNotFound: "Na tejto adrese sa nepodarilo nájsť platný RSS/Atom zdroj.",
      add: "Pridať",
      feedAddedWithWarning: "Zdroj bol pridaný — články sa zobrazia, hneď ako bude dostupný.",
    },
    auth: {
      windowTitle: "Prihlásenie",
      login: "Prihlásiť sa",
      register: "Registrovať sa",
      createAccount: "Vytvoriť účet",
      usernamePlaceholder: "Používateľské meno",
      passwordPlaceholder: "Heslo",
      passwordRegisterPlaceholder: "Heslo (min. 8 znakov)",
      confirmPasswordPlaceholder: "Potvrďte heslo",
      showPassword: "Zobraziť heslo",
      passwordsMismatch: "Heslá sa nezhodujú.",
      usernamePasswordRequired: "Používateľské meno a heslo sú povinné.",
      invalidCredentials: "Nesprávne používateľské meno alebo heslo.",
      usernamePasswordRules: "Používateľské meno je povinné; heslo musí mať aspoň 8 znakov.",
      passwordsMismatchServer: "Heslá sa nezhodujú.",
      usernameTaken: "Toto používateľské meno je už obsadené.",
    },
  },
} as const;

export type Locale = keyof typeof strings;

export function getStrings(locale: Locale = "sk") {
  return strings[locale];
}

export const t = getStrings();
