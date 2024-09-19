
document.getElementById('openBookmarks').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("bookmarks.html") });
});

document.getElementById('newTabOverride').addEventListener('change', function() {
    chrome.storage.sync.set({newTabOverride: this.checked});
});

chrome.storage.sync.get('newTabOverride', function (data) {
    if (data && data.newTabOverride) {
        document.getElementById('newTabOverride').checked = true;
    }
});
