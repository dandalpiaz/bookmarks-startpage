
chrome.tabs.onCreated.addListener(function(tab) {
    chrome.storage.sync.get('newTabOverride', function (data) {
        if (data && data.newTabOverride) {
            if (tab.pendingUrl === "chrome://newtab/") {
                chrome.tabs.update(tab.id, {
                    url: chrome.runtime.getURL('bookmarks.html')
                });
            }
        }
    });   
});
