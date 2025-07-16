import {describe, it, expect, vi} from "vitest";
import {ShapeX, EventListener} from "./shapex.ts";

describe("subscribe", () => {
  it("subscribes to an event", () => {
    const $ = ShapeX({counter: 1});
    const id = $.subscribe("test-event", () => {
    });

    expect(id).toBe(1);
    expect($.subscriptionCount("test-event")).toBe(1);
  });

  it("subscribes to an event once", () => {
    const $ = ShapeX({counter: 1});
    const id = $.subscribeOnce("test-event", () => {
    });

    expect(id).toBe(1);
    expect($.subscriptionCount("test-event")).toBe(1);
  });

  it("unsubscribes from an event", () => {
    const $ = ShapeX({counter: 1});

    $.subscribe("test-event", () => {
    });
    expect($.subscriptionCount("test-event")).toBe(1);

    $.unsubscribe("test-event");
    expect($.subscriptionCount("test-event")).toBe(0);
  });
});

describe("subscribe: async", () => {
  it("subscribes to an event", () => {
    const $ = ShapeX({counter: 1});
    const id = $.subscribe("test-event", async () => {
    });

    expect(id).toBe(1);
    expect($.subscriptionCount("test-event")).toBe(1);
  });

  it("subscribes to an event once", () => {
    const $ = ShapeX({counter: 1});
    const id = $.subscribeOnce("test-event", async () => {
    });

    expect(id).toBe(1);
    expect($.subscriptionCount("test-event")).toBe(1);
  });

  it("unsubscribes from an event", () => {
    const $ = ShapeX({counter: 1});

    $.subscribe("test-event", async () => {
    });
    expect($.subscriptionCount("test-event")).toBe(1);

    $.unsubscribe("test-event");
    expect($.subscriptionCount("test-event")).toBe(0);
  });
});

describe("dispatch", () => {
  it("dispatches an event without arguments", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("test-event", spyCb);
    $.dispatch("test-event");

    expect(spyCb).toHaveBeenCalledWith({counter: 1});
  });

  it("dispatches an event with arguments", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("test-event", spyCb);
    $.dispatch("test-event", "arg1-value");

    expect(spyCb).toHaveBeenCalledWith({counter: 1}, "arg1-value");
  });

  it("updates state when event handler returns new state", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.counter", spyCb);
    $.subscribe("increment", (state) => {
      $.setState({...state, counter: state.counter + 1})
    });

    $.dispatch("increment");

    expect(spyCb).toHaveBeenCalledWith({counter: 2});
  });

  it("dispatches nested events", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("nested-event", spyCb);

    $.subscribe("parent-event", () => {
      $.dispatch("nested-event")
    });

    $.dispatch("parent-event");

    expect(spyCb).toHaveBeenCalled();
  });

  it("dispatches multiple nested events", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX({counter: 1});
    const cb: EventListener<AppState> = () => {
    };
    const spyCb = vi.fn(cb);
    const spyCb2 = vi.fn(cb);

    $.subscribe("nested-event-1", spyCb);

    $.subscribe("nested-event-2", spyCb2);

    $.subscribe("parent-event", () => {
      $.dispatch("nested-event-1");
      $.dispatch("nested-event-2");
    });

    $.dispatch("parent-event");

    expect(spyCb).toHaveBeenCalled();
    expect(spyCb2).toHaveBeenCalled();
  });

  it("dispatches nested events with arguments", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("nested-event", spyCb);

    $.subscribe("parent-event", () => {
      $.dispatch("nested-event", "arg-value");
    });

    $.dispatch("parent-event");

    expect(spyCb).toHaveBeenCalledWith({counter: 1}, "arg-value");
  });

  it("supports different data types for event callback and dispatch", () => {
    type AppState = {
      counter: number;
    };

    type ParentEventPayload = {
      id: number;
    };

    type ChildEventPayload = {
      message: string;
    };

    const $ = ShapeX<AppState>({counter: 1});

    // This callback receives ChildEventPayload
    const childEventCb: EventListener<AppState, ChildEventPayload> = (
      state,
      payload,
    ) => {
      if (payload) {
        $.setState({...state, counter: payload.message.length});
      }
    };

    const spyChildCb = vi.fn(childEventCb);

    $.subscribe("child-event", spyChildCb);

    // This callback receives ParentEventPayload
    const parentEventCb: EventListener<
      AppState,
      ParentEventPayload
    > = (_state, payload) => {
      $.dispatch("child-event", {message: `ID ${payload?.id ?? 0} processed`});
    };

    $.subscribe("parent-event", parentEventCb);

    // Dispatch with parent event data
    $.dispatch("parent-event", {id: 123});

    // Child event should be called with the child event data
    expect(spyChildCb).toHaveBeenCalledWith(
      {counter: 1},
      {message: "ID 123 processed"},
    );

    // State should be updated based on the message length
    expect($.state().counter).toBe(16);
  });
});

