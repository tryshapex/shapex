# ShapeX

Create scalable event-driven applications with ShapeX, inspired by [re-frame](https://github.com/day8/re-frame/). ShapeX
uses zero dependencies and is runtime agnostic, meaning that you can use it in Node, Deno, Bun, browsers, or really
anywhere where JavaScript runs.

## Example application

This is an example application that demonstrates how to use the ShapeX library. It has a single starting point event
called `request`, which returns an updated state, which changes the `counter`. When that state changes, the subscriber
for the `counter` state fires.

```typescript
import {ShapeX} from "shapex";

type AppState = {
  counter: number;
};

const app = ShapeX<AppState>({
  counter: 1,
});

app.subscribe("$.counter", (state) => {
  console.log("counter changed", state);
});

app.subscribe("request", (state) => {
  app.setState({
    ...state,
    counter: state.counter + 1
  });
});

// Dispatch an event somewhere.
app.dispatch("request");
```

## Installation

```shell
npm install shapex
```

## Documentation

### State

At the core of your application is state. You start by initiating ShapeX with some initial state, like so:

```typescript
import {ShapeX} from "shapex";

type AppState = {
  counter: number;
};

const app = ShapeX<AppState>({
  counter: 1,
});
```

You can model your `AppState` however you like. It does not have to be called `AppState`.

### Events

Events set things in motion. You can dispatch events like so:

```typescript
app.dispatch("some-topic-name");
```

And, if there's any subscriptions for that topic, those subscriptions will then fire their event listeners.
The above example is an event with no payload, but you can also dispatch events with payload, like so:

```typescript
app.dispatch("some-topic-name", {
  hello: "world",
});
```

### Subscriptions

You can listen to events like so:

```typescript
app.subscribe("some-event-name", (state, payload) => {
  // do something with the payload
});
```

Each subscription has a callback function (event listener) which gets passed to it the app state and whatever payload
was passed when the event was dispatched. In other words, subscriptions take a `EventListener<TState, TPayload>`
function where `TState` is the app state, `TPayload` is the data sent via the `dispatch` method.

#### State change subscriptions

You can also listen to state changes with subscriptions, which will fire when the listened state changes. You can listen
to state changes like so:

```typescript
app.subscribe("$.counter", (state) => {
  // state.counter changed
});
```

Notable difference here is the `$.` prefix in the subscription listener name, which tells ShapeX what state to look for.
Here `$.counter` will look for the root-level `counter` key in state. To look for nested state, simply add a dot (`.`)
followed by the key name, i.e: `$.counter.nestedKey`. Additionally, state change subscriptions do not get any additional
data passed to them, only state, or in other words they are of `EventListener<TState>` type.

#### Subscribe only once

If you want to subscribe to an event or state change only once, you can use the `subscribeOnce` method. This method
works similarly to `subscribe`, but it will automatically unsubscribe after the first event or state change.

```typescript
app.subscribeOnce("$.counter", (state) => {
  // This will run only once.
});
```

#### Unsubscribe

If you want to unsubscribe from an event or state change, you can use the `unsubscribe` method. This method takes the
event or state change name as its argument and removes the subscription.

```typescript
app.unsubscribe("some-topic-name");
```

### Updating state

You can update state with the `setState` method:

```typescript
app.subscribe("counter++", (state) => {
  app.setState({
    ...state,
    counter: state.counter + 1
  });
});
```

#### Get the subscription count

If you want to get the number of subscriptions for a specific event or state change, you can use the `subscriptionCount`
method. This method takes the event or state change name as its argument and returns the number of subscriptions.

```typescript
// State change subscriptions
app.subscriptionCount("$.counter");

// Event subscriptions
app.subscriptionCount("some-event-name");
```

#### Get all subscriptions

If you want to get all subscriptions, you can use the `subscriptions` method. This method returns an array of all the
subscription names.

```typescript
app.subscriptions();
```

#### Get current app state

If you want to get the current state of the app, you can use the `state` method. This method returns the current state
of the app.

```typescript
app.state();
```
