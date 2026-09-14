/* Feito por GustavoN-S (https://github.com/GustavoN-S) */

(function (root) {
  'use strict';
  const GMX = (root.GMX = root.GMX || {});

  const C = {
    BR: { dial: '55',  trunk: '0', nsn: [10, 11], name: 'Brasil' },
    PT: { dial: '351', trunk: '',  nsn: [9],      name: 'Portugal' },
    US: { dial: '1',   trunk: '1', nsn: [10],     name: 'Estados Unidos' },
    CA: { dial: '1',   trunk: '1', nsn: [10],     name: 'Canada' },
    MX: { dial: '52',  trunk: '0', nsn: [10],     name: 'Mexico' },
    AR: { dial: '54',  trunk: '0', nsn: [10],     name: 'Argentina' },
    CL: { dial: '56',  trunk: '0', nsn: [9],      name: 'Chile' },
    CO: { dial: '57',  trunk: '0', nsn: [10],     name: 'Colombia' },
    PE: { dial: '51',  trunk: '0', nsn: [9],      name: 'Peru' },
    UY: { dial: '598', trunk: '0', nsn: [8, 9],   name: 'Uruguai' },
    PY: { dial: '595', trunk: '0', nsn: [9],      name: 'Paraguai' },
    BO: { dial: '591', trunk: '0', nsn: [8],      name: 'Bolivia' },
    EC: { dial: '593', trunk: '0', nsn: [9],      name: 'Equador' },
    VE: { dial: '58',  trunk: '0', nsn: [10],     name: 'Venezuela' },
    ES: { dial: '34',  trunk: '',  nsn: [9],      name: 'Espanha' },
    FR: { dial: '33',  trunk: '0', nsn: [9],      name: 'Franca' },
    IT: { dial: '39',  trunk: '',  nsn: [9, 10],  name: 'Italia' },
    DE: { dial: '49',  trunk: '0', nsn: [10, 11], name: 'Alemanha' },
    GB: { dial: '44',  trunk: '0', nsn: [10],     name: 'Reino Unido' },
    IE: { dial: '353', trunk: '0', nsn: [9],      name: 'Irlanda' },
    NL: { dial: '31',  trunk: '0', nsn: [9],      name: 'Holanda' },
    BE: { dial: '32',  trunk: '0', nsn: [9],      name: 'Belgica' },
    CH: { dial: '41',  trunk: '0', nsn: [9],      name: 'Suica' },
    AT: { dial: '43',  trunk: '0', nsn: [10],     name: 'Austria' },
    PL: { dial: '48',  trunk: '',  nsn: [9],      name: 'Polonia' },
    SE: { dial: '46',  trunk: '0', nsn: [9],      name: 'Suecia' },
    NO: { dial: '47',  trunk: '',  nsn: [8],      name: 'Noruega' },
    DK: { dial: '45',  trunk: '',  nsn: [8],      name: 'Dinamarca' },
    FI: { dial: '358', trunk: '0', nsn: [9],      name: 'Finlandia' },
    GR: { dial: '30',  trunk: '',  nsn: [10],     name: 'Grecia' },
    RO: { dial: '40',  trunk: '0', nsn: [9],      name: 'Romenia' },
    CZ: { dial: '420', trunk: '',  nsn: [9],      name: 'Chequia' },
    HU: { dial: '36',  trunk: '0', nsn: [9],      name: 'Hungria' },
    RU: { dial: '7',   trunk: '8', nsn: [10],     name: 'Russia' },
    UA: { dial: '380', trunk: '0', nsn: [9],      name: 'Ucrania' },
    TR: { dial: '90',  trunk: '0', nsn: [10],     name: 'Turquia' },
    IL: { dial: '972', trunk: '0', nsn: [9],      name: 'Israel' },
    AE: { dial: '971', trunk: '0', nsn: [9],      name: 'Emirados Arabes' },
    SA: { dial: '966', trunk: '0', nsn: [9],      name: 'Arabia Saudita' },
    ZA: { dial: '27',  trunk: '0', nsn: [9],      name: 'Africa do Sul' },
    NG: { dial: '234', trunk: '0', nsn: [10],     name: 'Nigeria' },
    AO: { dial: '244', trunk: '',  nsn: [9],      name: 'Angola' },
    MZ: { dial: '258', trunk: '',  nsn: [9],      name: 'Mocambique' },
    CV: { dial: '238', trunk: '',  nsn: [7],      name: 'Cabo Verde' },
    EG: { dial: '20',  trunk: '0', nsn: [10],     name: 'Egito' },
    MA: { dial: '212', trunk: '0', nsn: [9],      name: 'Marrocos' },
    IN: { dial: '91',  trunk: '0', nsn: [10],     name: 'India' },
    CN: { dial: '86',  trunk: '0', nsn: [11],     name: 'China' },
    JP: { dial: '81',  trunk: '0', nsn: [9, 10],  name: 'Japao' },
    KR: { dial: '82',  trunk: '0', nsn: [9, 10],  name: 'Coreia do Sul' },
    ID: { dial: '62',  trunk: '0', nsn: [9, 10, 11], name: 'Indonesia' },
    TH: { dial: '66',  trunk: '0', nsn: [9],      name: 'Tailandia' },
    VN: { dial: '84',  trunk: '0', nsn: [9],      name: 'Vietna' },
    PH: { dial: '63',  trunk: '0', nsn: [10],     name: 'Filipinas' },
    MY: { dial: '60',  trunk: '0', nsn: [9, 10],  name: 'Malasia' },
    SG: { dial: '65',  trunk: '',  nsn: [8],      name: 'Singapura' },
    AU: { dial: '61',  trunk: '0', nsn: [9],      name: 'Australia' },
    NZ: { dial: '64',  trunk: '0', nsn: [8, 9],   name: 'Nova Zelandia' },
    PA: { dial: '507', trunk: '',  nsn: [8],      name: 'Panama' },
    CR: { dial: '506', trunk: '',  nsn: [8],      name: 'Costa Rica' },
    GT: { dial: '502', trunk: '',  nsn: [8],      name: 'Guatemala' },
    DO: { dial: '1',   trunk: '1', nsn: [10],     name: 'Republica Dominicana' },
    CU: { dial: '53',  trunk: '0', nsn: [8],      name: 'Cuba' },

    BG: { dial: '359', trunk: '0', nsn: [8, 9],   name: 'Bulgaria' },
    HR: { dial: '385', trunk: '0', nsn: [8, 9],   name: 'Croacia' },
    SI: { dial: '386', trunk: '0', nsn: [8],      name: 'Eslovenia' },
    SK: { dial: '421', trunk: '0', nsn: [9],      name: 'Eslovaquia' },
    RS: { dial: '381', trunk: '0', nsn: [8, 9],   name: 'Servia' },
    BA: { dial: '387', trunk: '0', nsn: [8],      name: 'Bosnia' },
    MK: { dial: '389', trunk: '0', nsn: [8],      name: 'Macedonia do Norte' },
    ME: { dial: '382', trunk: '0', nsn: [8],      name: 'Montenegro' },
    AL: { dial: '355', trunk: '0', nsn: [9],      name: 'Albania' },
    LT: { dial: '370', trunk: '8', nsn: [8],      name: 'Lituania' },
    LV: { dial: '371', trunk: '',  nsn: [8],      name: 'Letonia' },
    EE: { dial: '372', trunk: '',  nsn: [7, 8],   name: 'Estonia' },
    IS: { dial: '354', trunk: '',  nsn: [7],      name: 'Islandia' },
    LU: { dial: '352', trunk: '',  nsn: [6, 9],   name: 'Luxemburgo' },
    MT: { dial: '356', trunk: '',  nsn: [8],      name: 'Malta' },
    CY: { dial: '357', trunk: '',  nsn: [8],      name: 'Chipre' },
    MD: { dial: '373', trunk: '0', nsn: [8],      name: 'Moldavia' },
    BY: { dial: '375', trunk: '8', nsn: [9],      name: 'Bielorrussia' },
    MC: { dial: '377', trunk: '',  nsn: [8, 9],   name: 'Monaco' },
    AD: { dial: '376', trunk: '',  nsn: [6],      name: 'Andorra' },
    SM: { dial: '378', trunk: '',  nsn: [8, 10],  name: 'San Marino' },
    LI: { dial: '423', trunk: '',  nsn: [7],      name: 'Liechtenstein' },
    GI: { dial: '350', trunk: '',  nsn: [8],      name: 'Gibraltar' },

    PR: { dial: '1',   trunk: '1', nsn: [10],     name: 'Porto Rico' },
    JM: { dial: '1',   trunk: '1', nsn: [10],     name: 'Jamaica' },
    TT: { dial: '1',   trunk: '1', nsn: [10],     name: 'Trinidad e Tobago' },
    BS: { dial: '1',   trunk: '1', nsn: [10],     name: 'Bahamas' },
    BB: { dial: '1',   trunk: '1', nsn: [10],     name: 'Barbados' },
    BZ: { dial: '501', trunk: '',  nsn: [7],      name: 'Belize' },
    SV: { dial: '503', trunk: '',  nsn: [8],      name: 'El Salvador' },
    HN: { dial: '504', trunk: '',  nsn: [8],      name: 'Honduras' },
    NI: { dial: '505', trunk: '',  nsn: [8],      name: 'Nicaragua' },
    HT: { dial: '509', trunk: '',  nsn: [8],      name: 'Haiti' }
  };

  const NAMES = {
    BR: ['brasil', 'brazil'],
    PT: ['portugal'],
    US: ['estados unidos', 'united states', 'usa', 'eua'],
    CA: ['canada', 'canadá'],
    MX: ['mexico', 'méxico'],
    AR: ['argentina'],
    CL: ['chile'],
    CO: ['colombia', 'colômbia'],
    PE: ['peru', 'perú'],
    UY: ['uruguai', 'uruguay'],
    PY: ['paraguai', 'paraguay'],
    BO: ['bolivia', 'bolívia'],
    EC: ['equador', 'ecuador'],
    VE: ['venezuela'],
    ES: ['espanha', 'spain', 'españa'],
    FR: ['franca', 'frança', 'france'],
    IT: ['italia', 'itália', 'italy'],
    DE: ['alemanha', 'germany', 'deutschland'],
    GB: ['reino unido', 'united kingdom', 'inglaterra', 'england', 'scotland'],
    IE: ['irlanda', 'ireland'],
    NL: ['holanda', 'netherlands', 'paises baixos', 'países baixos'],
    BE: ['belgica', 'bélgica', 'belgium'],
    CH: ['suica', 'suíça', 'switzerland'],
    AT: ['austria', 'áustria'],
    PL: ['polonia', 'polônia', 'poland'],
    SE: ['suecia', 'suécia', 'sweden'],
    NO: ['noruega', 'norway'],
    DK: ['dinamarca', 'denmark'],
    FI: ['finlandia', 'finlândia', 'finland'],
    GR: ['grecia', 'grécia', 'greece'],
    RO: ['romenia', 'romênia', 'romania'],
    CZ: ['chequia', 'czech'],
    HU: ['hungria', 'hungary'],
    RU: ['russia', 'rússia'],
    UA: ['ucrania', 'ucrânia', 'ukraine'],
    TR: ['turquia', 'turkey'],
    IL: ['israel'],
    AE: ['emirados', 'emirates', 'dubai'],
    SA: ['arabia saudita', 'arábia saudita', 'saudi'],
    ZA: ['africa do sul', 'áfrica do sul', 'south africa'],
    NG: ['nigeria', 'nigéria'],
    AO: ['angola'],
    MZ: ['mocambique', 'moçambique', 'mozambique'],
    CV: ['cabo verde'],
    EG: ['egito', 'egypt'],
    MA: ['marrocos', 'morocco'],
    IN: ['india', 'índia'],
    CN: ['china'],
    JP: ['japao', 'japão', 'japan'],
    KR: ['coreia do sul', 'south korea'],
    ID: ['indonesia', 'indonésia'],
    TH: ['tailandia', 'tailândia', 'thailand'],
    VN: ['vietna', 'vietnã', 'vietnam'],
    PH: ['filipinas', 'philippines'],
    MY: ['malasia', 'malásia', 'malaysia'],
    SG: ['singapura', 'singapore'],
    AU: ['australia', 'austrália'],
    NZ: ['nova zelandia', 'nova zelândia', 'new zealand'],
    PA: ['panama', 'panamá'],
    CR: ['costa rica'],
    GT: ['guatemala'],
    DO: ['republica dominicana', 'república dominicana', 'dominican'],
    CU: ['cuba'],
    BG: ['bulgaria', 'bulgária'], HR: ['croacia', 'croácia', 'croatia'],
    SI: ['eslovenia', 'eslovênia', 'slovenia'], SK: ['eslovaquia', 'eslováquia', 'slovakia'],
    RS: ['servia', 'sérvia', 'serbia'], BA: ['bosnia', 'bósnia'],
    MK: ['macedonia', 'macedônia'], ME: ['montenegro'], AL: ['albania', 'albânia'],
    LT: ['lituania', 'lituânia', 'lithuania'], LV: ['letonia', 'letônia', 'latvia'],
    EE: ['estonia', 'estônia'], IS: ['islandia', 'islândia', 'iceland'],
    LU: ['luxemburgo', 'luxembourg'], MT: ['malta'], CY: ['chipre', 'cyprus'],
    MD: ['moldavia', 'moldávia', 'moldova'], BY: ['bielorrussia', 'bielorrússia', 'belarus'],
    MC: ['monaco', 'mônaco'], AD: ['andorra'], SM: ['san marino'],
    LI: ['liechtenstein'], GI: ['gibraltar'],
    PR: ['porto rico', 'puerto rico'], JM: ['jamaica'],
    TT: ['trinidad'], BS: ['bahamas'], BB: ['barbados'], BZ: ['belize'],
    SV: ['el salvador'], HN: ['honduras'], NI: ['nicaragua', 'nicarágua'],
    HT: ['haiti']
  };

  const DIALS = Array.from(new Set(Object.values(C).map((c) => c.dial)))
    .sort((a, b) => b.length - a.length);

  function list() {
    return Object.keys(C)
      .map((iso) => ({ iso, name: C[iso].name, dial: C[iso].dial }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  function countryFromText(text) {
    if (!text) return '';
    const t = String(text).toLowerCase();
    for (const iso of Object.keys(NAMES)) {
      if (NAMES[iso].some((n) => t.includes(n))) return iso;
    }
    return '';
  }

  function toE164(raw, iso) {
    if (!raw) return '';
    const s = String(raw).trim();

    if (s.startsWith('+')) {
      const d = s.replace(/\D/g, '');
      return d.length >= 8 && d.length <= 15 ? d : '';
    }

    let d = s.replace(/\D/g, '');
    if (!d) return '';

    if (d.startsWith('00')) {
      d = d.slice(2);
      return d.length >= 8 && d.length <= 15 ? d : '';
    }

    const info = C[iso] || C.BR;

    if (info.trunk && info.trunk !== '1' && d.startsWith(info.trunk)) {
      const semTrunk = d.slice(info.trunk.length);
      if (info.nsn.includes(semTrunk.length)) return info.dial + semTrunk;
    }

    if (info.nsn.includes(d.length)) return info.dial + d;

    if (d.startsWith(info.dial)) {
      const resto = d.slice(info.dial.length);
      if (info.nsn.includes(resto.length)) return d;
    }

    for (const dial of DIALS) {
      if (d.startsWith(dial) && d.length - dial.length >= 7) return d;
    }

    if (d.length >= 7 && d.length <= 12) return info.dial + d;

    return '';
  }

  function waLink(raw, iso) {
    const e164 = toE164(raw, iso);
    return e164 ? 'https://wa.me/' + e164 : '';
  }

  function pretty(e164) {
    if (!e164) return '';
    const d = String(e164).replace(/\D/g, '');
    const dial = DIALS.find((x) => d.startsWith(x)) || '';
    const rest = d.slice(dial.length);
    if (!dial) return '+' + d;
    if (dial === '55' && (rest.length === 10 || rest.length === 11)) {
      return '+55 ' + rest.slice(0, 2) + ' ' + rest.slice(2, -4) + '-' + rest.slice(-4);
    }
    if (dial === '1' && rest.length === 10) {
      return '+1 (' + rest.slice(0, 3) + ') ' + rest.slice(3, 6) + '-' + rest.slice(6);
    }
    return '+' + dial + ' ' + rest.replace(/(\d{2,3})(?=\d{3})/g, '$1 ').trim();
  }

  function guess(lead, defaultIso) {
    if (lead && lead.phone && String(lead.phone).trim().startsWith('+')) return '';
    if (defaultIso && defaultIso !== 'AUTO' && C[defaultIso]) return defaultIso;
    if (lead) {
      const fromAddr = countryFromText(lead.address) || countryFromText(lead.city);
      if (fromAddr) return fromAddr;
      const fromQuery = countryFromText(lead.query);
      if (fromQuery) return fromQuery;
    }
    return 'BR';
  }

  GMX.Phone = {
    COUNTRIES: C, DIALS, list, toE164, waLink, pretty, guess, countryFromText
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
