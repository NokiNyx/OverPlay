const FULLSCREEN_PLAYER_SELECTOR = '#player-full-bleed-container'

class OverlayChatManager {
  constructor(chat, chatIframe) {
    this.chat = chat
    this.theater = document.querySelector(FULLSCREEN_PLAYER_SELECTOR)
    this.chatPlaceholder = document.createElement('div')

    this.dragMasks = null
    this.dragButton = null
    this.fullscreenObserver = null

    this.chatIframe = chatIframe

    this.chatUrl = null
    this.chatIframe.addEventListener('load', () => {
      const url = this.chatIframe.contentDocument.location.href
      if (url !== 'about:blank') {
        this.chatUrl = url
      }
    })

    /** Whether the "chat has not loaded yet, retry when loaded to use overlay" alert has been shown already */
    this.chatLoadWarningDisplayed = false

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

  getVideoId() {
    return document.querySelector('ytd-watch-flexy').getAttribute('video-id')
  }

  saveChatDimensions() {
    const vidId = this.getVideoId()
    if (!vidId) {
      return  // don't support anything other than the v param (e.g. clips are unsupported)
    }
    const dimensions = {
      vidId,
      top: document.documentElement.style.getPropertyValue('--overlay-chat-top'),
      left: document.documentElement.style.getPropertyValue('--overlay-chat-left'),
      height: document.documentElement.style.getPropertyValue('--overlay-chat-height'),
      width: document.documentElement.style.getPropertyValue('--overlay-chat-width'),
    }
    const savedDimensions = JSON.parse(window.localStorage.getItem('overplaySavedDimensions')) ?? []
    const dimIdx = savedDimensions.findIndex(dims => dims.vidId == vidId)
    if (dimIdx !== -1) {
      // remove the original save for this vidId first
      savedDimensions.splice(dimIdx, 1)
    }
    savedDimensions.splice(0, savedDimensions.length - 24)
    savedDimensions.push(dimensions)
    window.localStorage.setItem('overplaySavedDimensions', JSON.stringify(savedDimensions))
  }

  loadChatDimensions() {
    const savedDimensions = JSON.parse(window.localStorage.getItem('overplaySavedDimensions'))
    const vidId = this.getVideoId()
    const dimensions = savedDimensions?.find(dims => dims.vidId === vidId)
    if (!dimensions) {
      return
    }
    document.documentElement.style.setProperty('--overlay-chat-top', dimensions.top)
    document.documentElement.style.setProperty('--overlay-chat-left', dimensions.left)
    document.documentElement.style.setProperty('--overlay-chat-height', dimensions.height)
    document.documentElement.style.setProperty('--overlay-chat-width', dimensions.width)
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
    if (!this.chatUrl && !this.chatIframe.src) {
      // if the chat hasn't loaded yet, do nothing
      if (!this.chatLoadWarningDisplayed) {
        alert("The chat has not loaded yet. Try to enter full-screen again after the chat is loaded to use the chat overlay.")
        this.chatLoadWarningDisplayed = true
      }
      return
    }

    if (this.chatIframe.src !== this.chatUrl) {
      // make it auto-load the chat URL upon rerender (when moved around by entering / exiting fullscreen)
      this.chatIframe.src = this.chatUrl
    }

    document.body.classList.add('overlay-chat')
    this.chat.parentNode.replaceChild(this.chatPlaceholder, this.chat)
    this.theater.querySelector('#movie_player').appendChild(this.chat)

    this.overlayChatLoadListener = () => {
      this.chatIframe.contentDocument.body.classList.add('overlay-chat')
    }
    this.chatIframe.addEventListener('load', this.overlayChatLoadListener)

    this.addDragMasks()
    this.addResizeHandle()
    this.addDragButton()

    this.loadChatDimensions()
    this.setBottomChromeMode()
  }

  useNormalMode() {
    document.body.classList.remove('overlay-chat')
    if (this.chatPlaceholder.parentNode !== null) {
      this.chatPlaceholder.parentNode.replaceChild(this.chat, this.chatPlaceholder)
    }
    this.chatIframe.removeEventListener('load', this.overlayChatLoadListener)
  }

  setBottomChromeMode() {
    const { left, right, bottom } = this.chat.getBoundingClientRect()
    const { bottom: playerBottom, width: playerWidth } = this.chat.parentNode.getBoundingClientRect()
    document.body.classList.remove('bottom-chrome-left', 'bottom-chrome-right')
    if (playerBottom - bottom < 60) {
      const rightSpace = playerWidth - right
      document.body.classList.add(rightSpace >= left ? 'bottom-chrome-right' : 'bottom-chrome-left')
    }
  }

  addDragMasks() {
    if (this.dragMasks) {
      return
    }

    // two drag masks are needed: Firefox needs `chatMask`, Chromium needs `bodyMask`
    const chatMask = document.createElement('div')
    chatMask.classList.add('drag-mask')
    this.chat.appendChild(chatMask)
    const bodyMask = chatMask.cloneNode()
    document.body.appendChild(bodyMask)

    this.dragMasks = [chatMask, bodyMask]

    console.log('Added drag masks.')
  }

  addDragButton() {
    if (this.dragButton) {
      return
    }

    const chat = this.chat
    const btn = document.createElement('div')
    const saveChatDimensions = this.saveChatDimensions.bind(this)
    const setBottomChromeMode = this.setBottomChromeMode.bind(this)
    btn.classList.add('drag-button')
    btn.title = "Hold to drag."

    function startDrag(e) {
      document.body.classList.add('overlay-chat-dragging')
      // temporarily remove bottom chrome mode to reduce performance issues
      document.body.classList.remove('bottom-chrome-left', 'bottom-chrome-right')
      document.addEventListener('mousemove', dragHandler)
      document.addEventListener('mouseup', stopDrag, { once: true })
      console.log("Started drag")
    }

    function stopDrag(e) {
      document.body.classList.remove('overlay-chat-dragging')
      document.removeEventListener('mousemove', dragHandler)
      saveChatDimensions()
      setBottomChromeMode()
      console.log("Stopped drag")
    }

    function dragHandler(e) {
      // set the element's new position:
      console.log(e.clientY)
      let newTop = e.clientY + 'px'
      document.documentElement.style.setProperty('--overlay-chat-top', newTop)

      let newLeft = e.clientX + 'px'
      document.documentElement.style.setProperty('--overlay-chat-left', newLeft)
    }

    btn.addEventListener('mousedown', startDrag)

    chat.appendChild(btn)
    this.dragButton = btn

    console.log('Added drag button.')
  }

  addResizeHandle() {
    if (this.resizeHandle) {
      return
    }

    const chat = this.chat
    const btn = document.createElement('div')
    const saveChatDimensions = this.saveChatDimensions.bind(this)
    const setBottomChromeMode = this.setBottomChromeMode.bind(this)
    btn.classList.add('resize-handle')
    btn.title = "Hold to resize."

    function startDrag(e) {
      document.body.classList.add('overlay-chat-resizing')
      // temporarily remove bottom chrome mode to reduce performance issues
      document.body.classList.remove('bottom-chrome-left', 'bottom-chrome-right')
      document.addEventListener('mousemove', dragHandler)
      document.addEventListener('mouseup', stopDrag, { once: true })
      console.log("Started resize")
    }

    function stopDrag(e) {
      document.body.classList.remove('overlay-chat-resizing')
      document.removeEventListener('mousemove', dragHandler)
      saveChatDimensions()
      setBottomChromeMode()
      console.log("Stopped resize")
    }

    function dragHandler(e) {
      const { x, y } = chat.getBoundingClientRect()
      let newHeight = e.clientY - y + 1 + 'px'
      document.documentElement.style.setProperty('--overlay-chat-height', newHeight)

      let newWidth = e.clientX - x + 1 + 'px'
      document.documentElement.style.setProperty('--overlay-chat-width', newWidth)
    }

    btn.addEventListener('mousedown', startDrag)

    chat.appendChild(btn)
    this.resizeHandle = btn

    console.log('Added resize handle.')
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
