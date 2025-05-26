import { Pane } from "tweakpane";

export class DebugPane {
  pane: Pane | null;

  constructor() {
    this.pane = null;

    this.pane = new Pane({
      title: "Debug",
      container: document.querySelector("#debug") as HTMLElement,
    });
  }
}