describe("dispatch: async", () => {
  it("dispatches an event without arguments", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(async () => {
    });

    $.subscribe("test-event", spyCb);
    $.dispatch("test-event");

    expect(spyCb).toHaveBeenCalledWith({counter: 1});
  });

  it("dispatches an event with arguments", () => {
    type AppState = {
      counter: number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const callback = vi.fn(() => {
    });

    $.subscribe("test-event", callback);
    $.dispatch("test-event", "arg1-value");

    expect(callback).toHaveBeenCalledWith({counter: 1}, "arg1-value");
  });
});

describe("state change detection", () => {
  it("detects value changes in state", () => {
    type AppState = {
      counter: number;
      nested: {
        value: string;
      };
    };

    const $ = ShapeX<AppState>({counter: 1, nested: {value: "test"}});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.counter", spyCb);

    $.subscribe("change-counter", (state) => {
      $.setState({...state, counter: 2});
    });

    $.dispatch("change-counter");

    expect(spyCb).toHaveBeenCalledWith({
      counter: 2,
      nested: {value: "test"},
    });
  });

  it("detects nested value changes in state", () => {
    type AppState = {
      counter: number;
      nested: {
        value: string;
      };
    };

    const $ = ShapeX<AppState>({counter: 1, nested: {value: "test"}});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.nested.value", spyCb);

    $.subscribe("change-nested-value", (state) => {
      $.setState({...state, nested: {...state.nested, value: "new value"}});
    });

    $.subscribe("change-nested-value-again", (state) => {
      $.setState({...state, nested: {...state.nested, value: "new value again"}});
    });

    $.dispatch("change-nested-value");
    $.dispatch("change-nested-value-again");

    expect(spyCb).toHaveBeenCalledWith({
      counter: 1,
      nested: {value: "new value"},
    });
  });

  it("detects addition in state", () => {
    type AppState = {
      view?: string;
    };

    const $ = ShapeX<AppState>({});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.view", spyCb);

    $.subscribe("set-view", (state) => {
      $.setState({...state, view: "test",})
    });

    $.dispatch("set-view");

    expect(spyCb).toHaveBeenCalled();
  });

  it("detects nested addition in state", () => {
    type AppState = {
      nested?: {
        value?: string;
      };
    };

    const $ = ShapeX<AppState>({});
    const cb: EventListener<AppState> = () => {
    };
    const spyCb = vi.fn(cb);
    const spyCb2 = vi.fn(cb);

    $.subscribe("$.nested", spyCb);
    $.subscribe("$.nested.value", spyCb2);

    $.subscribe("set-nested-value", (state) => {
      $.setState({
        ...state,
        nested: {
          value: "test"
        }
      })
    });

    $.subscribe("set-nested-value-again", (state) => {
      $.setState({
        ...state,
        nested: {
          value: "test-again"
        }
      })
    });

    $.dispatch("set-nested-value");
    $.dispatch("set-nested-value-again");

    expect(spyCb).toHaveBeenCalledTimes(2);
    expect(spyCb2).toHaveBeenCalledTimes(2);
  });

  it("detects deleted properties in state", () => {
    type AppState = {
      counter: number;
      toDelete?: string;
    };

    const $ = ShapeX<AppState>({counter: 1, toDelete: "value"});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.toDelete", spyCb);
    $.subscribe("delete-property", (state) => {
      $.setState({
        counter: state.counter
      })
    });

    $.dispatch("delete-property");

    expect(spyCb).toHaveBeenCalled();
  });

  it("detects type changes in state", () => {
    type AppState = {
      counter: string | number;
    };

    const $ = ShapeX<AppState>({counter: 1});
    const spyCb = vi.fn(() => {
    });

    $.subscribe("$.counter", spyCb);
    $.subscribe("change-counter-type", (state) => {
      $.setState({
        ...state,
        counter: "string now"
      })
    });

    $.dispatch("change-counter-type");

    expect(spyCb).toHaveBeenCalled();
  });
});

describe("utility methods", () => {
  it("returns all subscription names", () => {
    const $ = ShapeX({counter: 1});

    $.subscribe("event1", () => {
    });
    $.subscribe("event2", () => {
    });

    const subs = $.subscriptions();

    expect(subs).toContain("event1");
    expect(subs).toContain("event2");
    expect(subs).toHaveLength(2);
  });

  it("returns subscription count for specific event", () => {
    const $ = ShapeX({counter: 1});

    $.subscribe("event1", () => {
    });
    $.subscribe("event1", () => {
    });
    $.subscribe("event2", () => {
    });

    expect($.subscriptionCount("event1")).toBe(2);
    expect($.subscriptionCount("event2")).toBe(1);
  });

  it("returns updated state", () => {
    const $ = ShapeX({counter: 1});

    $.subscribe("event1", (state) => {
      $.setState({
        counter: state.counter + 1
      })
    });

    $.dispatch("event1");

    expect($.state()).toEqual({
      counter: 2,
    });
  });
});
