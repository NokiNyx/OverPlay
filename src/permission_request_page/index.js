const extension = browser ?? chrome;

function requestPerms() {
    extension.permissions.request({ origins: ['https://www.youtube.com/*']})
        .then(granted => granted ? window.close() : null)
}

document.querySelector('button').addEventListener('click', requestPerms)
