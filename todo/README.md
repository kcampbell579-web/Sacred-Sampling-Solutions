# Lamplight

A capture-first personal to-do list. One HTML file — no build step, no server, no account.

Open `index.html` in a browser and it works. Your list is stored in that browser's
local storage; nothing is sent anywhere.

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
