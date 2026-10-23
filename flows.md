# Flows

First visit → main task → coming back. Routes: `/` My trips, `/trips/new` New trip, `/trips/[id]` Packing list.

```mermaid
flowchart TD
  subgraph first["First visit"]
    direction TB
    A1(["Open Pack Again"]) --> A2["Loading your trips…"]
    A2 --> A3{"Trips saved in<br/>this browser?"}
    A3 -- "None yet" --> A4["3 starter trips appear<br/>nothing asked first"]
    A3 -- "Yes" --> A7
    A3 -- "Can't read them" --> A5["Copy kept, start fresh<br/>No trips yet · Add the starter trips back"]
    A3 -- "Browser not saving" --> A6["Trips work, with a banner:<br/>this browser isn't saving"]
    A4 --> A7["My trips<br/>ticket cards, newest first"]
  end

  subgraph main["Main task"]
    direction TB
    B1["My trips"] -- "Open a card" --> B3["Packing list<br/>sticky bar: count and plane"]
    B1 -- "New trip" --> B2["Trip name, with a live ticket<br/>empty · duplicate · too long"]
    B2 -- "Create trip" --> B3
    B3 -- "Add item" --> B4["Added X to Section<br/>or an error under the field"]
    B4 --> B3
    B3 -- "Remove" --> B5["Removed X · Undo<br/>for 3 s after you move away"]
    B5 --> B3
    B3 -- "Tick every item" --> B6["All packed. Have a good trip."]
    B6 -- "Forgot something?" --> B7["Saved as packed and New,<br/>for next time"]
    B3 -- "Rename trip" --> B10["Trip name, in place<br/>same checks as New trip"]
    B10 --> B3
    B3 -- "Delete trip" --> B11{"Delete X and<br/>its items?"}
    B11 -- "Cancel" --> B3
    B11 -- "Delete trip" --> B12["My trips<br/>Deleted X"]
    B8(["Old or wrong link"]) --> B9["Trip not found<br/>Back to My trips"]
  end

  subgraph back["Coming back"]
    direction TB
    C1(["Come back before the next trip"]) --> C2["My trips<br/>Last packed · N added for next trip"]
    C2 -- "After 2+ days away" --> C3["Welcome back.<br/>N trips ready to pack again."]
    C2 -- "Forgot something? Add it" --> C7["List opens with<br/>Add item focused"]
    C2 -- "Open the list" --> C4{"Packed over 2 days ago<br/>and still ticked?"}
    C4 -- "Yes" --> C5["Packing for a new trip?<br/>Clear all ticks · Keep them"]
    C4 -- "No" --> C8["The list as you left it"]
    C5 -- "Clear all ticks" --> C6["Ready to pack again<br/>New items listed first"]
    C5 -- "Keep them" --> C8
  end

  %% Invisible links stack the three flows top to bottom.
  first ~~~ main
  main ~~~ back
```

## Notes

- Starter trips are created only when the key is missing, never over unreadable data.
- An item added from "Forgot something?" is saved as already packed, so the list stays "All packed" for the trip you just took. It stays New until the next trip is packed: after the ticks are cleared, not when items are re-ticked within the same trip.
- The "new trip?" prompt depends on today's date, so it is decided only after the page mounts.
- The Add item section starts on the last section picked on that page (not stored).
- Removing an item is immediate. A "Removed X · Undo" row takes its place, with Undo focused; the bar repeats it. Both go 3 seconds after you move away from them (hovering or keyboard focus keeps them), or at the next change. If Undo had focus, focus moves to the next item.
- Rename trip and Delete trip open in place at the bottom of the list, never as a modal. Escape or Cancel closes them and returns focus. Deleting goes back to My trips, which says "Deleted X" with focus on it.
- Every change is applied to what's saved at that moment, so open tabs stay in sync (through the storage event) and never overwrite each other.
