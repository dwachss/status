# status
jQuery plugins to create a "status bar" to display messages and to ask for user input.

Contains three plugins: `$().prompt()`, `$().status()` and `$().statusDisplayer()`.

Depends on my [dwachss/historystack](https://github.com/dwachss/historystack).

## jQuery.fn.prompt

Asks for user input, just like `window.prompt(message, defaultValue)`, but *asynchronously*, so it returns a `Promise` that is resolved with the user input, or rejected if the user canceled.

### Usage

````js
$(element).prompt(message = '', defaultValue = '').then (response => do something).catch (cancelError => do something else);
````

If `element` is a DOM element, then the following is appended to the element:

````html
<label><strong>message</strong><input /></label>
````

with `keyup` handlers, such that `Enter` resolves the `Promise` with the value of the input element, `Esc` rejects the `Promise`, with `jQuery.fn.prompt.cancel`. The original value of that is `new Error ('User Canceled')` but that can be changed for localization.

It creates a `[History](https://github.com/dwachss/historystack)` stack, assigned to `$(element).data('prompt.history')` that keeps track of past entries, and the `ArrowUp` and `ArrowDown` go back and forward, respectively, through that history.

If `element` is not a DOM element (i.e. `$().prompt()`) then it simply uses `window.prompt()`, which is a modal dialog. If `element` is an object that contains a `prompt` method, it will use that.


