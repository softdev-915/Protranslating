import _ from 'lodash';

export const extraFields = {
  apostilleInPrefecture: {
    English: 'Extra 1: Apostille in the Prosecutor\'s Office/Prefecture',
    Spanish: 'Extra 1: Apostilla en el Ministerio Fiscal/Prefectura',
    German: 'Extra 1: Apostille bei der Staatsanwaltschaft/Präfektur',
    Italian: 'Extra 1: Apostilla in Procura/Prefettura',
    French: 'Extra 1: Apostille au parquet/préfecture',
  },
  legalizationInPrefecture: {
    English: 'Extra 2: Legalization in the Prosecutor\'s Office/Prefecture',
    Spanish: 'Extra 2: Legalización en la Fiscalía/Prefectura',
    German: 'Extra 2: Legalisierung bei der Staatsanwaltschaft/Präfektur',
    Italian: 'Extra 2: Legalizzazione in Procura/Prefettura',
    French: 'Extra 2: Légalisation au parquet/préfecture',
  },
  applicationVoucher: {
    English: 'Extra 3: Application Voucher',
    Spanish: 'Extra 3: Solicitud de comprobante',
    German: 'Extra 3: Beantragung eines Gutscheins',
    Italian: 'Extra 3: Applicazione Voucher',
    French: 'Extra 3: Demande de pièces justificatives',
  },
  notaryAsseveration: {
    English: 'Extra 4: Notary Asseveration',
    Spanish: 'Extra 4: Legalización notarial',
    German: 'Extra 4: Notarielle Beglaubigung',
    Italian: 'Extra 4: Asseverazione da Notaio',
    French: 'Extra 4: Authentification notariale',
  },
  asseverationByNotaryPublicForNotaryPublic: {
    English: 'Extra 5: Asseveration by Notary Public for Notary Public',
    Spanish: 'Extra 5: Notario Aseveración notarial',
    German: 'Extra 5: Notar Notarielle Beglaubigung',
    Italian: 'Extra 5: Asseverazione da Notai per Notai',
    French: 'Extra 5: Notaire Notaire Asseveration',
  },
  asseverationNotaryPublicOfClientPaidByClient: {
    English: 'Extra 6: ASSEVERATION Notary Public of the client paid by the client',
    Spanish: 'Extra 6: ASEVERACIÓN Notario a cargo del cliente',
    German: 'Extra 6: ASSEVERATION Notar bezahlt vom Klienten',
    Italian: 'Extra 6: ASSEVERAZIONE Notaio del cliente pagato dal cliente',
    French: 'Extra 6: ASSÉVERATION Notaire payé par le client',
  },
  asseverationByRegisteredTranslator: {
    English: 'Extra 7: ASSEVERATION (by registered translator)',
    Spanish: 'Extra 7: ASEVERACIÓN (por traductor jurado)',
    German: 'Extra 7: Beglaubigung (durch registrierten Übersetzer)',
    Italian: 'Extra 7: ASSEVERAZIONE (da parte di traduttore iscritto all\'albo)',
    French: 'Extra 7: ASSÉVÉRATION (par un traducteur agréé)',
  },
  asseverationInCourt: {
    English: 'Extra 8: Asseveration in Court',
    Spanish: 'Extra 8: Aseveración ante el tribunal',
    German: 'Extra 8: Beglaubigung vor Gericht',
    Italian: 'Extra 8: Asseverazione in Tribunale',
    French: 'Extra 8: Assermentation devant le tribunal',
  },
  lawlinguistsSelfCertification: {
    English: 'Extra 9: Lawlinguists self-certification',
    Spanish: 'Extra 9: Autocertificación Lawlinguists',
    German: 'Extra 9: Selbstbeurkundung Rechtsübersetzer',
    Italian: 'Extra 9: Autocertificazione Lawlinguists',
    French: 'Extra 9: Autocertification Lawlinguists',
  },
  deadlineAcceptanceAndDeadlineForSendingSeparateDocument: {
    English: 'Extra 10: Deadline acceptance and deadline for sending separate document',
    Spanish: 'Extra 10: Plazo de aceptación y plazo de envío del documento por separado',
    German: 'Extra 10: Frist für die Annahme und Frist für die Zusendung eines separaten Dokuments',
    Italian: 'Extra 10: Deadline accettazione e deadline invio documento separate',
    French: 'Extra 10: Délai d\'acceptation et délai d\'envoi d\'un document séparé',
  },
  highAmount: {
    English: 'Extra 11: HIGH AMOUNT - separate written acceptance by client',
    Spanish: 'Extra 11: ALTO IMPORTE - aceptación por escrito separada por parte del cliente',
    German: 'Extra 11: HOHER BETRAG - separate schriftliche Annahme durch den Kunden',
    Italian: 'Extra 11: IMPORTO ELEVATO - accettazione per iscritto separata del cliente',
    French: 'Extra 11: MONTANT ÉLEVÉ - acceptation écrite séparée par le client',
  },
  legalizationInConsulate: {
    English: 'Extra 12: Legalization in Consulate',
    Spanish: 'Extra 12: Legalización en Consulado',
    German: 'Extra 12: Legalisierung im Konsulat',
    Italian: 'Extra 12: Legalizzazione in Consolato',
    French: 'Extra 12: Légalisation au consulat',
  },
  changeInProgress: {
    English: 'Extra 13: Changes in progress',
    Spanish: 'Extra 13: Cambios en curso',
    German: 'Extra 13: Änderungen im Gange',
    Italian: 'Extra 13: Modifiche in corso d\'opera',
    French: 'Extra 13: Modifications en cours',
  },
  documentCountNotFinal: {
    English: 'Extra 14: Document/word count not final',
    Spanish: 'Extra 14: Recuento de documentos/palabras no definitivo',
    German: 'Extra 14: Dokument/Wortzahl nicht endgültig',
    Italian: 'Extra 14: Documento/ numero di parole non definitivi',
    French: 'Extra 14: Le nombre de documents/mots n\'est pas définitif',
  },
  partsInCommon: {
    English: 'Extra 15: Parts in common',
    Spanish: 'Extra 15: Partes comunes',
    German: 'Extra 15: Gemeinsame Teile',
    Italian: 'Extra 15: Parti in comune',
    French: 'Extra 15: Parties communes',
  },
  remainsPossible: {
    English: 'Extra 16: Remains Possible',
    Spanish: 'Extra 16: Sigue siendo posible',
    German: 'Extra 16: Bleibt möglich',
    Italian: 'Extra 16: Resta Possibile',
    French: 'Extra 16: Reste possible',
  },
  translationWithTrack: {
    English: 'Extra 17: Translation with track - revision excluded from quote',
    Spanish: 'Extra 17: Traducción con seguimiento - revisión excluida del presupuesto',
    German: 'Extra 17: Übersetzung mit Track - Überarbeitung vom Kostenvoranschlag ausgeschlossen',
    Italian: 'Extra 17: Traduzione con track - revisione esclusa dal preventivo',
    French: 'Extra 17: Traduction avec suivi - révision exclue du devis',
  },
  freeTranslation: {
    English: 'Extra 18: Free translation - Urgency not free',
    Spanish: 'Extra 18: Traducción libre - Urgencia no libre',
    German: 'Extra 18: Freie Übersetzung - Dringlichkeit nicht frei',
    Italian: 'Extra 18: Traduzione gratuita - Urgenza non gratuita',
    French: 'Extra 18: Traduction gratuite - Urgence non gratuite',
  },
};

export const extraFieldsLanguages = ['English', 'Spanish', 'Italian', 'French', 'German'];

export const formattedExtraFields = Object.keys(extraFields).reduce((formattedFields, field) => {
  extraFieldsLanguages.forEach((language) => {
    formattedFields[`${field}${language}`] = '';
  });
  return formattedFields;
}, {});

export const generateExtraFieldsTypes = (languagesExtra, componentOptionsForExtras) =>
  Object.keys(extraFields).reduce((formattedFields, field) => {
    extraFieldsLanguages.forEach((language) => {
      formattedFields.push({
        label: _.get(extraFields, `${field}.${language}`, ''),
        templateKey: `${field}${language}`,
        templatePath: 'custom',
        type: 'text-editor',
        isAlwaysAvailable: languagesExtra === language,
        componentOptions: componentOptionsForExtras,
        canHideField: true,
      });
    });
    return formattedFields;
  }, []);
