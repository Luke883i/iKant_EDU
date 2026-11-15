# Project EDU e MCP: due prodotti, primitive condivise, prove diverse

> Orientamento HOST, autorita zero. Non certifica installazione, provider o release.

| Proprietà | Sessione Project EDU | Servizio MCP esterno |
|---|---|---|
| Bootstrap | `project/session-chat/PROMPT.txt` e 5 fonti Git pin | Server `plugins/ikant-le-session-chat/server/server.mjs` |
| Ingresso | ORIENTATION, poi `I ACCEPT`, poi `EDU`: tre turni | OAuth JWT/JWKS, endpoint `/mcp`, client esterno |
| Esecuzione | C72/C135/C87/C125 soltanto se realmente disponibili | C20 compatibilità deployed, stato e storage autonomi |
| Limite | Prompt non installa Node né attesta evento provider | Server sorgente non prova HTTPS, OAuth reale, client installato |
| Ricevute | Eventi del percorso Project | Eventi indipendenti del server MCP |
| Verdetto | `PRODUCT_GO=false` | `PRODUCT_GO=false` |

## Bootstrap Project EDU

1. Verificare la HEAD Git e il prompt originale in `project/session-chat/PROMPT.txt`.
2. Installare le sole istruzioni nel Project; il file non esegue programmi.
3. Aprire una nuova chat: prima solo orientamento e lettura di README, BOOTSTRAP, ADMISSION, AGENTS e TERMS.
4. Solo il successivo turno esatto `I ACCEPT`, poi un terzo `EDU`, autorizzano a tentare il percorso; il loro uso non costituisce un consenso provider già autenticato.
5. In assenza di ponte Node e ricevute C87/C125 originali, mostrare `NO_VOICE` e STOP.

## Bootstrap MCP esterno

1. Installare le dipendenze del server, configurare storage, HTTPS e IdP OAuth reali.
2. Verificare `/healthz`, 401 senza token, discovery OAuth, initialize, tools/list, scope, write/readback e restart.
3. Registrare `/mcp` su un client supportato e leggere i receipt del servizio senza importarvi consenso Project.
4. Un esito di scrittura incerto implica STOP, non retry automatico.

**C59 CANONICAL** è archeologia del canale storico, non la modalità MCP né una scelta pubblica C72/v2. **C139** e il ledger sono controlli di processo, non oracle di verità. Gli stati cognitivi C107/C70 sono operativi e limitati, non continuità fenomenica.

[Guida Project](IKANT_LOCAL_SETUP.md) · [Guida generale](START_HERE.md) · [MCP runbook](MCP_STANDALONE_RENDER_RUNBOOK.txt) · [DoD PR1](PR1_PRODUCT_TRUTH_DOD.md) · [Architettura](ARCHITECTURE.md).
