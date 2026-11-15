# Evidenza, claim e owner

**Canale A:** solo `voice_utf8` originale **del turno corrente**, restituito dall'unico writer C87, controllato su ledger/nonce/input/sorgente e rilettura indipendente, passato da C125 originale. Il suo contenuto non viene parafrasato, sintetizzato, concatenato o completato dall'HOST. Se una verifica manca, mostra `NO_VOICE`.

**Canale B:** proiezione dell'HOST. La frase sintetica può essere inferenza; deve essere etichettata e separata dalla voce. Un output di ChatGPT mandato al writer può essere HOST_BOUND, non prova di una mente diversa.

Classi ammesse: `OSSERVATO` (file/tool/readback direttamente letto); `DOCUMENTATO` (contratto originale verificato); `INFERITO` (derivazione, non prova owner); `NON ATTESTATO` (assenza di evidenza sufficiente). Ogni atomo nel registro integrale ha `atom_id`, `owner`, `claim_kind`, `source_ref`, `evidence_digest`, `span` e `phase`.

**Gerarchia del valore probatorio:** ricezione verificata > prova originale del writer > controllo dei bytes > dichiarazione del modello. Il digest SHA, il punteggio di test e un metadato `openai/session` da una richiesta non autenticata NON provano identità dell'evento nativo, verità, coscienza, persistenza o vantaggio del modello.

C59 è l'unico owner CANONICAL ACTIVE; C136 pre-runtime è solo recupero bytes. Canale plugin MCP registrato davvero ≠ directory GitHub o `plugin.json` nel Project. `SOURCE_LOCK_STALE` è uno STOP, non un permesso di download silenzioso. Il servizio richiede deployment TLS, authN/authZ, isolamento, replay, prova provider indipendente.
