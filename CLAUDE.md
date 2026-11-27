# Video editing — client preferences (Naja'a / takaful & AIA sharing videos)

These are standing preferences from the owner of this repo. Follow them for every new video edit.

## Non-negotiables
- **The HOOK is the most important part.** Open strong: kinetic text synced to the spoken words, emotion-matched effects
  (e.g. panic → shock lines, "!!", sweat drops, siren, ECG spike, glitch, camera shake, punch-in) and punchy SFX
  ("shocked" stab, bass hit, heartbeat, whoosh). Send a short hook sample (first ~8 s, 1080p) for approval before the full render.
- **The face must look beautiful.** Bright, clean lighting with bright skin — **never dull/"kusam" lighting** for takaful
  sharing videos. Approved look: `edit-player-select/grade.py` → `RefGrade` with `grade_ref_lut.npy`
  (very bright, cool clean whites, soft highlight glow, whiter skin, vivid red, no vignette). Rejected: desaturated
  "premium neutral" grades and anything that darkens the frame.
- **Footage the client already graded** (e.g. a DJI Mimo export, `dji_export_*`): **"No grading" = don't change the
  video's colours at all.** Even a faithful HLG → SDR conversion looked "too bright" to her, so render in **HDR passthrough**:
  `HDR_SRC=<original .mov> python3 compose.py …` (`edit-gl-decline/compose.py`) keeps the original HLG/BT.2020 code
  values, converts only the graphics to HLG (SDR white → 75 %), and encodes HEVC Main10 HLG (`hvc1`).
  Ask or check the filename when unsure whether a clip is pre-graded.

## Workflow
1. Transcribe (faster-whisper large-v3; use VAD + `condition_on_previous_text=False` if it hallucinates).
2. Cut to the requested length: remove awkward pauses, retakes and repeated sentences; QA every splice by re-transcribing.
3. Plan graphics/SFX from the transcript, then **720p preview → wait for approval → final 1080p**.
   When only the look changes, send a short sample clip instead of a full re-render.
4. Keep moments the client asks to keep (e.g. pulling the camera closer on "Yang pertama").

## Style
- Fonts: Plus Jakarta Sans + Instrument Serif (the AIA-rider video look). No pixel/game fonts.
- Infographics should feel lively: chat mock-ups, picture-in-picture flows, ✕/✓ comparisons, animated timers/counters.
- Captions: word-by-word, bold, strong dark shadow so they stay readable on bright footage.
- Audio: clean background noise with RNNoise (`bd.rnnn`). Music and SFX must be original/synthesised so they are safe on
  IG/TikTok. Never use copyrighted music or the CapCut built-in sounds.
- Always put a **soft background song** under the video (melodic piano/Rhodes, light rhythm: `edit-gl-decline/music_soft.py`)
  and make sure it is actually audible: about 10–12 dB under the voice, not 20 dB (`mix.py` base_db ≈ -2, duck ≈ -7).
- Kinetic text: write English words in English (e.g. **"ACCIDENT!"**, not "AKSIDEN"), including in the captions.

## Platform safety (IG/TikTok)
- Avoid violent words/icons (e.g. "tikam"), references to real people's cases, and labels like "narsistik".
- No "dijamin"/guaranteed claims; mark example RM figures with * and a "tertakluk pada terma & syarat" note.

## Name / branding
- Name tag: just **"Amalina Ilias"** — no "AIA ADVISOR", no company or job title. Videos are shared publicly and the
  client wants other agents and clients to repost them, so keep branding neutral.
- Don't put a name on other people until the client confirms their name.
