# status
jQuery plugins to create a "status bar" to display messages and to ask for user input.

Contains three plugins: `$().prompt()`, `$().status()` and `$().statusDisplayer()`.

Depends on my [dwachss/historystack](https://github.com/dwachss/historystack).

## files

[jquery.status.js](https://github.com/dwachss/status/blob/master/jquery.status.js): the code.

[prompt.html](http://dwachss.github.io/status/prompt.html): simple demo of `$().prompt()`.

[statusbar.html](http://dwachss.github.io/status/statusbar.html): simple demo of `$().status()`.


## `jQuery.fn.prompt`

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

The `Promise` created is assigned to `$(element).data('prompt.promise')`.

## `jQuery.fn.status`

Displays a message. 

### Usage

````js
$(element).status(message, options = { display = () => this.show().fadeOut(5000) , successClass = 'success', failureClass = 'failure' } = {} );
````

If `element` is a DOM element, then appends `<span class=options.successClass >message</span>` to element, then shows/fades the span out with options.display removes it. However, if `message instanceof Error`, then appends `<span class=options.failureClass >message.message</span>` instead.

If `element` is not a DOM element, then `status` assumes that it is an object with `log` and `error` methods (i.e. `$(console).status(message)`) and calls those with `message` or (for an `Error`), `message.message`, respectively.

But it's more sophisticated than that. It creates a `Promise` with `Promise.resolve(message)`, and assigns that to `$(element).data('prompt.promise')` (overriding any previous value). So `message` itself can be a `Promise` or a jQuery `Deferred`, with the message only displayed when the `Promise` is resolved. If `message` is an `Error` or a `Promise` that is rejected, then `status` displays the error message with `options.failureClass`. For example:

````js
$(displayElement).status(
  $.post(url, {data: data}).then(
    function() { return filename+' Saved' },
    function() { throw new Error(filename+' Not saved') }
  )
);

$(displayElement).data('prompt.promise').then (do something with the resolved value of the $.post);
````
or

````js
$(displayElement).status(
  $(displayElement).prompt('Enter your name')
).data('prompt.promise').then(
  name => savedName = name
);
````

If `message` is a function, then it will be run (with `message.call()`; use [`bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind) to attach arguments or a `this` value) and the result of that will be displayed (and if it throws, the enclosing `Promise` is rejected, so the error will be displayed as well.

For example:

````js
function checkForm(formElement){
  if (formFieldsAreValid(formElement)){
    saveData(formElement);
    return 'Data Saved';
  }else{
    throw new Error('Invalid fields');
  }
}

$(displayElement).status( checkForm.bind(null, aForm) );
````

## `jQuery.fn.statusDisplayer`

Convenience wrapper for `status` that returns an array of two functions; the first calls `status(Promise.resolve)` and the second calls `status(Promise.reject)`, meant to be used as the arguments for `Promise.then` (with the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax). So rather than `$(element).status(some Promise)`, use the more functional `some Promise.then(...$(element).statusDisplayer())`.

The above examples become:
````js
Promise.resolve($.post(url, {data: data}).then(
    function() { return filename+' Saved' },
    function() { throw new Error(filename+' Not saved') }
).then (...$(displayElement).statusDisplayer());
````
and

````js
$(displayElement).prompt('Enter your name').then( name => savedName = name ).then( ...$(displayElement).statusDisplayer())
````

Note that `statusDisplayer` *resolves* the promise, even if it was initially rejected (it assumes that displaying the error is enough of a `catch` handler). So in the above example, `(displayElement).prompt('Enter your name').then( ...$(displayElement).statusDisplayer()).then( name => savedName = name )` (putting the `then` handler later) would still set `savedName` even if the user canceled.

## `jQuery.fn.promise`

The existing jQuery function [`promise(type)`](https://api.jquery.com/promise/) is patched to be a shortcut to `data('prompt.promise')` when `type === 'prompt'`. So all the lines in the examples above of `$(displayElement).data('prompt.promise')` can be replaced by `$(displayElement).promise('prompt')`.

