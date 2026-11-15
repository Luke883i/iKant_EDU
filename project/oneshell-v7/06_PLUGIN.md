# Adapter plugin: sorgente nello ZIP ≠ installazione ChatGPT

Il bundle include `plugin_source/plugins/ikant-le-session-chat/**` con i byte originali della sorgente del plugin, manifest, server, gateway e UI. Sono **file**, non funzioni callable nella chat; non vengono automaticamente eseguiti, collegati, distribuiti, autenticati o abilitati dal Project. I loro import relativi dipendono dal repository Node originale di `main`.

## Processo esterno corretto
1. Qualificare il server Node originale e il lock della sorgente. Non avviare codice da uno ZIP come effetto dell'ammissione testuale.
2. Installare dipendenze server, attivare credenziali/segreti fuori chat, applicare TLS valido, autenticazione OAuth/utente, autorizzazione e isolamento. Il solo bearer-gateway dimostra trasporto, NON identità nativa provider.
3. Registrare l'endpoint MCP nel workspace ChatGPT con un'azione umana esplicita e le autorizzazioni necessarie; verificare Scan Tools e reale disponibilità dei tool.
4. Eseguire tre chiamate reali indipendenti e leggere le ricevute owner. Un elenco tool non crea CANONICAL ACTIVE.
5. Per CANONICAL richiedere C59 original owner, evento provider autentico, nonce/input identici, writer C87 unico, rilettura DOCX, delivery. Per `UNKNOWN` STOP e riconciliazione.

**Il Project non è un bootstrap manager:** prompt e ZIP possono soltanto determinare quale percorso scegliere e come rappresentarne le prove. Se MCP non è callable, mostra EDU locale quando possibile, altrimenti risposta HOST con A=NO_VOICE.

**Shell app:** l’HTML plugin incluso nello ZIP usa sei aree dedicate. Il server deriva la proiezione dalla ricevuta owner esistente: A resta NO_VOICE se manca una prova del medesimo turno. La finestra è mantenuta durante il ciclo di vita della app registrata, ma il solo ZIP non rende una finestra ChatGPT permanente.
