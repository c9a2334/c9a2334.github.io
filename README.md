# js-pinInput

## Install

Put `HelloFlowPinInput.js` and `HelloFlowPinInput.css` anywhere on your page, like this:

```HTML
<script src="HelloFlowPinInput.js"></script>
<link rel="stylesheet" href="HelloFlowPinInput.css">
```

## Usage

Put `<input>` anywhere on-page, this input will store the current code. 

```HTML
<input type="text" name="pin" id="pincode" class="pininput">
```

Then call `HelloFlowPinInput(selector [, options])` function, which initializes pincode inputs.

***selector*** parameter can be Node element, an array of Nodes, NodeList, or CSS selector.

***options*** is an object with properties:

* `digits` *Number*, default: 4: number of inputs
* `initialize` *Function*(HelloFlowPincodeInput): callback on full initialized pincode input
* `change` *Function*(value, HelloFlowPincodeInput): callback on change of any digit
* `complete` *Function*(value, HelloFlowPincodeInput): callback on full complete of all digits
* `value`(*String*, default: input.value): set defalut value of pincode input

**NOTE:** `HelloFlowPinInput` disables all inputs when hit complete status.

`HelloFlowPincodeInput` object have some useful function:

* `disable`: set disabled on all inputs to *true*
* `removeDisabled`: set disabled on all inputs to *false*
* `showError`: set the state of all inputs to error (red border and color, disabled *false*)
* `done`:  set the state of all inputs to done (green border and color, disabled *true*)
* `setValueFromText(text)`: parses sting and sets input values
* `clear`:  set all inputs value to empty
* `reset`:  remove all statuses and clear all inputs

For example:

```js
HelloFlowPinInput('[name="pin"]', {
        initialize: function () {
             sendSMS();
        },
        complete: function (value, HFPinInput) {
            mockRequest(value, function (result) {
                if (result) {
                    HFPinInput.done();
                    button.removeAttribute('disabled');
                } else {
                    HFPinInput.showError();
                }
            });
        }
    });
```

You can see an example of usage in [Example file](https://github.com/c9a2334/c9a2334.github.io/blob/master/VerificationModal.js)
