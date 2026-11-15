# C136 — Recupero manuale prima dell'avvio canonico

**Per chi utilizza iKant:** se tre tentativi tecnici distinti sono falliti senza effetti collaterali possibili, si possono fornire manualmente gli otto file originali necessari all'avvio. Il programma confronta ogni file con la versione che il repository richiede e lo copia in uno spazio isolato. **Non dichiara iKant attivo** soltanto perché i file corrispondono.

## P0 incluso nello stesso intervento
Il merge della PR #133 (`35c144524e79f581980bb44ee04dc9fff0c4c10a`) ha **32 controlli GitHub riusciti su 32**. Lo stato C135 e' stato allineato nel reticolo. Il file `contracts/c136-p0-post133.json` contiene i riferimenti esatti ai 32 job.

## Chi possiede che cosa

- **Controllo canonico originale (C59):** rimane `src/bootstrap-semantic.mjs#validateCanonicalCompositionHandoff`; non modificato e non raggirato.
- **Sorgente canonica originale:** descrittore e controllo in `src/runtime-root-verified.mjs`, senza cambio di byte o pin.
- **Nuovo adattatore C136:** verifica fino a 3 fallimenti macchina reali e distinti, senza esito incerto; ispeziona la cartella manuale con `O_NOFOLLOW`, doppia lettura dello stesso inode, Git SHA-1 degli 8 blob, costruisce staging atomico e rilegge tutto.
- **Attivazione canonica:** richiede ancora ingresso nativo, Termini, consenso, fonte esatta e stato originale; un permesso manuale C136 **non** vale come composizione C59.

## DoD, metriche e checklist

| Gate | Positivo | Negativo |
|---|---|---|
| P0 post #133 | 32/32 controlli sullo stesso SHA | Nessuna release automatica |
| Tentativi | 3 canali macchina diversi, esiti definitivi e senza side-effect | UNKNOWN, timeout ambiguo, duplicato, quarto canale o prova mancante = STOP |
| Byte | 8 oggetti dichiarati dal descrittore canonico originale; due letture sullo stesso inode; hash Git esatti | Symlink, path alterato, byte diverso o oggetto mancante = STOP |
| Staging | Cartella nuova, scrittura esclusiva e rilettura | Nessuna sovrascrittura della destinazione precedente |
| Autorita' | Validatore originale C59 rifiuta la ricevuta manuale come native handoff | Non esistono dichiarazioni false di ACTIVE |
| Regressione | 5 test C136 + 21 legacy C59/C43; 10.000 mutazioni respinte | Nessun indebolimento dei pin originali |
| CI | Tutti i controlli richiesti sul commit proposto | Se CI non termina, non dichiarare DoD completa |

## Limite deliberato

Un evento macchina segnato dall'HOST resta un'osservazione HOST, non una prova nativa autenticata. C136 permette il recupero **dei byte**, non l'attivazione canonica autonoma. Per far attraversare l'intero kernel canonico a un manual handoff come modalità nativa occorrerebbe una nuova sorgente/pin e una prova effettiva dell'owner di ammissione. Questo lavoro non viene falsamente accreditato a C136.

**Reticolo:** C136 e valutazione linguistica C137 sono indipendenti; C138 separa rilascio EDU da rilascio CANONICAL nativo.
