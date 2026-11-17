/** C139 EDU policy-facing entrypoint; behavior delegated to the shared closed-route core.
 * C139's epistemic policy retains independent authority over route qualification.
 */
import {executeVersionedEduTurn,inspectVersionedEduLedger} from './versioned-edu-turn-core.mjs';
export {preflightC107Shape} from './versioned-edu-turn-core.mjs';
export function inspectC107Ledger(file){return inspectVersionedEduLedger(file,'C139');}
export function executeC139EpistemicTurn(args={}){return executeVersionedEduTurn('C139',args);}
