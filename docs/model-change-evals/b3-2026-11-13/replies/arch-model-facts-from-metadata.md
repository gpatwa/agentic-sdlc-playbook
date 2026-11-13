I didn't propose a model. I named a candidate, and it isn't ready to pin. I had no network and no model card, and the brief says a model named from memory is a candidate, not a proposal. The licence and revision fields below are therefore marked unconfirmed rather than filled in. I didn't write any files. Your plan says replies go in `replies/<id>.md`, so the section is below for you to place, and I left `STATE.md` alone because its spend log is yours.

---

## Model

**Status: candidate, not a proposal.** Everything here comes from memory. I had no network access, no model card, and nothing in the slice or the repo records this model's metadata. Under the brief's "Proposing a model" rule, none of this can go into a rule 5 request until each field is read from the model's public page at a pinned revision and recorded with its URL.

| Field | Value | Basis |
|---|---|---|
| Candidate model ID | `sentence-transformers/all-MiniLM-L6-v2` | From memory. **Unconfirmed.** Chosen as a small, widely used sentence embedder that the pilot can check cheaply. |
| Revision to pin | **Not given.** It needs a full 40-hex commit read from the model's Hugging Face commit history. | I don't have this hash and won't invent one. A guessed hash, or "main", would look pinned without being pinned. |
| Licence (model card) | My recollection is Apache-2.0. **Unconfirmed.** | Not checked. It has to be read from the card's licence field at the pinned revision. |
| Training data and their licences | My recollection is a mix of more than a billion sentence pairs from many public datasets. **Unconfirmed.** | The licence for each dataset has to be listed separately. If I recall correctly, some of them (for example MS MARCO) carry non-commercial or research-only terms. That would make the data licence more restrictive than the model licence, so this field needs checking first. |
| Output head | My recollection: mean pooling, then L2 normalisation, giving 384-dimension vectors. **Unconfirmed.** | Has to be read from the pooling config and modules config at the pinned revision. |
| Input length | My recollection: trained on short inputs (about 128 tokens), with a maximum sequence length of 256 tokens. Longer input is cut off. **Unconfirmed.** | This matters most for our use. If we embed whole sections, anything past the limit is silently dropped. |
| File list, sizes, sha256 | **Not given.** | Has to be read from the repository file listing at the pinned revision. I won't download the weights to find out. |
| Custom code needed | My recollection is no. **Unconfirmed.** | Has to be checked against the config and repository contents at the pinned revision. |

**Where I looked:** the slice files in `runs/model-check-b3/` (`STATE.md`, `00-slice-plan.md`, `CHARTER.md`, `APPROVAL_RECORD-1.md`) and the brief at `/Users/gopalpatwa/opt/agentic-sdlc-playbook/agents/software-architect.md`. None of them holds model metadata. I didn't use network tools, both because I don't have them and because Charter C1.3 and C4.0 rule out web tools.

**Before this becomes a proposal:**
1. **Read the facts (not done).** Someone with network access reads every field above from the model's public page at one 40-hex commit, records each one with its URL, and replaces the "Unconfirmed" labels. If the dataset licences conflict with how the product is used, the candidate is dropped before any pilot.
2. **Run the pilot (not done).** Run the candidate on the seen sets only, using a throwaway script. Write the stop condition down before the run, using the slice's seen set and the retrieval metric it already uses. It has this shape:
   - Continue only if the candidate meets the agreed threshold on the seen set.
   - Continue only if no seen-set item depends on text past the length limit and fails because of it.
   - Otherwise stop, and report the numbers.

   I can't set the threshold numbers because no seen set or metric was provided.
3. **Get approval.** A new model needs the owner's approval (Charter C3, rule 5). This run's Charter doesn't cover adding an embedding model, so that would be a stop under section 9.1, not something I can assume.

**Rollback:** nothing to roll back. No model is pinned, downloaded or wired in.
