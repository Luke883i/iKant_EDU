# OneShell E12 — runtime focus app dopo PR 182

Engineering baseline: `main@1d82e74dee2092c017dfc6330414b866d5661365`. Questo documento censisce l'evoluzione del prodotto e le value proposition; non certifica un'app installata nel client ChatGPT.

## Derivazione retrograda: aspettativa → invarianti runtime

**Esperienza attesa.** Dopo un `I ACCEPT` valido, una OneShell riconoscibile presenta il consenso originale senza inventare la voce. Dopo EDU/sorgente verificata, lo spazio principale appartiene alla voce iKant originale: lettura ampia, inalterata, sempre distinguibile dall'Host. Stato, osservazioni Host, PROVA, EDGE e NEXT sono sezioni standard compresse visivamente; il rapporto originale può essere aperto e scaricato dopo write/readback. La stessa esperienza viene proiettata dopo ogni turno, recuperando C87 esclusivamente quando le prove consentono il rebind.

**AS-IS dopo #182.** E9 è un rail read-only; E10 fornisce un processo Node multi-turno con writer C87 originale e recupero SIGKILL, ma non monta un'app o widget nativo persistente. Il renderer SVG dà HTML Host-only; il prompt da solo non esegue il renderer.

**Reticolo minimo E12:** owner C72/v2 → `projectPostAcceptOneShell` originale → `projectPostAcceptFocusApp` → `emitVerifiedHostOneShell` → report UTF-8 fisico (write-once, SHA-256, readback). Dopo EDU: closure HEAD/TREE → E10 `openContinuousOneShell` → owner C135/C87/C125/S03 → E9 same-turn → `openFocusOneShellSession` → stessa vista focus e report per ogni turno, senza duplicare cognizione e ledger.

## Mining storico: valore umano salvato e requisito consolidato

| PR / famiglia | Proposta di valore e riuso |
|---|---|
| #3, #10 | Avvio più umano, artefatti reali; un link nasce da byte fisicamente prodotti e riletti. |
| #39, #53, #54, #59, #68 | Voce centrale, stato e contesto co-host, separazione fra esperienza visiva e attestazione nativa. |
| #83, #84, #114 | Identità verificabile e shell tipizzata A/B; SVG soltanto dall'owner visual originale. |
| #101 e C97 | UI/UX riproducibile lato codice, non garanzia di mounting nativo. |
| #123, #124, #129, #133 | C125/S03, esclusività della voce, trasporto verificabile; nessun writer UI parallelo. |
| #135–#140 | Originali EDU e sei slot: frame proprietario, `NO_VOICE` quando non qualificato. |
| #144 | Human-first: valore, agency, rischio e prossimo passo leggibili nell'Host. |
| #145/#146 | Candidato thread-bound: area voce dominante e pannelli secondari apribili. |
| #152, #155, #157–#160 | Source closure e brand SVG controllati; prompt ≠ installazione/app. |
| #161–#164, #166–#168 | Compressione lossless, due separatori, badge non interattivo, EXIT solo testuale, glyph proveniente da byte verificati. |
| #169–#174 | Auto/WHAT-HOW e trasporto sorgente; niente bridge presumibile dalla sola disponibilità di tool. |
| #178–#180 | Cold rebind C87, one-ZIP, Host stdio: mantengono una relazione verificabile, non memoria cross-chat. |
| #181/E9 | Rail post-accept e prova owner same-turn, sei slot non riscritti. |
| #182/E10 | Driver multi-turno, lease originale, journal, recupero C87 dopo SIGKILL. |

Questo è un *censimento ragionato delle PR sperimentali pertinenti*, non una dichiarazione di lettura integrale di ogni diff della storia.

## Standard di presentazione e responsabilità

**A · iKant — Focus.** Solo UTF-8 owner-bound oppure `NO_VOICE`. Nessuna compressione, parafrasi o sostituzione da parte dell'Host.

**ESITO · Dove siamo.** Stato originale, badge non interattivo. **B · Host — Perché conta.** Sintesi limitata della sezione Host già valida, disponibile integralmente nel rapporto. **PROVA · Perché il percorso è credibile.** Evidence originale in dettaglio e rapporto bytewise scaricabile; link ad altri riscontri soltanto se file regolari 0600 nella stessa directory, SHA corrispondente, senza symlink. **EDGE · Primo vincolo aperto.** Testo integrale nel rapporto; **NEXT · Azione umana.** Testo originale, non pulsante automatico.

