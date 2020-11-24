(function () {
    var CLASSES = {
        done: '-done'
    };
    var SELECTORS = {
        box: '.field--read-to-pass',
        scroll: '.field--scrollBox',
        content: '.field--read-to-pass-content',
        input: '.field--hidden-input'
    };

    var readToPassComponents = [];

    var ReadToPass = function (element) {
        this.element = element;
        this.scrollBox = null;
        this.content = null;
        this.input = null;

        this.init();
    };

    ReadToPass.prototype = {
        init: function () {
            this.scrollBox = this.element.querySelector(SELECTORS.scroll);
            this.content = this.element.querySelector(SELECTORS.content);
            this.input = this.element.querySelector(SELECTORS.input);
            this.initializeEvents();
        },
        initializeEvents: function () {
            this.scrollBox.addEventListener('scroll', this.scrollHandler());
            this.reset();
        },
        reset: function () {
            this.element.classList.remove(CLASSES.done);
            this.input.value = "";
            this.scrollHandler()();
        },
        scrollHandler: function () {
            var self = this;
            return function (e) {
                var contentHeight = self.content.offsetHeight;
                var scrollBoxHeight = self.scrollBox.offsetHeight;
                var currentScroll = self.scrollBox.scrollTop;
                if (scrollBoxHeight + currentScroll >= contentHeight) {
                    self.element.classList.add(CLASSES.done);
                    if(self.input){
                        self.input.value = "true";
                    }
                }
            }
        }
    };

    function onLoad() {
        var components = document.querySelectorAll(SELECTORS.box);
        var returArray = [];
        components.forEach(function (element) {
            var component = readToPassComponents.filter(function (component) {
                return component.element === element
            })[0];
            if (!component) {
                component = new ReadToPass(element);
                readToPassComponents.push(component);
            }else{
                component.reset();
            }
            returArray.push(component)
        });

    }

    function initialization() {
        if (window.NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = Array.prototype.forEach;
        }
        if (document.readyState === 'loading') {
            window.addEventListener('load', onLoad);
        } else {
            onLoad();
        }
    }

    initialization();
    window.readToPass = onLoad;
})();