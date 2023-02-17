# status
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) functions to create a "status bar"
to display messages and to ask for user input.

Adds two functions to `Promise`: `Promise.alert` and `Promise.prompt`, and adds one function to `Promise.prototype`: `Promise.prototype.alert`.
The latter is a [non-enumerable property](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties), so it won't mess up
`for...in` loops on actual objects.

Optionally uses my [dwachss/historystack](https://github.com/dwachss/historystack).

## `Promise.prompt`

Asks for user input, just like `window.prompt(message, defaultValue)`, but *asynchronously*, so it returns a `Promise` that is resolved with the user input,
or rejected if the user canceled.

### Usage

````js
Promise.prompt(message = '', container = globalThis, defaultValue = '').then (response => do something).catch (cancelError => do something else);
````

If `container` is a DOM element, then the following is prepended to the element:

````html
<label><strong>message</strong><input /></label>
````

with `keydown` handlers, such that `Enter` resolves the `Promise` with the value of the input element, `Escape` rejects the `Promise`.

If historystack is included, it creates a `History` that keeps track of past entries in `container`, and the `ArrowUp` and `ArrowDown` go back and forward,
respectively, through that history.

After an `Enter` or `Escape` the created elements are removed.

If `element` is not a DOM element (i.e. `Promise.prompt('Enter data:')`) then it simply uses `container.prompt()`, which is a modal dialog.
If `container` does not have a `prompt` method, the Promise will reject with a TypeError.

### Localization

The error message for canceling is `Promise.prompt.cancelMessage = "User Cancelled"` and can be changed for localization.

## `Promise.alert`

Displays a message and returns a Promise that is resolved with the message or rejected with an error.

### Usage

````js
Promise.alert(message, container = globalThis); 
````

The method turns message into a Promise with [`Promise.resolve(message)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve).
If that promise resolves to an instance of `Error`, it rejects with that error. If it rejects, an error message is displayed with that error. If it resolves, it displays the
message. The Promise is returned for further `then`ing.

If `container` is a DOM element, then `<span role=alert >message or error</span>` is prepended to it. The span is given a class of `success` or `failure` depending on whether
the Promise resolved or rejected (for appropriate CSS). Then the class `hidden` is added to the span. The assumption is that `span[role=alert]` has a CSS transition attached
it, and `span[role=alert].hidden` evokes that transition. The span has an `ontransitionend` handler that removes it. For example:

````css
	span[role=alert] {
		transition: opacity 4s 2s;
	}
	span[role=alert].hidden {
		opacity: 0;
	}
	span[role=alert].success {
		color: green;
	}
	span[role=alert].failure {
		color: red;
	}
```` 

will remove the element after 6 seconds. If there is no transition, then the user has to take responsibility for removing the message.

If `container` is not a DOM element, then uses `container.log` or `container.error` appropriately, if those exist, or `container.alert` to display the message. 
Since `alert` doesn't distinguish between errors and messages, a `⚠️` is prepended to the message.

Either way, a rejected Promise is handled with `catch`, so the final promise returned will be resolved with a value of `undefined`.

### Examples

````js
Promise.alert('Finished').then(doOtherWork);

Promise.alert(new Error('Failed')).then(doOtherWork);

Promise.alert(
	fetch(url).then(response =>{
		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
		return response.text();
	}),
	resultElement;
);
````

### Customization

If you want to change the class names used, they are stored as

````js
Promise.alert.classes = {
	success: 'success',
	failure: 'failure',
	hidden: 'hidden'
};
````

## `Promise.prototype.alert`

Convenience function that sends a pre-existing Promise to `Promise.alert`. So the above examples become:

````js
Promise.resolve('Finished').alert().then(doOtherWork);

Promise.reject(new Error('Failed')).alert().then(doOtherWork);

fetch(url).then(response =>{
	if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
	return response.text();
}).alert(resultElement);
````

Implemented as

````js
Object.defineProperty( Promise.prototype, 'alert', {
	value: function (container) { return Promise.alert(this, container) }
});
````

I thought long and hard about this, since modifying the prototype of a built-in object is [considered harmful](https://www.kirupa.com/html5/extending_built_in_objects_javascript.htm) and will get
you fired from [Google](https://google.github.io/styleguide/jsguide.html#disallowed-features-modifying-builtin-objects). But with
`Object.defineProperty` the only downside is a collision with this name with another library or a future standard. Consider this a warning that
if [whatwg](https://whatwg.org/) decides to implement `Promise.prototype.alert`, then things will break.