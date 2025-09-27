
document.getElementById('openBookmarks').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("bookmarks.html") });
});
