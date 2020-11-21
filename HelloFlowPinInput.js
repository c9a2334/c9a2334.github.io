(function () {
    var CLASSES = {
        filled: '-filled',
        done: '-done',
        error: '-error'
    };
    var SELECTORS = {
        input: '.helloflow-pincode-input'
    };
    var ATTRIBUTES = {};
    var TEMPLATES = {
        container: '<div class="helloflow-pincode"></div>',
        input: '<input type="text" class="helloflow-pincode-input" maxlength="1" autocomplete="off" inputmode="numeric">'
    };
    var MIXINS = {
        buildTemplate: function (str, data) {
            return str.replace(/\$\{([\w]+)\}/g, function (source, match) {
                if (data[match] || data[match] === 0) {
                    return data[match]
                }
            });
        },
        createNodesFromTemplate: function (template) {
            var div = document.createElement('div');
            div.innerHTML = template;
            return div.childNodes;
        },
        appendTemplate: function (element, template) {
            var childNodes = MIXINS.createNodesFromTemplate(template);
            for (var i = 0; i < childNodes.length; i++) {
                element.appendChild(childNodes[i])
            }
        },
        emptyFunction: function () {
        },
        passiveEvent: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },
        pickElements: function (selector) {
            var e = selector;
            if (e) {
                if (typeof e === "string") {
                    e = document.querySelectorAll(e);
                }
                if (!(e.length >= 0)) {
                    e = [e];
                }
                return e;
            }
            return [];
        },
        selectOnFocus: function (e) {
            var t = e.target;
            t.setSelectionRange(0, t.value.length);
        },
        getPastedText: function (e) {
            var clipboardData = e.clipboardData || window.clipboardData;
            return clipboardData.getData && clipboardData.getData('text/plain');
        },
        preventLetters: function (e) {
            var keyCode = e.keyCode;
            var check = !(keyCode === 8 || keyCode === 9 || keyCode === 46 || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105))
            if (check) {
                MIXINS.passiveEvent(e)
            }
            return check;
        }
    };

    var pincodeInputs = [];

    var HelloFlowPincodeInput = function (element, options) {
        this.element = element;
        this.digits = options.digits || 4;
        this.change = options.change || MIXINS.emptyFunction;
        this.complete = options.complete || MIXINS.emptyFunction;
        this.initialize = options.initialize || MIXINS.emptyFunction;
        this.inputs = [];
        this.value = options.value || element.value;

        this.init();
        this.initialize(this);
    };

    HelloFlowPincodeInput.prototype = {
        init: function () {
            this.element.style.display = "none";
            this.createInputs();
            this.registerInputEvents();
            this.setValueFromText(this.value);
        },
        createInputs: function () {
            this.container = MIXINS.createNodesFromTemplate(TEMPLATES.container)[0];
            this.element.parentNode.insertBefore(this.container, this.element);
            for (var i = 0; i < this.digits; i++) {
                MIXINS.appendTemplate(this.container, TEMPLATES.input);
            }
            this.inputs = this.container.querySelectorAll(SELECTORS.input);
        },
        registerInputEvents: function () {
            var self = this;
            this.inputs.forEach(function (element) {
                element.addEventListener('focus', function(e){
                    if(self.container.classList.contains(CLASSES.error)){
                        self.clear();
                    }
                    MIXINS.selectOnFocus(e);
                });

                element.addEventListener('paste', function (e) {
                    e.preventDefault();
                    self.setValueFromText(MIXINS.getPastedText(e));
                });

                element.addEventListener('keydown', MIXINS.preventLetters);

                element.addEventListener('keyup', function (e) {
                    self.keyupHandler(e);
                });

            });
        },
        keyupHandler(e) {
            var keyCode = e.keyCode;
            var target = e.target;
            var isLetters = MIXINS.preventLetters(e);
            if (isLetters) {
                return
            }
            if (keyCode == 8 || keyCode == 46) {
                var previousSibling = target.previousSibling;
                if (previousSibling) {
                    previousSibling.focus();
                }
            } else if (target.value !== "") {
                var nextSibling = target.nextSibling;
                if (nextSibling) {
                    nextSibling.focus();
                }
            }
            this.updateHiddenInput();
        },
        checkInputs: function () {
            var filled = 0;
            this.inputs.forEach(function (input) {
                if (input.value !== "") {
                    input.classList.add(CLASSES.filled);
                    filled += 1;
                } else {
                    input.classList.remove(CLASSES.filled);
                }
            });
            return filled === this.inputs.length;
        },
        setValueFromText: function (text) {
            var digits = text.substring(0, this.digits).split('');
            this.inputs.forEach(function (input, index) {
                if(digits[index]){
                    input.value = digits[index];
                }
            });
            this.updateHiddenInput();
        },
        removeError: function () {
            this.container.classList.remove(CLASSES.error);
        },
        showError: function () {
            this.container.classList.add(CLASSES.error);
            this.removeDisabled();
        },
        blurSelects(){
            this.inputs.forEach(function (input) {
                input.blur();
            });
        },
        disable: function () {
            this.blurSelects();
            this.inputs.forEach(function (input) {
                input.setAttribute('disabled','');
            });
        },
        removeDisabled: function () {
            this.inputs.forEach(function (input) {
                input.removeAttribute('disabled');
            });
        },
        done: function () {
            this.removeError();
            this.disable();
            this.container.classList.add(CLASSES.done);
        },
        reset: function(){
            this.removeError();
            this.removeDisabled();
            this.container.classList.remove(CLASSES.done);
            this.clear();
        },
        clear: function(){
            this.inputs.forEach(function (input) {
                input.value = "";
            });
            this.updateHiddenInput();
        },
        updateHiddenInput() {
            var newValue = '';
            this.inputs.forEach(function (input) {
                newValue += input.value;
            });
            this.value = newValue;
            this.element.value = this.value;

            this.change(this.value, this);
            this.removeError();
            if (this.checkInputs()) {
                this.complete(this.value, this);
                this.disable();
            }
        }
    };

    function createHFPincodeInputs(selector, options) {
        var selectedElements = MIXINS.pickElements(selector);
        var returnArray = [];
        selectedElements.forEach(function (element) {
            var HFPincodeInput = pincodeInputs.filter(function (input) {
                return input.element === element
            })[0];
            if (!HFPincodeInput) {
                HFPincodeInput = new HelloFlowPincodeInput(element, options);
                pincodeInputs.push(HFPincodeInput);
            }
            returnArray.push(HFPincodeInput);
        });
        return returnArray;
    }

    function initialization() {
        if (window.NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = Array.prototype.forEach;
        }
    }

    initialization();
    window.HelloFlowPinInput = createHFPincodeInputs;
})();