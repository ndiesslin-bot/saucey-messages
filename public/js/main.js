'use strict';

const message = (() => {
  const SECRET = 'SauceyMessagesSecret';
  const DEFAULT_FLAVOR = 0;
  const MAX_MESSAGE_LENGTH = 180;

  const randomMessages = [
    'Write your saucey message here ;P',
    'You look nice!',
    "I'm not saying this looks like Taco Bell sauce.",
    'Okay this looks a little bit like Taco Bell sauce.'
  ];

  const getMessageElement = () => document.querySelector('.sauce-packet__message');
  const getFlavorInputs = () => document.querySelectorAll('.flavor-selector__input');
  const getCopyLinkElement = () => document.querySelector('.sharing-links__copy-link');

  const getRandomMessage = () => randomMessages[Math.floor(Math.random() * randomMessages.length)];

  const encode = (plainText) => {
    const b64 = CryptoJS.AES.encrypt(plainText, SECRET).toString();
    const e64 = CryptoJS.enc.Base64.parse(b64);
    return e64.toString(CryptoJS.enc.Hex);
  };

  const decode = (cipherText) => {
    try {
      const reb64 = CryptoJS.enc.Hex.parse(cipherText);
      const bytes = reb64.toString(CryptoJS.enc.Base64);
      const decrypted = CryptoJS.AES.decrypt(bytes, SECRET);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return '';
    }
  };

  const sanitizeMessage = (input) => {
    if (!input) return '';
    const normalized = input
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized.slice(0, MAX_MESSAGE_LENGTH);
  };

  const saveMessage = () => {
    const url = new URL(window.location.href);
    const checkedFlavor = document.querySelector('.flavor-selector__input:checked');
    const currentFlavor = checkedFlavor ? checkedFlavor.value : String(DEFAULT_FLAVOR);
    const plainTextMessage = sanitizeMessage(getMessageElement().innerText);
    const encryptedMessage = encode(plainTextMessage);

    url.searchParams.set('packet-message', encryptedMessage);
    url.searchParams.set('flavor', currentFlavor);

    getCopyLinkElement().value = url.toString();
  };

  const clickFlavor = (flavor) => {
    const flavorOptions = getFlavorInputs();
    const numericFlavor = Number.parseInt(flavor, 10);
    const safeFlavor = Number.isInteger(numericFlavor) ? numericFlavor : DEFAULT_FLAVOR;

    const target = [...flavorOptions].find((option) => Number.parseInt(option.value, 10) === safeFlavor);
    (target || flavorOptions[0]).click();
  };

  const loadMessage = () => {
    const url = new URL(window.location.href);
    const encryptedMessage = url.searchParams.get('packet-message');
    const flavor = url.searchParams.get('flavor');

    let loaded = encryptedMessage ? decode(encryptedMessage) : '';
    loaded = sanitizeMessage(loaded);

    if (!loaded) {
      loaded = getRandomMessage();
    }

    getMessageElement().innerText = loaded;
    clickFlavor(flavor);
  };

  return {
    save: saveMessage,
    load: loadMessage,
    sanitizeMessage,
    maxLength: MAX_MESSAGE_LENGTH
  };
})();

const alertMessage = (() => {
  const element = document.querySelector('.sharing-links__copy-message');

  const showElement = () => {
    element.classList.add('display-block');
  };

  const triggerHide = () => {
    setTimeout(() => {
      element.classList.remove('display-block');
    }, 3000);
  };

  const initialize = () => {
    showElement();
    triggerHide();
  };

  return {
    initialize
  };
})();

const clickHandler = (() => {
  const sauces = [
    { title: 'Mild', cssClass: 'sauce-packet--sauce-1', themeColor: '#f69e47' },
    { title: 'Hot', cssClass: 'sauce-packet--sauce-2', themeColor: '#fa6429' },
    { title: 'Fire', cssClass: 'sauce-packet--sauce-3', themeColor: '#f63e1c' },
    { title: 'Diablo', cssClass: 'sauce-packet--sauce-4', themeColor: '#5d0708' },
    { title: 'Wild', cssClass: 'sauce-packet--sauce-5', themeColor: '#0ece4b' }
  ];

  const changeThemeColor = (themeColor) => {
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    metaThemeColor.setAttribute('content', themeColor);
  };

  const flavorHandler = () => {
    document.addEventListener('click', (event) => {
      const flavorInput = event.target.closest('.flavor-selector__input');
      if (!flavorInput) return;

      const selectedValue = Number.parseInt(flavorInput.value, 10);
      const targetSauce = sauces[selectedValue] || sauces[0];

      const targetTitle = document.querySelector('.sauce-packet__title');
      const saucePacket = document.querySelector('.sauce-packet');

      targetTitle.innerText = targetSauce.title;
      saucePacket.className = `sauce-packet ${targetSauce.cssClass}`;
      changeThemeColor(targetSauce.themeColor);
      message.save();
    });
  };

  const messageHandler = () => {
    document.addEventListener('input', (event) => {
      const messageElement = event.target.closest('.sauce-packet__message');
      if (!messageElement) return;

      const sanitized = message.sanitizeMessage(messageElement.innerText);
      if (messageElement.innerText !== sanitized) {
        messageElement.innerText = sanitized;
      }

      message.save();
    });

    document.addEventListener('paste', (event) => {
      const messageElement = event.target.closest('.sauce-packet__message');
      if (!messageElement) return;

      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData('text');
      const sanitized = message.sanitizeMessage(text);
      document.execCommand('insertText', false, sanitized);
    });
  };

  const legacyCopyToClipboard = async (copyText) => {
    copyText.classList.add('display-block');
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand('copy');
    copyText.classList.remove('display-block');
  };

  const copyLinkToClipboard = async () => {
    const copyText = document.querySelector('.sharing-links__copy-link');
    const shareUrl = copyText.value;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    await legacyCopyToClipboard(copyText);
  };

  const copyHandler = () => {
    document.addEventListener('click', async (event) => {
      const copyButton = event.target.closest('.sharing-links__copy');
      if (!copyButton) return;

      event.preventDefault();

      try {
        await copyLinkToClipboard();
        alertMessage.initialize();
      } catch {
        // no-op: prevent runtime error from breaking app if clipboard API is unavailable.
      }
    });
  };

  const initialize = () => {
    flavorHandler();
    messageHandler();
    copyHandler();
  };

  return {
    initialize
  };
})();

clickHandler.initialize();
message.load();
