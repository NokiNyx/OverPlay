# OverPlay

Browser extension - YouTube chat overlay when playing streams / videos in fullscreen mode. Read and write chat messages while your YouTube player is in fullscreen mode.

<a href="https://addons.mozilla.org/en-US/firefox/addon/overplay/">
    <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" height="72px">
</a>

<a href="https://chromewebstore.google.com/detail/overplay/dfbdkehdednnaopopipjjagnhdddpkmp">
    <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/HRs9MPufa1J1h5glNhut.png" height="72px">
</a>

[Edge Add-Ons](https://microsoftedge.microsoft.com/addons/detail/eibkfhpmcjnhgloaiacijolfpdaiebjb)

Opera: official store listing still pending, but the extension should be installable through Chrome Web Store on Opera.

---

Read and write chat messages while your YouTube player is in fullscreen mode.

 - Messages appear as semi-transparent bubbles of text.
 - The message input area is invisible by default but shows up when you hover over the bottom area of the chat.
 - The overlay is on the left side of the screen by default, but can be moved by dragging the white box on the top-left of the overlay, and can be resized by dragging the resize widget on the bottom right of the overlay. (if it is too hard to see, hover your mouse around that area until the cursor changes into the resize cursor)

---

# Development

You will need to [install Pkl](https://pkl-lang.org/main/current/pkl-cli/index.html#installation) in order to generate the `manifest.json`. If you are downloading and installing manually (not using a package manager like Homebrew), you may need to place the executable under one of the directories in your `$PATH`, e.g. `$HOME/.local/bin`, so that `build.sh` can find the command.

To build, simply run `build.sh` which will generate build directories under `build/{build_target}/`. Currently, the build targets are `firefox` and `chromium` (including Edge and Opera).

---

### Credits

`assets/move.svg` and `assets/resize.svg` were edited from icons obtained from [UIcons by Flaticon](https://www.flaticon.com/uicons).
