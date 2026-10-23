# Flows

First visit → main task → coming back. Routes: `/` the landing page signed out and My trips signed in, `/sign-in` and `/sign-up`, `/trips/new` New trip, `/trips/[id]` Packing list.

```mermaid
flowchart TD
  subgraph first["First visit"]
    direction TB
    A1(["Open Pack Again"]) --> A2["Packing lists for trips you repeat<br/>Sign up · Sign in"]
    A2 -- "Sign up or sign in" --> A3{"First sign-in?"}
    A3 -- "Yes" --> A4["3 starter trips, made once<br/>nothing asked first"]
    A3 -- "No" --> A6
    A4 --> A6["My trips<br/>ticket cards, newest first"]
    A6 -. "Can't load" .-> A5["We couldn't load your trips<br/>Try again"]
  end

  subgraph main["Main task"]
    direction TB
    B1["My trips"] -- "Open a card" --> B3["Packing list<br/>list, with the weather beside it"]
    B1 -- "New trip" --> B2["Trip name, with a live ticket<br/>empty · duplicate · too long"]
    B2 -- "Create trip" --> B3
    B3 -- "Add item" --> B4["Added X to Section<br/>or an error under the field"]
    B4 --> B3
    B3 -- "Remove" --> B5["Removed X · Undo<br/>for 3 s after you move away"]
    B5 --> B3
    B3 -- "Tick every item" --> B6["All packed. Have a good trip."]
    B6 -- "Forgot something?" --> B7["Saved as packed and New,<br/>for next time"]
    B3 -- "Destination" --> W1["Places found<br/>or No places match"]
    W1 -- "Choose a place" --> W2["Next 7 days and<br/>Pack for this weather"]
    W2 -- "Add a tip" --> B4
    B3 -- "Trip options" --> B10["Rename trip, in place<br/>same checks as New trip"]
    B10 --> B3
    B3 -- "Trip options" --> B11{"Delete X and<br/>its items?"}
    B11 -- "Cancel" --> B3
    B11 -- "Delete trip" --> B12["My trips<br/>Deleted X"]
    B8(["Old link, or someone else's"]) --> B9["Trip not found<br/>Back to My trips"]
  end

  subgraph back["Coming back"]
    direction TB
    C1(["Sign in, on any device"]) --> C2["My trips<br/>Last packed · N added for next trip"]
    C2 -- "After 2+ days away" --> C3["Welcome back.<br/>N trips ready to pack again."]
    C2 -- "Forgot something? Add it" --> C7["List opens with<br/>Add item focused"]
    C2 -- "Open the list" --> C4{"Packed over 2 days ago<br/>and still ticked?"}
    C4 -- "Yes" --> C5["Packing for a new trip?<br/>Clear all ticks · Keep them"]
    C4 -- "No" --> C8["The list as you left it,<br/>with today's forecast"]
    C5 -- "Clear all ticks" --> C6["Ready to pack again<br/>New items listed first"]
    C5 -- "Keep them" --> C8
  end

  %% Invisible links stack the three flows top to bottom.
  first ~~~ main
  main ~~~ back
```

## Notes

- Signed out, `/` is the landing page and every page but sign-in and sign-up goes to sign-in, then back.
- Starter trips are made once per account, on its first sign-in, together with the profile that records it. Deleting every trip later shows "No trips yet" with "Add the starter trips back", not the starters again.
- Trips load once when a tab opens, and changes save one after another. Ticks, removals and clearing show straight away and save in the background; one that doesn't save comes off the screen again, and the bar says "Not saved". New trips, names, items and destinations save first, so a form keeps what you typed if saving fails. Another tab or device shows a change the next time it loads.
- An item added from "Forgot something?" is saved as already packed, so the list stays "All packed" for the trip you just took. It stays New until the next trip is packed: after the ticks are cleared, not when items are re-ticked within the same trip.
- The "new trip?" prompt depends on today's date, so it is decided only after the page mounts.
- The Add item section starts on the last section picked on that page (not stored).
- Removing an item is immediate. A "Removed X · Undo" row takes its place, with Undo focused; the bar repeats it. Both go 3 seconds after you move away from them (hovering or keyboard focus keeps them), or at the next change. If Undo had focus, focus moves to the next item.
- Trip options, beside the trip's name, holds Rename trip and Delete trip. Each opens in place above the list, never as a modal. Escape or Cancel closes them and returns focus to Trip options. Deleting goes back to My trips, which says "Deleted X" with focus on it.
- Everything about the destination is in the weather zone: Change and Remove, today's summary, the next 7 days, "Pack for this weather" and the credit to Open-Meteo. On wider screens it sits beside the list and stays in view; on a phone it's one block at the top, closed each time the page opens.
- The browser fetches the forecast and keeps it in the tab for 30 minutes; it caches place searches for a day. Only the destination is saved.
