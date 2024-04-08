// at the moment this script is only run in Firefox
// (Chromium-based browsers do not support `background.scripts`, they only support `background.service_worker`)

// request for YouTube host permissions on install
browser.runtime.onInstalled.addListener(async () => {
    const permsGranted = await browser.permissions.contains({ origins: ["https://www.youtube.com/*"] })
    if (!permsGranted) {
        console.log("YT host permission not granted, requesting")
        browser.tabs.create({ url: "permission_request_page/index.html" })
    } else {
        console.log("YT host permission already granted")
    }
})
