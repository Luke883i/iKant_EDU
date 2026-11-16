# iKant_EDU — App MCP esterna (compatibilita C20)

**Tipo di prodotto:** server MCP HTTP autonomo, non l'ingresso EDU del ChatGPT Project. Usa primitive condivise del repository, ma possiede deployment, autorizzazione e sessione propri. Non crea C72/v2, non realizza l'owner storico C59 CANONICAL, non prova `ACTIVE` canonico e non rende automaticamente un plugin disponibile in ChatGPT.

## Quale profilo stai installando?

| Profilo | Stato | Guardie principali | Limite |
|---|---|---|---|
| **standalone OAuth** | Candidato per server pubblico | `IKANT_MCP_DEPLOYMENT_PROFILE=standalone`; `IKANT_MCP_AUTH_MODE=oauth`; issuer/JWKS/resource HTTPS, scope `ikant:connect` e `ikant:write`; persistenza durevole | IdP, HTTPS, volume e collegamento ChatGPT devono essere provati esternamente. |
| **legacy gateway** | Riferimento locale/storico C58/C20 | Gateway identity / nonce, `ensureSessionChatDeployment`, `open`, `accept`, `turn`; client/host attendibile | Non e un percorso di distribuzione standalone qualificato, ne C59 CANONICAL. |

La superficie offre `ikant_le_open` come tool model-visible; i turni di accettazione e le scritture sono app-only e soggetti a controlli di scope. Lo stato della sessione, i receipt e la provenienza non possono essere dedotti dalla sola descrizione dello strumento.

## Verifica locale prima di qualsiasi deployment

Dal root del repository intenzionalmente pin-nato:

```bash
npm run check:mcp
node --test tests/mcp-standalone-runtime-assurance.test.mjs tests/s06-mcp-transport-security.test.mjs
npm run check
```

L'E2E HTTP su un server reale in laboratorio e in `tests/mcp-standalone-http-qualification.probe.mjs`; richiede le dipendenze SDK del server, OpenSSL e un IdP TLS **sintetico**, non collegamento a ChatGPT. Seguire il [runbook standalone](../../docs/MCP_STANDALONE_RENDER_RUNBOOK.txt) per i prerequisiti di ambiente, sicurezza, storage, rilascio e qualificazione. `npm run check` verifica il software locale, non un health check remoto.

## Uso in ChatGPT: non confondere distribuzione e connessione

1. Distribuisci il **repository intero** sul server Node, con HTTPS, disco durevole e IdP OAuth reale; non basta copiare `server.mjs`.
2. Verifica `/healthz`, discovery `/.well-known/oauth-protected-resource/mcp`, `401` senza bearer token, handshake, `tools/list`, scope di scrittura e readback dopo restart; conserva prove contro la revisione esatta.
3. Connetti `/mcp` nella schermata di configurazione custom MCP del client che effettivamente usi. L'esistenza del server non attesta questa azione; controlla il flusso OAuth reale, la sessione e il primo tool call osservato.
4. Se un write puo essere avvenuto ma la risposta e incerta, **STOP e riconcilia in sola lettura**; nessun retry cieco.

## Distinzione dalla sessione-chat EDU

L'altro prodotto usa `project/session-chat/PROMPT.txt` e i tre gate ORIENTATION → `I ACCEPT` → `EDU`, con owner C72/C135/C87/C125 soltanto quando invocabili. L'app MCP non e un fallback del Project e non ne riusa il consenso. [Tabella di tracciabilita e limiti](../../docs/I10_TWO_PRODUCTS.md) · [guida Project](../../docs/IKANT_LOCAL_SETUP.md).

**Epistemic status:** `SOURCE_PRESENT`; `LOCAL_TESTS_SCOPED`; `PROVIDER_NATIVE_NOT_ATTESTED`; `PRODUCT_GO=false`.

**Compatibilita test C57:** Only `ikant_le_open` is model-visible. Acceptance and substantive ACTIVE turns are app-only. Questa frase descrive il vecchio profilo di compatibilita deployed, **non** un'asserzione di ACTIVE canonico o di installazione nativa.
