document.addEventListener("DOMContentLoaded", documentLoaded);

function documentLoaded() {
    prepareModalInner();
}

function prepareModalInner() {
    var button = document.querySelector('.modal-button');
    HelloFlowPinInput('[name="pin"]', {
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

    button.addEventListener('click', function () { // for make sure that button can be clicked
        alert("verification is done")
    })
}


function mockRequest(value, callback) {
    setTimeout(function () {
        callback(value === "1111")
    }, 3000)
}
