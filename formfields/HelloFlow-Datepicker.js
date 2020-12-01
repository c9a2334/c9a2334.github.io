(function () {
    var plugin = "HFDatepicker";
    var HFDatepickers = [];
    var CONST = {
        currentDate: new Date(),
        datepickerClass: "HFDatepicker",
        searchClass: "-search",
        activeLabelClass: "-active",
        weekendClass: "-weekend",
        outerClass: "-outer",
        outOfRangeClass: "-muted",
        selectedClass: "-selected",
        selectedItemClass: "-selected",
        destroyItemClass: "-destroy",
        buildItemClass: "-build",
        datepickerActiveClass: 'active',
        datepickerPlaceholder: "DD  /  MM  /  YYYY",
        maxDay: 31,
        maxMonth: 12,
        maxYear: 9999,
        minYear: 1900,
        minMonth: 1,
        minDay: 1,
        days: [
            {label: "Mon", weekend: false},
            {label: "Tue", weekend: false},
            {label: "Wed", weekend: false},
            {label: "Thu", weekend: false},
            {label: "Fri", weekend: false},
            {label: "Sat", weekend: true},
            {label: "Sun", weekend: true},
        ],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    };
    var supportsPassive = false;
    try {
        window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
            get: function () {
                supportsPassive = true;
            }
        }));
    } catch (e) {
    }

    var wheelOpt = supportsPassive ? {passive: false} : false;
    var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

    var templates = {
        datepickerBaseHTML: '' +
        '<div class="HFDatepicker_input-box">' +
        '<input class="HFDatepicker_input" type="text" name="HFPlaceholder">' +
        '</div>' +
        '<div class="HFDatepicker_body">' +
        '<i class="HFDatepicker_pointer"></i>' +
        '<div class="HFDatepicker_controls">' +
        '<div class="HFDatepicker_controls-button -prev"><svg><path d="M 17,12 l -5,5 l 5,5"></path></svg></div>' +
        '<div class="HFDatepicker_controls-label"></div>' +
        '<div class="HFDatepicker_controls-button -next"><svg><path d="M 14,12 l 5,5 l -5,5"></path></svg></div>' +
        '</div>' +
        '<div class="HFDatepicker_content"></div>' +
        '</div>',
        mobileLabel: '<label class="HFDatepicker_mobile-label" for="${id}"></label>',
        daysContent: '' +
        '<div class="HFDatepicker_days-view">' +
        '<div class="HFDatepicker_day-labels">${dayLabels}</div>' +
        '<div class="HFDatepicker_days"></div>' +
        '</div>',
        dayLabel: '<div class="HFDatepicker_day-label ${weekend}">${label}</div>',
        day: '' +
        '<div class="HFDatepicker_day ${classes}" ' +
        'data-date="${year}-${month}-${date}">${date}</div>',
        quickSearchContent: '' +
        '<div class="HFDatepicker_quick-search">' +
        '<div class="HFDatepicker_quick-search-content -month">${searchInner}</div>' +
        '<div class="HFDatepicker_quick-search-content -year">${searchInner}</div>' +
        '</div>',
        quickSearchInner: '' +
        '<div class="HFDatepicker_quick-controls">' +
        '<div class="HFDatepicker_controls-button -up"><svg><path d="M 17,12 l -5,5 l 5,5"></path></svg></div>' +
        '<div class="HFDatepicker_controls-button -down"><svg><path d="M 14,12 l 5,5 l -5,5"></path></svg></div>' +
        '</div>' +
        '<div class="HFDatepicker_quick-items-wrapper"><div class="HFDatepicker_quick-items"></div></div>',
        quickSearchItem: '' +
        '<div class="HFDatepicker_quick-item ${classes}">' +
        '<span class="HFDatepicker_quick-item-label" data-date="${date}" data-type="${type}">${label}</span></div>'
    };
    var defaultSettings = {
        changed: function (datepicker) {
        },
        initialized: function (datepicker) {
        },
        closeDatepicker: function (datepicker) {
        }
    };
    var mixins = {
        idsCounter: 0,
        buildTemplate: function (str, data) {
            return str.replace(/\$\{([\w]+)\}/g, function (source, match) {
                if (data[match] || data[match] === 0) {
                    return data[match]
                }
            });
        },
        prepareTemplates: function () {
            var dayLabels = "";
            CONST.days.forEach(function (day) {
                var settings = {
                    weekend: day.weekend ? CONST.weekendClass : " ",
                    label: day.label
                };
                dayLabels += mixins.buildTemplate(templates.dayLabel, settings);
            });
            templates.daysContent = mixins.buildTemplate(templates.daysContent, {dayLabels: dayLabels});

            templates.quickSearchContent = mixins.buildTemplate(templates.quickSearchContent, {searchInner: templates.quickSearchInner});

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
        getHFDatepickerByInput: function (element) {
            return HFDatepickers.filter(function (HFDatepicker) {
                return HFDatepicker.initialInput === element;
            })[0];
        },
        getHFDatepickerByPlaceholder: function (element) {
            return HFDatepickers.filter(function (HFDatepicker) {
                return HFDatepicker.placeholder === element;
            })[0];
        },
        getDaysInMonth: function (date) {
            return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        },
        getInputData: function (element) {
            return {
                value: element.getAttribute("value"),
                minValue: element.getAttribute("min"),
                maxValue: element.getAttribute("max"),
                required: element.hasAttribute("required")
            }
        },
        checkInput: function (element) {
            return element.tagName.toLowerCase() === "input" && (element.type === "date" || element.type === "text")
        },
        checkDatePicker: function (element) {
            return element.tagName.toLowerCase() === "input" && element.type === "date"
        },
        checkFunction: function (fun) {
            return fun && typeof fun === "function"
        },
        getDateFromText: function (text) {
            var date = null;
            if (text) {
                var parsedText = +text ? +text : text;
                var dateFromText = new Date(parsedText);
                if (!!dateFromText.valueOf()) {
                    date = dateFromText;
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                }
            }
            return date;
        },
        getCaretPosition: function (ctrl) {
            var CaretPos = 0;

            if (ctrl.selectionStart || ctrl.selectionStart == 0) {
                CaretPos = ctrl.selectionStart;
            }
            else if (document.selection) {
                ctrl.focus();
                var Sel = document.selection.createRange();
                Sel.moveStart('character', -ctrl.value.length);
                CaretPos = Sel.text.length;
            }

            return (CaretPos);
        },
        setCaretPosition: function (ctrl, pos) {
            if (ctrl.setSelectionRange) {
                ctrl.focus();
                ctrl.setSelectionRange(pos, pos);
            }
            else if (ctrl.createTextRange) {
                var range = ctrl.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },
        onPlaceholderFocus: function (e) {
            var target = e.target;
            var value = target.value;
            var datepicker = mixins.getHFDatepickerByPlaceholder(target);
            showDatepicker(datepicker);
            if (value === "") {
                target.value = CONST.datepickerPlaceholder;
            }
        },
        onPlaceholderBlur: function (e) {
            var target = e.target;
            var value = target.value;
            if (value === CONST.datepickerPlaceholder) {
                target.value = "";
            }
        },
        onPlaceholderInput: function (e) {
            var target = e.target;
            var HFDatepicker = mixins.getHFDatepickerByPlaceholder(target);
            var value = target.value;
            var numbers = value.replace(/[^0-9/]/g, '');
            var split = numbers.split('/');
            var placeholderTemplate = CONST.datepickerPlaceholder;
            var caretPosition = mixins.getCaretPosition(target);
            var day = 1;
            var month = HFDatepicker.currentDate.getMonth() + 1;
            var year = HFDatepicker.currentDate.getFullYear();
            var changesCounter = 0;
            var maxDay = CONST.maxDay;
            if (split[2] > 0) {
                year = Math.min(+split[2], CONST.maxYear);
                placeholderTemplate = placeholderTemplate.replace("YYYY", year);
                changesCounter++;
            }
            if (split[1] > 0) {
                month = Math.min(+split[1], CONST.maxMonth);
                var monthText = mixins.prepareDate(month);
                placeholderTemplate = placeholderTemplate.replace("MM", monthText);
                changesCounter++;
                var yearToCheck = year >= CONST.minYear ? year : HFDatepicker.currentDate.getFullYear();
                maxDay = mixins.getDaysInMonth(new Date(yearToCheck, month - 1, 1));
            }
            if (split[0] > 0) {
                day = Math.min(+split[0], maxDay);
                var dayText = mixins.prepareDate(day);
                placeholderTemplate = placeholderTemplate.replace("DD", dayText);
                changesCounter++;
            }
            HFDatepicker.currentDate = new Date(year, month - 1, 1);
            target.value = placeholderTemplate;
            setValue(HFDatepicker, changesCounter === 3 ? new Date(year, month - 1, day) : false, false);
            mixins.setCaretPosition(target, caretPosition + 1);
        },
        passiveClick: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },
        prepareDate: function (value) {
            return value < 10 ? "0" + value : value + ""
        },
        isWeekend: function (day) {
            var checkIndex = day === 0 ? 6 : day - 1;
            return CONST.days[checkIndex].weekend
        },
        prepareDayClasses: function (HFDatepicker, date) {
            var classes = [];
            var currentDate = HFDatepicker.currentDate;

            mixins.isWeekend(date.getDay()) && classes.push(CONST.weekendClass);

            currentDate.getMonth() !== date.getMonth() && classes.push(CONST.outerClass);

            var isMoreThanMax = HFDatepicker.maxDate && date.getTime() > HFDatepicker.maxDate.getTime();
            var isLessThanMin = HFDatepicker.minDate && date.getTime() < HFDatepicker.minDate.getTime();
            var isDateOutOfRange = isMoreThanMax || isLessThanMin;
            isDateOutOfRange && classes.push(CONST.outOfRangeClass);

            HFDatepicker.value && (HFDatepicker.value.getTime() === date.getTime()) && classes.push(CONST.selectedClass);

            return classes.join(" ");
        },
        getArrayIndex: function (array, index) {
            var result = 0;
            if (index < 0) {
                result = mixins.getArrayIndex(array, index + array.length)
            } else if (index >= array.length) {
                result = mixins.getArrayIndex(array, index - array.length)
            } else {
                result = index;
            }
            return result
        },
        buildSearchItemTemplate: function (HFDatepicker, isMonth, date, build) {
            var classes = [];
            var currentDate = isMonth ? HFDatepicker.currentDate.getMonth() : HFDatepicker.currentDate.getFullYear();
            var label = isMonth ? CONST.months[date] : date;
            var type = isMonth ? "month" : "year";
            currentDate === date && classes.push(CONST.selectedItemClass);
            build && classes.push(CONST.buildItemClass);
            var classesText = classes.join(" ");
            return mixins.buildTemplate(templates.quickSearchItem, {
                date: date,
                label: label,
                type: type,
                classes: classesText || " "
            });
        },
        destroyItem: function (array, index) {
            setTimeout(function () {
                array[index].classList.add(CONST.destroyItemClass);
                if (index !== 0) {
                    array[index - 1].remove();
                }
            }, index * 100);
        },
        buildItem: function (array, index) {
            setTimeout(function () {
                array[index].classList.remove(CONST.buildItemClass);
            }, (index+1) * 100);
        },
        createTemplate: function (template) {
            var div = document.createElement("div");
            div.innerHTML = template;
            return div.childNodes;
        },
        appendTemplate: function (element, template) {
            var childNodes = mixins.createTemplate(template);
            for (var i = 0; i < childNodes.length; i++) {
                element.appendChild(childNodes[i])
            }
        },
        unshiftTemplate: function (element, template) {
            var childNodes = mixins.createTemplate(template);
            var firstChild = element.childNodes[0];
            for (var i = 0; i < childNodes.length; i++) {
                if (firstChild) {
                    element.insertBefore(childNodes[i], firstChild);
                } else {
                    element.appendChild(childNodes[i]);
                }
            }
        },
        mobileCheck: function () {
            let check = false;
            try {
                (function (a) {
                    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
                })(navigator.userAgent || navigator.vendor || window.opera);
            } catch (e) {
            }
            return check;
        }
    };

    function setValue(HFDatepicker, newValue, rerender) {
        var checkedValue = newValue;
        var isMoreThanMax = false;
        var isLessThanMin = false;
        if (newValue) {
            isMoreThanMax = HFDatepicker.maxDate && checkedValue.getTime() > HFDatepicker.maxDate.getTime();
            isLessThanMin = HFDatepicker.minDate && checkedValue.getTime() < HFDatepicker.minDate.getTime();
            isMoreThanMax && (checkedValue = HFDatepicker.maxDate);
            isLessThanMin && (checkedValue = HFDatepicker.minDate);
            HFDatepicker.currentDate = new Date(checkedValue.getFullYear(), checkedValue.getMonth(), 1);
        }
        HFDatepicker.value = checkedValue;
        if (isMoreThanMax || isLessThanMin || rerender || rerender === void(0)) {
            updatePlaceholder(HFDatepicker);
        }
        updateDaysView(HFDatepicker);
        updateDateLabel(HFDatepicker);
        buildQuickSearch(HFDatepicker);
        var preparedMonth =0;
        var preparedDay =0;
        if(checkedValue){
            preparedMonth = mixins.prepareDate(checkedValue.getMonth() + 1);
            preparedDay = mixins.prepareDate(checkedValue.getDate());
        }
        HFDatepicker.initialInput.value = checkedValue ? checkedValue.getFullYear() + "-" + preparedMonth + "-" + preparedDay : "";
        HFDatepicker.changed(HFDatepicker)
    }

    function createHFDatepicker(element, settings) {
        var elementData = mixins.getInputData(element);
        var currentDateValue = mixins.getDateFromText(elementData.value);
        var currentDateYear = currentDateValue ? currentDateValue.getFullYear() : CONST.currentDate.getFullYear();
        var currentDateMonth = currentDateValue ? currentDateValue.getMonth() : CONST.currentDate.getMonth();
        var currentDate = new Date(currentDateYear, currentDateMonth, 1);
        var isChrome = navigator.userAgent.includes("Chrome") && navigator.vendor.includes("Google Inc");
        var defaultDatePicker = mixins.checkDatePicker(element) && !isChrome;
        var isMobile = mixins.checkDatePicker(element) && mixins.mobileCheck();
        if (currentDateValue) {
            currentDateValue.setHours(12);
            element.setAttribute("value", currentDateValue.toISOString().substring(0, 10));
        }
        var HFDatepicker = {
            id: plugin + mixins.idsCounter++,
            initialInput: element,
            value: currentDateValue,
            currentDate: currentDate,
            minDate: mixins.getDateFromText(elementData.minValue),
            maxDate: mixins.getDateFromText(elementData.maxValue),
            required: elementData.required,
            changed: defaultSettings.changed,
            initialized: defaultSettings.initialized,
            defaultDatePicker : false,
            closeDatepicker: defaultSettings.closeDatepicker
        };
        if (settings) {
            mixins.checkFunction(settings.changed) && (HFDatepicker.changed = settings.changed);
            mixins.checkFunction(settings.initialized) && (HFDatepicker.initialized = settings.initialized);
            HFDatepicker.defaultDatePicker = settings.defaultDatePicker;
        }
        defaultDatePicker = HFDatepicker.defaultDatePicker && defaultDatePicker;
        if (isMobile || defaultDatePicker) {
            buildMobileHFDatepicker(HFDatepicker);
        } else {
            HFDatepicker.closeDatepicker = function () {
                HFDatepicker.body.classList.remove(CONST.datepickerActiveClass);
                HFDatepicker.placeholder.blur();
                document.removeEventListener("click", HFDatepicker.closeDatepicker);
            };
            buildHFDatepicker(HFDatepicker);
        }
        HFDatepicker.initialized(HFDatepicker);
        HFDatepickers.push(HFDatepicker);
        return HFDatepicker;
    }

    function buildMobileHFDatepicker(HFDatepicker) {
        var el = HFDatepicker.initialInput;
        var parent = el.parentNode;
        el.classList.add("hiddenInput");
        el.id = el.id || HFDatepicker.id;

        var wrapper = document.createElement("div");
        wrapper.classList.add(CONST.datepickerClass);
        wrapper.innerHTML = mixins.buildTemplate(templates.mobileLabel, {id: el.id});
        HFDatepicker.wrapper = wrapper;
        HFDatepicker.label = wrapper.querySelector(".HFDatepicker_mobile-label");
        parent.insertBefore(wrapper, el);
        buildMobileHFDatepickerEvents(HFDatepicker);
        updateMobileLabel(HFDatepicker);
    }

    function buildMobileHFDatepickerEvents(HFDatepicker) {
        HFDatepicker.initialInput.addEventListener("input", function (e) {
            var newValue = mixins.getDateFromText(HFDatepicker.initialInput.value);
            HFDatepicker.value = newValue;
            updateMobileLabel(HFDatepicker);
            HFDatepicker.changed(HFDatepicker);
        })
    }

    function updateMobileLabel(HFDatepicker) {
        var value = HFDatepicker.value;
        if (value) {
            var dateText = mixins.prepareDate(value.getDate());
            var month = value.getMonth() + 1;
            var monthText = mixins.prepareDate(month);
            HFDatepicker.label.innerHTML = [dateText, monthText, value.getFullYear()].join("  /  ");
            HFDatepicker.label.classList.add(CONST.activeLabelClass)
        } else {
            HFDatepicker.label.classList.remove(CONST.activeLabelClass);
            HFDatepicker.label.innerHTML = CONST.datepickerPlaceholder;
        }
    }

    function buildHFDatepicker(HFDatepicker) {
        var el = HFDatepicker.initialInput;
        var parent = el.parentNode;
        el.classList.add("hiddenInput");

        var wrapper = document.createElement("div");
        wrapper.classList.add(CONST.datepickerClass);
        wrapper.innerHTML = templates.datepickerBaseHTML;
        HFDatepicker.wrapper = wrapper;
        parent.insertBefore(wrapper, el);

        HFDatepicker.body = wrapper.querySelector(".HFDatepicker_body");

        HFDatepicker.content = wrapper.querySelector(".HFDatepicker_content");
        HFDatepicker.content.innerHTML = templates.daysContent;
        HFDatepicker.content.innerHTML += templates.quickSearchContent;

        HFDatepicker.days = wrapper.querySelector(".HFDatepicker_days");

        HFDatepicker.currentDateLabel = wrapper.querySelector(".HFDatepicker_controls-label");

        HFDatepicker.monthSearchItems = HFDatepicker.wrapper.querySelector(".-month .HFDatepicker_quick-items");
        HFDatepicker.yearSearchItems = HFDatepicker.wrapper.querySelector(".-year .HFDatepicker_quick-items");

        HFDatepicker.placeholder = wrapper.querySelector(".HFDatepicker_input");
        HFDatepicker.placeholder.setAttribute("placeholder", CONST.datepickerPlaceholder);
        buildHFDatepickerEvents(HFDatepicker);
        updateView(HFDatepicker);
    }

    function buildQuickSearch(HFDatepicker) {
        var currentMonth = HFDatepicker.currentDate.getMonth();
        var currentYear = HFDatepicker.currentDate.getFullYear();
        var monthsHTML = "";
        var yearsHTML = "";
        for (var i = currentMonth - 9; i < currentMonth + 9; i++) {
            var index = mixins.getArrayIndex(CONST.months, i);
            monthsHTML += mixins.buildSearchItemTemplate(HFDatepicker, true, index);
        }
        HFDatepicker.monthSearchItems.innerHTML = monthsHTML;
        for (var i = currentYear - 9; i < currentYear + 9; i++) {
            yearsHTML += mixins.buildSearchItemTemplate(HFDatepicker, false, i);
        }
        HFDatepicker.yearSearchItems.innerHTML = yearsHTML;
    }

    function scrollQuickSearch(HFDatepicker, isMonth, counter) {
        var element = isMonth ? HFDatepicker.monthSearchItems : HFDatepicker.yearSearchItems;
        var items = element.querySelectorAll(".HFDatepicker_quick-item");
        var toDestroy = [];
        var toBuild = [];
        var times = Math.abs(counter);
        var newValue = 0;
        if (counter > 0) {
            newValue = +items[items.length - 1].childNodes[0].getAttribute("data-date") + 1;
            for (var i = 0; i < times; i++) {
                var index = isMonth ? mixins.getArrayIndex(CONST.months, newValue + i) : newValue + i;
                var template = mixins.buildSearchItemTemplate(HFDatepicker, isMonth, index);
                mixins.appendTemplate(element, template);
            }
            for (var i = 0; i < items.length; i++) {
                if (!items[i].classList.contains(CONST.destroyItemClass) && toDestroy.length !== times) {
                    toDestroy.push(items[i]);
                }
            }
        }
        if (counter < 0) {
            var firstChild = null;
            for (var i = 0; i < items.length; i++) {
                if (!items[i].classList.contains(CONST.destroyItemClass) && !firstChild) {
                    firstChild = items[i];
                }
            }
            newValue = +firstChild.childNodes[0].getAttribute("data-date") - 1;
            for (var i = 0; i < times; i++) {
                var index = isMonth ? mixins.getArrayIndex(CONST.months, newValue - i) : newValue - i;
                var template = mixins.buildSearchItemTemplate(HFDatepicker, isMonth, index, true);
                mixins.unshiftTemplate(element, template);
                toBuild.push(element.childNodes[0]);
            }
            for (var i = 1; i <= times; i++) {
                items[items.length - i].remove();
            }
        }
        for (var i = 0; i < toDestroy.length; i++) {
            mixins.destroyItem(toDestroy, i);
        }
        for (var i = 0; i < toBuild.length; i++) {
            mixins.buildItem(toBuild, i);
        }
    }

    function quickSearchSetDate(HFDatepicker, element) {
        var isMonth = element.getAttribute("data-type") === "month";
        var value = +element.getAttribute("data-date");
        var func = isMonth ? "setMonth" : "setFullYear";
        var itemsWrapper = isMonth ? HFDatepicker.monthSearchItems : HFDatepicker.yearSearchItems;
        var items = itemsWrapper.querySelectorAll(".HFDatepicker_quick-item");
        var parent = element.parentNode;
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove(CONST.selectedItemClass);
        }
        parent.classList.add(CONST.selectedItemClass);
        HFDatepicker.currentDate[func](value);
        updateView(HFDatepicker);
    }

    function toggleQuickSearch(HFDatepicker) {
        if (!HFDatepicker.body.classList.contains(CONST.searchClass)) {
            buildQuickSearch(HFDatepicker);
        }
        HFDatepicker.body.classList.toggle(CONST.searchClass);
    }

    function buildHFDatepickerEvents(HFDatepicker) {
        HFDatepicker.wrapper.addEventListener("click", mixins.passiveClick);

        HFDatepicker.placeholder.addEventListener("input", mixins.onPlaceholderInput);
        HFDatepicker.placeholder.addEventListener("focus", mixins.onPlaceholderFocus);
        HFDatepicker.placeholder.addEventListener("blur", mixins.onPlaceholderBlur);
        var scrolled = false;
        var scrollDelay = 50;
        HFDatepicker.monthSearchItems.addEventListener(wheelEvent, function (e) {
            e.preventDefault();
            if(scrolled){
                return false;
            }
            var delta = e.deltaY;
            scrollQuickSearch(HFDatepicker, true, delta > 0 ? 3 : -3);
            setTimeout(function () {
                scrolled = false;
            },scrollDelay);
            scrolled = true;
        }, wheelOpt);
        HFDatepicker.yearSearchItems.addEventListener(wheelEvent, function (e) {
            e.preventDefault();
            if(scrolled){
                return false;
            }
            var delta = e.deltaY;
            scrollQuickSearch(HFDatepicker, false, delta > 0 ? 3 : -3);
            setTimeout(function () {
                scrolled = false;
            },scrollDelay);
            scrolled = true;
        }, wheelOpt);

        HFDatepicker.wrapper.addEventListener("click", function (e) {
            var classList = e.target.classList;
            if (classList.contains("HFDatepicker_controls-button")) {
                if (classList.contains("-prev")) {
                    prevMonth(HFDatepicker);
                } else if (classList.contains("-next")) {
                    nextMonth(HFDatepicker);
                } else if (classList.contains("-up")) {
                    var isMonth = e.target.parentElement.parentElement.classList.contains("-month");
                    scrollQuickSearch(HFDatepicker, isMonth, -3);
                } else if (classList.contains("-down")) {
                    var isMonth = e.target.parentElement.parentElement.classList.contains("-month");
                    scrollQuickSearch(HFDatepicker, isMonth, 3);
                }
            }
            if (classList.contains("HFDatepicker_day")) {
                var date = e.target.getAttribute('data-date');
                setValue(HFDatepicker, mixins.getDateFromText(date));
            }
            if (classList.contains("HFDatepicker_controls-label")) {
                toggleQuickSearch(HFDatepicker);
            }
            if (classList.contains("HFDatepicker_quick-item-label")) {
                quickSearchSetDate(HFDatepicker, e.target);
            }
        });
    }

    function prevMonth(HFDatepicker) {
        HFDatepicker.currentDate.setMonth(HFDatepicker.currentDate.getMonth() - 1);
        updateView(HFDatepicker);
    }

    function nextMonth(HFDatepicker) {
        HFDatepicker.currentDate.setMonth(HFDatepicker.currentDate.getMonth() + 1);
        updateView(HFDatepicker);
    }

    function updateView(HFDatepicker) {
        updatePlaceholder(HFDatepicker);
        updateDaysView(HFDatepicker);
        updateDateLabel(HFDatepicker);
    }

    function updatePlaceholder(HFDatepicker) {
        var value = HFDatepicker.value;
        if (value) {
            var dateText = mixins.prepareDate(value.getDate());
            var month = value.getMonth() + 1;
            var monthText = mixins.prepareDate(month);
            HFDatepicker.placeholder.value = [dateText, monthText, value.getFullYear()].join("  /  ");
        }
    }

    function updateDaysView(HFDatepicker) {
        var currentDate = HFDatepicker.currentDate;
        var totalMonthDays = mixins.getDaysInMonth(currentDate),
            firstMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(),
            lastMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), totalMonthDays).getDay(),
            daysFromPevMonth = firstMonthDay - 1,
            daysFromNextMonth = 6 - lastMonthDay + 1;

        daysFromPevMonth = daysFromPevMonth < 0 ? daysFromPevMonth + 7 : daysFromPevMonth;
        daysFromNextMonth = daysFromNextMonth > 6 ? daysFromNextMonth - 7 : daysFromNextMonth;

        var startDayIndex = -daysFromPevMonth + 1;
        var html = '';
        var max = totalMonthDays + daysFromNextMonth;
        for (var i = startDayIndex; i <= max; i++) {
            var currentYear = currentDate.getFullYear();
            var currentMonth = currentDate.getMonth();
            var date = new Date(currentYear, currentMonth, i);

            var settings = {
                date: mixins.prepareDate(date.getDate()),
                month: mixins.prepareDate(date.getMonth() + 1),
                year: date.getFullYear(),
                classes: mixins.prepareDayClasses(HFDatepicker, date) || " "
            };
            html += mixins.buildTemplate(templates.day, settings)
        }
        HFDatepicker.days.innerHTML = html
    }

    function updateDateLabel(HFDatepicker) {
        var year = HFDatepicker.currentDate.getFullYear();
        var month = HFDatepicker.currentDate.getMonth();
        HFDatepicker.currentDateLabel.innerHTML = CONST.months[month] + " " + year;
    }

    function showDatepicker(HFDatepicker) {
        HFDatepicker.body.classList.add(CONST.datepickerActiveClass);
        var otherDatepickers = HFDatepickers.filter(function (datepicker) {
            return datepicker !== HFDatepicker;
        });
        otherDatepickers.forEach(function (datepicker) {
            datepicker.closeDatepicker();
        });
        setTimeout(function () {
            document.addEventListener('click', HFDatepicker.closeDatepicker);
        }, 250);
    }

    function initializeDatepicker(selector, settings) {
        var elements = mixins.pickElements(selector);
        var datepickers = [];
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var datepicker = mixins.getHFDatepickerByInput(element);
            if (!datepicker && mixins.checkInput(element)) {
                datepicker = createHFDatepicker(element, settings);
            }
            if (datepicker) {
                datepickers.push(datepicker)
            }
        }
        return datepickers
    }

    function firstInitialization() {
        if (!('remove' in Element.prototype)) {
            Element.prototype.remove = function() {
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
            };
        }
        mixins.prepareTemplates();

        document.addEventListener("DOMContentLoaded", function () {

        });

    }

    firstInitialization();
    window[plugin] = initializeDatepicker;
})();