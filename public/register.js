
const name = document.getElementById('name');
const password1 = document.querySelector('#password');
const password2 = document.querySelector('#password2');
const form = document.getElementById('form');
const err = document.getElementById('error');

form.addEventListener('submit', function (e) {
    let message = [];
    if (password1.value !== password2.value) {
        message.push('Password do not match');
    }

    if (message.length > 0) {
        e.preventDefault();
        err.innerHTML = message.join(', ');
    }

})