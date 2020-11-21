const HFPinInput = require('../HelloFlowPinInput');

document.body.innerHTML = '<input type="text" id="test">';

describe('initialization', () => {
    test('HelloFlowPinInput is defined', () => {
        expect(window.HelloFlowPinInput).toBeDefined();
    });
    test('supporting of Node, NodeList, Node array and css selector', () => {
        document.body.innerHTML = '<input type="text" id="pincode" class="pininput"><input type="text" name="pin" class="pininput">';
        let element1 = document.querySelector("#pincode");
        let element2 = document.querySelectorAll('[name="pin"]')[0];
        let elementArray = [element1, element2];
        let elementList = document.querySelectorAll(".pininput");

        let inputViaCSS = HelloFlowPinInput(".pininput")[0];
        let inputViaNode = HelloFlowPinInput(element1)[0];
        let inputViaNodeList = HelloFlowPinInput(elementList)[0];
        let inputViaNodeArray = HelloFlowPinInput(elementArray)[0];

        expect(inputViaCSS).toBe(inputViaNode);
        expect(inputViaNode).toBe(inputViaNodeList);
        expect(inputViaNodeList).toBe(inputViaNodeArray);
    });
});

describe('callbacks', () => {
    document.body.innerHTML = '<input type="text" id="testInput">';
    let initializeMock = jest.fn();
    let changeeMock = jest.fn();
    let completeMock = jest.fn();
    let input = HelloFlowPinInput("#testInput", {
        change: changeeMock,
        complete: completeMock,
        initialize: initializeMock,
    })[0];

    test('initialize', () => {
        expect(initializeMock).toBeCalled();
    });

    test('change', () => {
        input.setValueFromText("134");
        expect(changeeMock).toBeCalled();
    });

    test('complete', () => {
        input.setValueFromText("1345");
        expect(completeMock).toBeCalled();
    });
});
describe('DOM', () => {
    let input = null;
    test('correct count of inputs (5)', () => {
        document.body.innerHTML = '<input type="text" id="testInput1">';
        let options = {
            digits: 5,
        };

        input = HelloFlowPinInput("#testInput1", options)[0];
        let inputs = input.container.querySelectorAll("input");
        expect(inputs.length).toBe(options.digits);
    });

    test('focus on next input after filling', () => {
        let inputs = input.container.querySelectorAll("input");
        let first = inputs[0];
        let second = inputs[1];
        const event1 = new KeyboardEvent('keydown', {target: first, keyCode: 50});
        const event2 = new KeyboardEvent('keyup', {target: first, keyCode: 50});
        first.value = "1";
        first.focus();
        first.dispatchEvent(event1);
        first.dispatchEvent(event2);

        expect(document.activeElement === second).toBeTruthy();
    });

    test('focus on previous input after delete', () => {
        let inputs = input.container.querySelectorAll("input");
        let third = inputs[1];
        let fourth = inputs[2];
        const event1 = new KeyboardEvent('keydown', {target: fourth, keyCode: 8});
        const event2 = new KeyboardEvent('keyup', {target: fourth, keyCode: 8});
        fourth.value = "";
        fourth.focus();
        fourth.dispatchEvent(event1);
        fourth.dispatchEvent(event2);

        expect(document.activeElement === third).toBeTruthy();
    });

});
