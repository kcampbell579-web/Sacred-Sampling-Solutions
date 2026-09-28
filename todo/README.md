# Lamplight

Two personal tools. Each is one HTML file — no build step, no server, no account.
Open the file in a browser and it works. Everything is stored in that browser's
local storage; nothing is sent anywhere.

| File | What it is |
| --- | --- |
| `index.html` | **Lamplight** — a capture-first to-do list |
| `calendar.html` | **Lamplight Calendar** — a click-to-add month calendar that prints |

They share one visual system but are independent; neither needs the other.

---

# Lamplight — the to-do list

## The idea

Getting things out of your head is the hard part, so the capture box is the first
thing on the page and takes focus on load. Everything else is sorting, which is
easier once it's written down.

Three lists, by when — not by project:

| List | For |
| --- | --- |
| **Today** | On the hook right now |
| **Next** | Soon, but not today |
| **Someday** | Parked, not forgotten |

Finished items drop into a **Done** drawer at the bottom.

## Capture syntax

Type it inline; the tokens are stripped from the saved text.

| Token | Does |
| --- | --- |
| `#work` | Tags the item (tags become filter chips) |
| `~fri` | Sets a due date |
| `!` | Stars it |
| `>next` | Files it straight into another list (`>t`, `>n`, `>s` also work) |

Due dates accept `today`, `tom`, any weekday (`mon`…`sun`), `+3d`, `+2w`,
`2026-09-14`, and `9/14`.

Paste a multi-line list and every line becomes its own item — leading `-`, `*`
and `1.` bullets are stripped.

## Keyboard

| Key | Does |
| --- | --- |
| `n` | Jump to the capture box |
| `/` | Jump to the filter box |
| `Enter` | Add (`Shift`+`Enter` for a new line) |
| `Esc` | Clear the filter, or stop editing |
| `Alt`+`↑`/`↓` | Move the focused item up or down |

Click an item's text to edit it in place. Drag the grip to reorder, or drop an
item into another list. Empty the text of an item to delete it.

## Your data

Everything lives in `localStorage` under the key `lamplight.v1`, per browser.

- **Export** writes a JSON file. In a browser it downloads; in an embedded view
  that blocks downloads it offers the JSON to copy instead.
- **Import** takes that file (or pasted JSON) and either merges it into what you
  have — matching on item id, so re-importing is safe — or replaces everything.

That is also how you move a list between devices.

If local storage is unavailable (a private window, or an embedded view that
blocks it), the app still runs and says so in the footer — export before you
close the tab.

## Browser support

Any current browser. No dependencies; the only network request is the Google
Fonts stylesheet, and there are real fallback stacks if it doesn't load.

---

# Lamplight Calendar

`calendar.html`. A month grid where scheduling something takes one click and one
line of typing.

## Adding

Click any day. It's selected, and the cursor lands in the add field below the
grid — type what's happening, optionally set a time, press Enter. The cursor
stays put so you can keep going.

Everything below the grid is live: change a title or a time and it updates as you
type. Click the round swatch to cycle an event's colour (five, for sorting by eye).
Clearing an event's title deletes it, as does the × on its row.

Clicking a day in a greyed adjacent month jumps to that month.

| Key | Does |
| --- | --- |
| `←` / `→` | Previous / next month |
| `T` | Back to today |
| `P` | Print |

## Printing and PDF

Two routes, because embedded views sometimes block one of them:

- **Print** opens the browser's print dialog, where every OS offers *Save as PDF*.
  The print stylesheet drops the buttons and panel, prints the grid in landscape
  black-on-white with **every** event shown (no "+2 more"), and adds a
  three-column agenda of the whole month underneath.
- **PDF** writes the PDF directly — a grid page plus agenda pages, in Helvetica
  with colour dots — without going near the print dialog. Use this one if Print
  is unavailable.

## Your data

`localStorage`, key `lamplight.cal.v1`. Export and Import work exactly as they do
in the to-do list, and the two tools keep separate files.
