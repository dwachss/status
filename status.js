// Promise.alert and Promise.prompt allow for creating a "status bar" for interacting with the user

'use strict';

Promise.alert = (message, container = globalThis) => {
	return Promise.resolve(message).then( message => {
		if (message instanceof Error) throw message; 
		if (container instanceof HTMLElement){
			displayMessage(container, message, Promise.alert.classes.success);
		}else{
			(container.log ?? container.alert)(message);
		}
		return message;
	}).catch(error => {
		if (container instanceof HTMLElement){
			displayMessage(container, error, Promise.alert.classes.failure);
		}else{
			const message = container.error ? error : `\u26A0\uFE0F ${error}`; // add warning emoji
			(container.error ?? container.alert)(message);
		}
		return error; // create a fulfilled promise with the error, if the user wants to do something more
	});

	function displayMessage (container, message, classname = Promise.alert.classes.success){
		const span = document.createElement('span');
		span.classList.add(classname);
		span.textContent = message;
		span.setAttribute('role', 'alert');
		span.ontransitionend = evt => span.remove();
		container.prepend(span);
		setTimeout(()=>span.classList.add(Promise.alert.classes.hidden), 10);
	}

}

Object.defineProperty( Promise.prototype, 'alert', {
	value: function (container) { return Promise.alert(this, container) }
});

Promise.alert.classes = {
	success: 'success',
	failure: 'failure',
	hidden: 'hidden'
};

Promise.prompt = (promptMessage = '', container = globalThis, defaultValue = '') => {
	if (container instanceof HTMLElement){
		return new Promise ((resolve, reject) => displayPrompt(resolve, reject)).
			finally( () => container.querySelectorAll('label.prompt').forEach( el => el.remove() ) );
	}else{
		return new Promise ((resolve, reject) => {
			const response = container.prompt(promptMessage, defaultValue);
			if (response === null) reject (new Error(Promise.prompt.cancelMessage));
			resolve(response);
		});
	}
					
	function history(){
		const key = Symbol.for('Promise.prompt.history');
		if (key in container) return container[key];
		try{
			return container[key] = new History(defaultValue);
		}catch{
			// if my history stack is not implemented, the original History constructor will throw a TypeError
			return null;
		}
	}

	function displayPrompt(resolve, reject){
		container.querySelectorAll('label.prompt').forEach( el => el.remove() ); // remove any old elements
		const label = document.createElement('label');
		label.className = 'prompt';
		label.append(document.createElement('strong'), document.createElement('input'));
		label.querySelector('strong').textContent = promptMessage;
		label.querySelector('input').value = defaultValue;
		label.querySelector('input').addEventListener('keydown', function(evt) {
			switch (evt.key){
			case 'Enter':
				evt.preventDefault();
				resolve(this.value);
				break;
			case 'Escape':
				evt.preventDefault();
				reject (new Error(Promise.prompt.cancelMessage));
				break;
			}
		});
		const h = history();
		if (h) label.querySelector('input').addEventListener('keydown', function(evt) {
			switch (evt.key){
			case 'Enter':
				h.pushState(this.value);
				break;
			case 'ArrowUp':
				if (h.atEnd){
					h.pushState(this.value);
					h.back();
				}
				this.value = h.state;
				h.back();
				evt.preventDefault();
				break;
			case 'ArrowDown':
				this.value = h.forward();
				evt.preventDefault();
			break;
			}
		});
		container.prepend(label);
		label.querySelector('input').focus();
	}

}

Promise.prompt.cancelMessage = "User Cancelled";
