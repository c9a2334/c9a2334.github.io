document.addEventListener("DOMContentLoaded", documentLoaded);

function documentLoaded() {
    prepareModalInner();
}

function prepareModalInner() {
    var button = document.querySelector('.modal-button');
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

    button.addEventListener('click', function () {
        alert("verification is done")
    })
}

var pincode = 0;

/* some test functions */
function sendSMS() {
    setTimeout(function () {
        pincode = (Math.random() + "").substring(2, 6);
        alert("Your pincode is " + pincode)
    }, 1000)
}

function mockRequest(value, callback) {
    setTimeout(function () {
        callback(value === pincode)
    }, 3000)
}
