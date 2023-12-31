const FULLSCREEN_PLAYER_SELECTOR = '#player-full-bleed-container'

class OverlayChatManager {
  constructor(chat, chatIframe) {
    this.chat = chat
    this.theater = document.querySelector(FULLSCREEN_PLAYER_SELECTOR)
    this.chatPlaceholder = document.createElement('div')

    this.chatMask = null
    this.dragButton = null
    this.fullscreenObserver = null

    this.chatIframe = chatIframe

    this.listenToFullscreen()

    this.chat.addEventListener('mouseenter', () => {
      this.chatIframe.contentDocument.querySelector('#item-scroller').style.scrollbarColor = 'rgba(200, 200, 200) rgba(100, 100, 100, 0.75)'
    })
    this.chat.addEventListener('mouseleave', () => {
      const MIN_COLUMN_WIDTH = 298
      this.chatIframe.contentDocument.querySelector('#item-scroller').style.scrollbarColor = 'transparent transparent'
      let nColumns = Math.floor(this.chat.clientWidth / MIN_COLUMN_WIDTH)
      // `calc(${Math.floor(100 / nColumns)}% - 28px)`
    })

    let observerOptions = {
      childList: true,
      attributes: false,
      characterData: false,
      subtree: false,
    }
    this.chatParentObserver = new MutationObserver(this.handleChatParentObservation.bind(this))
    this.chatParentObserver.observe(chat.parentNode, observerOptions)
  }

  handleChatParentObservation() {
    if (this.chat.parentNode === null) {
      // chat node orphaned, tear down
      this.teardown()
    }
  }

  teardown() {
    if (this.fullscreenObserver) {
      this.fullscreenObserver.disconnect()
    }
    if (this.chatParentObserver) {
      this.chatParentObserver.disconnect()
    }
    console.log("Tore down chat manager.")
  }

  useOverlayMode() {
    document.body.classList.add('overlay-chat')
    this.chat.parentNode.replaceChild(this.chatPlaceholder, this.chat)
    this.theater.appendChild(this.chat)
    this.chatIframe.contentWindow.addEventListener("DOMContentLoaded", (e) => {
      this.chatIframe.contentDocument.body.classList.add('overlay-chat')
    }, {'once': true})
    this.addChatMask()
    this.addDragButton()
  }

  useNormalMode() {
    document.body.classList.remove('overlay-chat')
    if (this.chatPlaceholder.parentNode !== null) {
      this.chatPlaceholder.parentNode.replaceChild(this.chat, this.chatPlaceholder)
    }
    this.chatIframe.contentDocument.body.classList.remove('overlay-chat')
  }

  addChatMask() {
    this.chatMask = document.createElement('div')
    this.chatMask.classList.add('chat-mask')
    this.chat.appendChild(this.chatMask)
    console.log('Added chat mask.')
  }

  addDragButton() {
    let chat = this.chat
    let chatMask = this.chatMask
    let btn = document.createElement('div')
    btn.classList.add('drag-button')
    btn.title = "Hold to drag."

    function startDrag(e) {
      e = e || window.event;
      e.preventDefault();
      chatMask.style.display = 'block'
      document.addEventListener('mousemove', dragHandler);
      document.addEventListener('mouseup', stopDrag, { once: true })
      console.log("Started drag")
    }

    function stopDrag(e) {
      e = e || window.event;
      e.preventDefault();
      chatMask.style.display = 'none'
      document.removeEventListener('mousemove', dragHandler);
      console.log("Stopped drag")
    }

    function dragHandler(e) {
      e = e || window.event;
      e.preventDefault();
      // set the element's new position:
      console.log(e.clientY)
      let newTop = e.clientY + 'px'
      chat.style.top = newTop

      let newLeft = `max(${e.clientX}px, 24px)`
      chat.style.left = newLeft
    }

    btn.addEventListener('mousedown', startDrag)

    chat.appendChild(btn)
    this.dragButton = btn

    console.log('Added drag button.')
  }

  listenToFullscreen() {
    const showHideButton = this.showHideButton
    const playerTheaterContainer = document.querySelector(FULLSCREEN_PLAYER_SELECTOR)
    const useOverlayMode = this.useOverlayMode.bind(this)
    const useNormalMode = this.useNormalMode.bind(this)

    function fullscreenHandler() {
      const isFullscreen = document.fullscreenElement !== null
      const theaterMode = playerTheaterContainer.querySelector('#player-container') !== null
      if (theaterMode && isFullscreen) {
        // fullscreen mode started
        useOverlayMode()
        console.log('Fullscreen mode detected, enabling overlay chat.')
      } else {
        // fullscreen mode stopped
        useNormalMode()
        console.log('Non-fullscreen mode detected, disabling overlay chat.')
      }
    }

    document.addEventListener('fullscreenchange', fullscreenHandler)
    fullscreenHandler()
    console.log('Started full screen handler.')
  }

  static listenAndEnableOverlayChat() {
    let chatManager = null
    let observer = null
    const observerOptions = {
      childList: true,
      attributes: false,
      characterData: false,
      subtree: true,
    }
    function enable() {
      let chat = document.querySelector('ytd-live-chat-frame#chat')
      if (chat !== null && (chatManager === null || (chatManager !== false && chatManager.chat.parentNode === null))) {
        console.log('Creating overlay chat manager.')
        chatManager = false
        chatManager = new OverlayChatManager(chat, document.querySelector('#chatframe'))
        console.log('Created overlay chat manager.')
      }
    }
    observer = new MutationObserver(enable)
    observer.observe(document.body, observerOptions)
    console.log('Started page mutation observer.')
  }
}

OverlayChatManager.listenAndEnableOverlayChat()
