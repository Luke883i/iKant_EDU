# Allegati e conservazione dei significati — politica verificabile

La presentazione ultra-compressa non può contenere tutte le prove senza perdita. La **conservazione controllata** richiede due livelli: slide breve e allegato non abbreviato contenente gli atomi critici non visualizzati. Il registro integrale è scritto da HOST e **non è il ledger originale C87**.

## Registro HOST per turno (quando la prova è disponibile)
Schema dell'atomo: `atom_id`, `turn_id` (solo identificatore disponibile, altrimenti null), `owner`, `kind`, `verbatim_or_source_span`, `evidence_digest`, `source_kind`, `observed_at`, `visibility`, `in_slide`, `annex_ref`. La cardinalità degli atomi è verificata: nessuna omissione silenziosa. Le citazioni/mutazioni del contenuto sono marcate, non pulite autonomamente.

Se la sintesi sacrifica un nesso causale, citazioni indispensabili, codice, evidenze negative o controversie, usa un allegato HOST verificato: Markdown per sorgenti testuali, PDF/DOCX quando il loro formato serve e gli strumenti sono presenti. Il **contenuto integrale** rimane un atto HOST distinto dall'originale iKant. Il file deve essere creato/verificato realmente e linkato solo col percorso esatto effettivamente disponibile. Se manca l'atto fisico, segna `NOT_MATERIALIZED`, non inventare URL.

**Non promettere persistenza:** un allegato caricato al Project è un documento consultabile, non un database mutabile o un processo attivo; un allegato nella risposta è verificabile solo nel turno in cui esiste e non garantisce eventi nativi. Proteggere informazioni personali, segreti e dati riservati: digest non equivale a consenso alla pubblicazione.