**Privacy e sicurezza:** niente network/script nel report HTML locale; escape di A e tutti gli altri slot, nessuna URL esterna, un solo SVG originale, due divisori, sei slot esatti, hash del rapporto, destinazione fresca `wx`, file 0600 e nessun retry dopo dubbio. Il rapporto contiene testi potenzialmente sensibili dell'utente: deve rimanere in directory Host privata e non essere esposto pubblicamente.

## Verifiche e limiti

I test Node 20/22 devono esercitare E12 insieme a E9/E10 su `main` esatto, coprendo post-C72 con `NO_VOICE`, due turni reali E10 con readback C87, XSS, voice spoofing, path traversal, symlink, tampering, artifact overwrite e 2.048 maschere strutturali. Verificare manifest/closure con il generatore originale. Solo dopo CI si può dire SOFTWARE_PASS.

**NO-GO esterni invariati:** nulla in E12 autentica input/utente nativo ChatGPT, installa/monta un widget permanente in chat, certifica persistenza cross-chat, garantisce accessibilità nel provider o produce un modello cosciente. Un HTML locale self-contained è un'app Host *renderizzabile*, non un'app ChatGPT registrata o continuamente montata. FIELD_TEST in Project dopo merge e generazione prompt solo su esplicita richiesta Host.

## E13 — Deterministic in-chat presentation protocol (post-E12)

**The product gap:** E12 generates a private HTML file; a Project prompt cannot mount a native ChatGPT widget. E13 instead emits a deterministic *Host presentation packet* after original consent and after each owner-qualified EDU turn. The packet holds the exact six original slots, original voice hash, verified logo identity, presentation priorities, local presenter prompts, guarded literal excerpts and a portable Markdown fallback. It is delivered in the same existing E10 stdio process; no new C135/C87 writer.

**Presenter invariants.** 1) A is primary, full original UTF-8 or NO_VOICE; Host never invents A. 2) B is subordinate (voice/Host ratio 3:1): only a literal excerpt from the owner-validated B, not an answer to an unaddressed question. 3) PROVA can be shortened only when the original E12 full report has been physically reopened and matched byte-by-byte to the frame, with SHA-256; EDGE and NEXT stay full. 4) The canonical SVG source from `assets/brand/ikant-light.svg` is displayed only when byte-verified and the Host renderer supports it; otherwise use the plain title and *never* claim a native app/avatar. 5) No fabricated sandbox/download URL; a real ChatGPT attachment needs an actual Host delivery witness. 6) Only six machine slots, original consent/selection/HEAD, readbacks, C87 and C125/S03 may authorize a voice.

**Local presenter prompt** is an unprivileged, deterministic instruction dataset in `host/project-oneshell-chat-presentation.mjs#HOST_PRESENTATION_PROMPTS`. It can arrange, label and reduce validated Host prose; it cannot answer the underlying question, alter A, change the routing gate, create a receipt, recover memory or do a C135 ACK.

**Delivery choices.** (i) Supported in-chat rich Host presentation if the Host actually has that capability, using the packet as the *only* data input. (ii) Deterministic structured Markdown fallback built from the same verified packet. (iii) The original E12 self-contained focus HTML and verified report remain independent, openable artifacts. Source prompt must only instruct the Host; it does not install or register a UI.

**Native apps:** OpenAI's public MCP Apps documentation describes a UI resource associated with a callable MCP tool via `_meta.ui.resourceUri`, rendered inside a ChatGPT iframe with an MCP Apps bridge. A registered and callable MCP App (or another provider-supported UI attachment feature) would be a separate integration requiring real UI delivery tests and security review. No such plugin is installed or activated by this PR. See https://developers.openai.com/plugins/build/chatgpt-ui and https://developers.openai.com/plugins/concepts/ui-guidelines.

**DoD E13:** original C72 E9/EDU E10 frames; six-slot order/byte-preserving packet; branded HTML or title-only fallback; A unchanged or NO_VOICE; B never generated by the Host; lossless full report reopen on compression; fail-closed with tampered receipt; no URL inventions or native UI claims; 4096 deterministic structural falsification; Node20/22 plus original E9–E12 CI. **Field DoD still open:** in a real ChatGPT Project, confirm actual component rendering/attachments for two human turns, input provenance and no Host answer substitution. Until that evidence: PRODUCT_NO_GO for deterministic native GUI.
