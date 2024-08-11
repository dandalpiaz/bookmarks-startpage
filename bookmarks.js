function createBookmarkList(bookmarks, parentElement, depth) {
    bookmarks.forEach(function(bookmark) {
        if (bookmark.url) {
            let li = document.createElement("li");
            let a = document.createElement("a");
            a.href = bookmark.url;
            a.textContent = bookmark.title;
            a.target = "_blank";
            li.appendChild(a);
            parentElement.appendChild(li);
        } else if (bookmark.children) {
            // Determine the heading level based on the depth
            let headingTag = `h${Math.min(depth + 1, 6)}`; // Maximum depth of <h6>
            let folderTitle = document.createElement(headingTag);
            folderTitle.textContent = bookmark.title;
            parentElement.appendChild(folderTitle);

            let ul = document.createElement("ul");
            parentElement.appendChild(ul);

            // Increase the depth for nested folders
            createBookmarkList(bookmark.children, ul, depth + 1);
        }
    });
}

chrome.bookmarks.getTree(function(bookmarks) {
    const bookmarkList = document.getElementById("bookmarkList");
    createBookmarkList(bookmarks, bookmarkList, 0);  // Start at depth 0
});
