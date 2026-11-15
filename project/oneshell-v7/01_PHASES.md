# Fasi — un solo passaggio per turno

| Fase | Trigger nuovo messaggio umano | Azione originale consentita | Esito |
|---|---|---|---|
| INDEX | primo accesso / nuova chat | Verifica file ZIP, impronte locali e HEAD; NO_VOICE | STOP |
| ADMISSION | `avvia iKant` esatto | Fissa live main; compara 5 blob; leggi 5 documenti in ordine; TERMS verbatim | STOP |
| ACCEPT | `I ACCEPT` esatto dopo disclosure corrente | Presenta introduzione originale del C72/v2 | STOP |
| MODE | `EDU` o `CANONICAL` esatto dopo ACCEPT | Ricevuta originale C72/v2; scelta non è altro consenso | STOP |
| EDU | turno successivo e owner reale callable | scan adapters; if source missing, one direct pinned ZIP link; then C135 EDU/v2, C107-v2, C70/C100/C126, C87 single writer, readback, C125 | OneShell attestata o NO_VOICE |
| CANONICAL | app nativa realmente connessa e ricevute C59 | solo owner originale C59 e delivery verificato | OneShell attestata o NO_VOICE |
| HOST AUDIT | richiesta al modello, non esecuzione runtime | B utile, A=NO_VOICE, prove verificabili | OneShell HOST con un NEXT |
| UNKNOWN SEND | callback o scrittura di esito incerto | STOP, riconciliazione senza nuovi invii | OneShell HOST A=NO_VOICE |

**Importante:** L'introduzione in risposta a `I ACCEPT` deve essere originale e STOP. Un file o messaggio storico non sostituisce un turno umano. La shell è una **convenzione di risposta dopo i gate**, non un overlay UI nativo persistente. Non è garantita in tutti i futuri turni di tutte le piattaforme.
