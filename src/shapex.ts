/**
 * A callback passed to subscriptions, called when the event
 * that the subscription is listening to is called.
 */
export type EventListener<
  TState,
  TPayload extends unknown = undefined,
> = (
  state: TState,
  payload?: TPayload,
) => void | Promise<void>;

type Subscription<
  TState,
  TPayload extends unknown = undefined,
> = {
  callback: EventListener<TState, TPayload>;
  once: boolean;
};

/**
 * An instance of the ShapeX object.
 */
export type ShapeXInstance<TState> = {
  /**
   * Subscribe to an event.
   *
   * @param topic
   * @param callback
   */
  subscribe: <TPayload extends unknown = undefined>(
    topic: string,
    callback: EventListener<TState, TPayload>,
  ) => number;

  /**
   * Subscribe to an event once.
   *
   * @param topic
   * @param callback
   */
  subscribeOnce: <TPayload extends unknown = undefined>(
    topic: string,
    callback: EventListener<TState, TPayload>,
  ) => number;

  /**
   * Unsubscribe from an event.
   *
   * @param topic
   */
  unsubscribe: (topic: string) => void;

  /**
   * Get the number of subscriptions for an event.
   */
  subscriptionCount: (to: string) => number;

  /**
   * Get the subscriptions for an event.
   */
  subscriptions: () => string[];

  /**
   * Dispatch an event.
   *
   * @param to
   * @param payload
   */
  dispatch: <TPayload extends unknown>(to: string, payload?: TPayload) => void;

  /**
   * Get the current state.
   */
  state: () => TState;

  /**
   * Update state.
   *
   * @param updatedState
   */
  setState: (updatedState: TState) => void;
};

/**
 * A function that creates an EventX object.
 *
 * @param {TState extends object} initialState The initial application state.
 * @returns {ShapeXInstance} The ShapeX object.
 */
export function ShapeX<TState extends object>(initialState: TState): ShapeXInstance<TState> {
  let _state = initialState;
  let _subscriptionId = 0;
  const _subscriptions: Map<string, Array<Subscription<TState, unknown>>> = new Map();

  /**
   * Subscribe to an event.
   *
   * @param topic
   * @param {EventListener} callback
   * @returns
   */
  const subscribe = <
    TPayload extends unknown = undefined,
  >(
    topic: string,
    callback: EventListener<TState, TPayload>,
  ): number => {
    // there are no listeners, set as empty array
    if (!_subscriptions.has(topic)) {
      _subscriptions.set(topic, []);
    }

    // add a listener
    _subscriptions.get(topic)?.push({
      callback: callback as unknown as EventListener<TState, unknown>,
      once: false,
    });

    return ++_subscriptionId;
  };

  /**
   * Subscribe to an event, once.
   *
   * @param {string} topic
   * @param {EventListener} callback
   * @returns
   */
  const subscribeOnce = <TPayload extends unknown = undefined>(
    topic: string,
    callback: EventListener<TState, TPayload>,
  ): number => {
    // there are no listeners, set as empty array
    if (!_subscriptions.has(topic)) {
      _subscriptions.set(topic, []);
    }

    // add a listener
    _subscriptions.get(topic)?.push({
      callback: callback as unknown as EventListener<TState, unknown>,
      once: true,
    });

    return ++_subscriptionId;
  };

  /**
   * Removes all listeners for a topic.
   *
   * @param topic
   */
  const unsubscribe = (topic: string): void => {
    if (_subscriptions.has(topic)) {
      _subscriptions.delete(topic);
    }
  };

  /**
   * Composes a list of changes between two states.
   *
   * @param {TState extends object} oldState
   * @param {TState extends object} newState
   * @returns {string[]} The list of changes as array of paths.
   */
  const changedState = <TState extends object>(
    oldState: TState,
    newState: TState,
  ): string[] => {
    const paths = <R extends object>(
      state: R,
      path: string,
    ): { path: string; value: unknown }[] => {
      const _paths = [] as { path: string; value: unknown }[];

      for (const key in state) {
        const currentPath = `${path}.${key}`;
        _paths.push({
          path: currentPath,
          value: state[key],
        });

        if (typeof state[key] === "object" && state[key] !== null) {
          _paths.push(...paths(state[key], currentPath));
        }
      }

      return _paths;
    };

    const differ = <S extends object>(oldState: S, newState: S): string[] => {
      const oldPaths = paths(oldState, "$");
      const oldPathKeys = oldPaths.map((x) => x.path);
      const newPaths = paths(newState, "$");
      const newPathKeys = newPaths.map((x) => x.path);

      // all new paths
      const added = newPathKeys.filter((path) => !oldPathKeys.includes(path));

      // all removed paths
      const removed = oldPathKeys.filter((path) => !newPathKeys.includes(path));

      // paths that remained
      const same = oldPathKeys.filter((path) => newPathKeys.includes(path));

      // paths that changed
      const changed = same.filter((path) => {
        const oldValue = oldPaths.find((x) => x.path === path)?.value;
        const newValue = newPaths.find((x) => x.path === path)?.value;

        return oldValue !== newValue;
      });

      return [...new Set([...added, ...removed, ...changed])];
    };

    return differ(oldState, newState);
  };

  /**
   * Dispatches an event with the given name and arguments.
   *
   * @param {string} to The name of the event to dispatch.
   * @param payload
   * @returns {void}
   */
  const dispatch = <TPayload extends unknown = undefined>(
    to: string,
    payload?: TPayload,
  ): void => {
    if (!_subscriptions.has(to)) return;

    const scopedSubscriptions = _subscriptions.get(to) ?? [];
    const remainingSubscriptions = [] as Array<Subscription<TState, unknown>>;

    for (const subscription of scopedSubscriptions) {
      const callback = subscription.callback as unknown as EventListener<TState, TPayload>;

      if (payload) {
        callback(_state, payload);
      } else {
        callback(_state);
      }

      if (!subscription.once) {
        remainingSubscriptions.push(subscription);
      }
    }

    _subscriptions.set(to, remainingSubscriptions);
  };

  /**
   * Returns the number of subscriptions for the given event name.
   *
   * @param {string} eventName The name of the event to check.
   * @returns {number} The number of subscriptions for the given event name.
   */
  const subscriptionCount = (eventName: string | null): number => {
    if (eventName) {
      return _subscriptions.get(eventName)?.length ?? 0;
    }

    return Array.from(_subscriptions.keys()).length;
  };

  /**
   * Returns the names of all subscriptions.
   *
   * @returns {string[]} An array of subscription names.
   */
  const subscriptions = (): string[] => {
    return Array.from(_subscriptions.keys());
  };

  /**
   * Returns the current state.
   *
   * @returns {} The current state.
   */
  const state = (): TState => {
    return _state;
  };

  /**
   * Updates state.
   *
   * @param updatedState updated state
   */
  const setState = (updatedState: TState): void => {
    const changes = changedState(_state, updatedState);
    _state = updatedState;

    for (let i = 0; i < changes.length; i++) {
      dispatch(changes[i]);
    }
  }

  return {
    subscribe,
    subscribeOnce,
    unsubscribe,
    subscriptionCount,
    subscriptions,
    dispatch,
    state,
    setState,
  };
}
