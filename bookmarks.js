//////////////////////////////////
/////// Get Bookmark Data ////////
//////////////////////////////////

const urlParams = new URLSearchParams(window.location.search);
const startPage = urlParams.get('start');
const isDemo = urlParams.get('demo') === 'true';

document.addEventListener('DOMContentLoaded', function () {
    if (isDemo) {
        fetch('demo.json')
            .then(response => response.json())
            .then(bookmarkTreeNodes => {
                processBookmarks(bookmarkTreeNodes);
            })
            .catch(error => {
                console.error('Error loading demo.json:', error);
                document.getElementById('bookmarksContainer').textContent = 'Error loading demo data.';
            });
    } else {
        chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
            processBookmarks(bookmarkTreeNodes);
        });
    }

    function processBookmarks(bookmarkTreeNodes) {
        const bookmarksContainer = document.getElementById('bookmarksContainer');
        
        if (startPage) {
            const startNode = findStartNode(bookmarkTreeNodes, startPage);
            if (startNode) {
                displayBookmarks([startNode], bookmarksContainer);
            } else {
                bookmarksContainer.textContent = `Folder "${startPage}" not found.`;
            }
        } else {
            displayBookmarks(bookmarkTreeNodes, bookmarksContainer);
        }

        const uls = document.querySelectorAll('ul');

        uls.forEach(ul => {
            let prev = ul.previousElementSibling;
            if (prev) {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'section';
                
                ul.parentNode.insertBefore(sectionDiv, ul);
                sectionDiv.appendChild(prev);
                sectionDiv.appendChild(ul);
            }
        });
        
        const sectionDivs = document.querySelectorAll('.section');
        let sectionsDiv = document.createElement('div');
        sectionsDiv.className = 'sections';
        sectionDivs.forEach(section => {
            if (section.parentElement === sectionsDiv) {
                return;
            }
            if (section.previousElementSibling && section.previousElementSibling.classList.contains('sections')) {
                sectionsDiv = section.previousElementSibling;
            } else {
                sectionsDiv = document.createElement('div');
                sectionsDiv.className = 'sections';
                section.parentNode.insertBefore(sectionsDiv, section);
            }
            sectionsDiv.appendChild(section);
        });
        
        const h1 = document.querySelector('h1');
        if (h1.textContent.slice(-1) === '^') {
            document.title = h1.textContent.slice(0, -1) + ' - Bookmarks Startpage';
        } else {
            document.title = h1.textContent + ' - Bookmarks Startpage';
        }
    }

    function findStartNode(nodes, targetName) {
        for (const node of nodes) {
            if (node.id === targetName && node.children) {
                return node;
            }
            if (node.children) {
                const result = findStartNode(node.children, targetName);
                if (result) return result;
            }
        }
        return null;
    }

    function displayBookmarks(nodes, container, level = 1) {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                const heading = document.createElement('h' + Math.min(level, 6));
                heading.textContent = node.title || 'My Bookmarks';
                heading.id = node.id;
                container.appendChild(heading);

                const folderLink = document.createElement('a');
                folderLink.href = level === 1 ? 'bookmarks.html' : '?start=' + node.id;
                if (isDemo) {
                    folderLink.href += '&demo=true';
                }
                folderLink.textContent = level === 1 ? '^' : '>';
                folderLink.setAttribute('aria-label', level === 1 ? 'Go to bookmarks homepage' : "Go to " + node.title + " folder");
                if (heading.textContent !== 'My Bookmarks') {
                    heading.appendChild(folderLink);
                }
                if (heading.textContent === 'My Bookmarks') {
                    heading.classList.add('sr-only');
                }

                const hasBookmarks = node.children.some(child => child.url);

                if (hasBookmarks) {
                    const ul = document.createElement('ul');
                    container.appendChild(ul);

                    node.children.forEach(child => {
                        if (child.url) {
                            const li = document.createElement('li');
                            const link = document.createElement('a');
                            link.href = child.url;
                            link.textContent = child.title;

                            const favicon = document.createElement('img');
                            favicon.src = 'https://www.google.com/s2/favicons?sz=16&domain_url=' + child.url;
                            favicon.width = 16;
                            favicon.height = 16;
                            favicon.alt = '';

                            link.prepend(favicon);
                            li.appendChild(link);
                            ul.appendChild(li);
                        }
                    });
                }

                displayBookmarks(node.children.filter(child => child.children), container, level + 1);
            }
        });
    }

    setTimeout(() => {
        setStyles();
    }, 0);
});

//////////////////////////////////
/////// Helper Functions /////////
//////////////////////////////////

function lightenOrDarkenColor(hex, percent) {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    percent = percent / 100;

    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    let delta = luminance < 128 ? (percent * 255) : (-percent * 255);
    r = clamp(r + delta);
    g = clamp(g + delta);
    b = clamp(b + delta);

    return "#" + toHex(r) + toHex(g) + toHex(b);
}

function clamp(value) {
    return Math.max(0, Math.min(Math.floor(value), 255));
}

function toHex(value) {
    let hex = value.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function enableSaveDiscardButtons() {
    document.getElementById('save_changes').disabled = false;
    document.getElementById('discard_changes').disabled = false;
}

//////////////////////////////////
/////// On Settings Change ///////
//////////////////////////////////

const r = document.querySelector(':root');

document.getElementById('bg_color').oninput = function () {
	r.style.setProperty('--user-background-color', this.value);
    r.style.setProperty('--scrollbar-color', lightenOrDarkenColor(this.value, 27));
    enableSaveDiscardButtons();
}

document.getElementById('title_color').oninput = function () {
    r.style.setProperty('--user-title-color', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('heading_color').oninput = function () {
    r.style.setProperty('--user-heading-color', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('link_color').oninput = function () {
    r.style.setProperty('--user-link-color', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('title_font').onchange = function () {
    r.style.setProperty('--user-title-font', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('heading_font').onchange = function () {
    r.style.setProperty('--user-heading-font', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('link_font').onchange = function () {
    r.style.setProperty('--user-link-font', this.value);
    enableSaveDiscardButtons();
}

document.getElementById('column_size').onchange = function () {
    r.style.setProperty('--user-column-size', this.value + 'px');
    enableSaveDiscardButtons();
}

document.getElementById('hide_default_folders').onchange = function () {
    const h2s = document.querySelectorAll('h2');
    h2s.forEach(h2 => {
        const textContentLower = h2.textContent.toLowerCase();
        if (this.checked) {
            if (textContentLower.includes('other bookmarks') || textContentLower.includes('bookmarks bar')) {
                h2.classList.add('hidden-folder');
            }
        } else {
            if (textContentLower.includes('other bookmarks') || textContentLower.includes('bookmarks bar')) {
                h2.classList.remove('hidden-folder');
            }
        }
    });
    enableSaveDiscardButtons();
}

//////////////////////////////////
///// Submit Settings Change /////
//////////////////////////////////

document.getElementById('settings').onsubmit = function () {
    const bgColor = document.getElementById('bg_color').value;
    const titleColor = document.getElementById('title_color').value;
    const headingColor = document.getElementById('heading_color').value;
    const linkColor = document.getElementById('link_color').value;
    const titleFont = document.getElementById('title_font').value;
    const headingFont = document.getElementById('heading_font').value;
    const linkFont = document.getElementById('link_font').value;
    const columnSize = document.getElementById('column_size').value;
    const hideDefaultFolders = document.getElementById('hide_default_folders').checked;

    if (!isDemo) {
        chrome.storage.sync.set({ bgColor });
        chrome.storage.sync.set({ titleColor });
        chrome.storage.sync.set({ headingColor });
        chrome.storage.sync.set({ linkColor });
        chrome.storage.sync.set({ titleFont });
        chrome.storage.sync.set({ headingFont });
        chrome.storage.sync.set({ linkFont });
        chrome.storage.sync.set({ columnSize });
        chrome.storage.sync.set({ hideDefaultFolders });
    }

    const live = document.getElementById('live');
    live.textContent = '';
    live.style.display = 'none';
    setTimeout(() => {
        if (isDemo) {
            live.textContent = 'Settings cannot be saved in demo mode.';
            live.style.color = '#ffffff';
            live.style.display = 'block';
            live.style.backgroundColor = '#444444';
        } else {
            live.textContent = 'Settings saved successfully!';
            live.style.color = 'lightgreen';
            live.style.display = 'block';
            live.style.backgroundColor = 'darkgreen';
        }
    }, 500);

    document.getElementById('save_changes').disabled = true;
    document.getElementById('discard_changes').disabled = true;

    return false;
}

//////////////////////////////////
////// Initialize Settings ///////
//////////////////////////////////

function setStyles() {
    if (isDemo) {
        document.getElementById('site-title').href = 'bookmarks.html?demo=true';
        document.getElementById('bg_color').value = '#000000';
        r.style.setProperty('--user-background-color', '#000000');
        r.style.setProperty('--scrollbar-color', '#444444');
        document.getElementById('title_color').value = '#ffffff';
        r.style.setProperty('--user-title-color', '#ffffff');
        document.getElementById('heading_color').value = '#52ff94';
        r.style.setProperty('--user-heading-color', '#52ff94');
        document.getElementById('link_color').value = '#b0e0e6';
        r.style.setProperty('--user-link-color', '#b0e0e6');
        document.getElementById('title_font').value = 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
        r.style.setProperty('--user-title-font', 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
        document.getElementById('heading_font').value = 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
        r.style.setProperty('--user-heading-font', 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
        document.getElementById('link_font').value = 'Noto Serif';
        r.style.setProperty('--user-link-font', 'Noto Serif');
        document.getElementById('column_size').value = '240';
        r.style.setProperty('--user-column-size', '240px');
        document.getElementById('hide_default_folders').checked = false;
        const h2s = document.querySelectorAll('h2');
        h2s.forEach(h2 => {
            if ( h2.textContent.includes('Other bookmarks') || h2.textContent.includes('Bookmarks bar') ) {
                h2.classList.remove('hidden-folder');
            }
        });
        return;
    }

    chrome.storage.sync.get('bgColor', function (data) {
        if (data && data.bgColor) {
            r.style.setProperty('--user-background-color', data.bgColor);
            document.getElementById('bg_color').value = data.bgColor;
            r.style.setProperty('--scrollbar-color', lightenOrDarkenColor(data.bgColor, 27));
        } else {
            r.style.setProperty('--user-background-color', '#000000');
            document.getElementById('bg_color').value = '#000000';
            r.style.setProperty('--scrollbar-color', '#444444');
        }
    });

    chrome.storage.sync.get('titleColor', function (data) {
        if (data && data.titleColor) {
            r.style.setProperty('--user-title-color', data.titleColor);
            document.getElementById('title_color').value = data.titleColor;
        } else {
            r.style.setProperty('--user-title-color', '#ffffff');
            document.getElementById('title_color').value = '#ffffff';
        }
    });

    chrome.storage.sync.get('headingColor', function (data) {
        if (data && data.headingColor) {
            r.style.setProperty('--user-heading-color', data.headingColor);
            document.getElementById('heading_color').value = data.headingColor;
        } else {
            r.style.setProperty('--user-heading-color', '#52ff94');
            document.getElementById('heading_color').value = '#52ff94';
        }
    });

    chrome.storage.sync.get('linkColor', function (data) {
        if (data && data.linkColor) {
            r.style.setProperty('--user-link-color', data.linkColor);
            document.getElementById('link_color').value = data.linkColor;
        } else {
            r.style.setProperty('--user-link-color', '#b0e0e6');
            document.getElementById('link_color').value = '#b0e0e6';
        }
    });

    chrome.storage.sync.get('titleFont', function (data) {
        if (data && data.titleFont) {
            r.style.setProperty('--user-title-font', data.titleFont);
            document.getElementById('title_font').value = data.titleFont;
        } else {
            r.style.setProperty('--user-title-font', 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
            document.getElementById('title_font').value = 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
        }
    });

    chrome.storage.sync.get('headingFont', function (data) {
        if (data && data.headingFont) {
            r.style.setProperty('--user-heading-font', data.headingFont);
            document.getElementById('heading_font').value = data.headingFont;
        } else {
            r.style.setProperty('--user-heading-font', 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
            document.getElementById('heading_font').value = 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
        }
    });

    chrome.storage.sync.get('linkFont', function (data) {
        if (data && data.linkFont) {
            r.style.setProperty('--user-link-font', data.linkFont);
            document.getElementById('link_font').value = data.linkFont;
        } else {
            r.style.setProperty('--user-link-font', 'Noto Serif');
            document.getElementById('link_font').value = 'Noto Serif';
        }
    });

    chrome.storage.sync.get('columnSize', function (data) {
        if (data && data.columnSize) {
            r.style.setProperty('--user-column-size', data.columnSize.toString() + 'px');
            document.getElementById('column_size').value = data.columnSize;
        } else {
            r.style.setProperty('--user-column-size', '240px');
            document.getElementById('column_size').value = '240';
        }
    });

    chrome.storage.sync.get('hideDefaultFolders', function (data) {
        if (data && data.hideDefaultFolders) {
            document.getElementById('hide_default_folders').checked = data.hideDefaultFolders;
            const h2s = document.querySelectorAll('h2');
            h2s.forEach(h2 => {
                const textContentLower = h2.textContent.toLowerCase();
                if (data.hideDefaultFolders) {
                    if (textContentLower.includes('other bookmarks') || textContentLower.includes('bookmarks bar')) {
                        h2.classList.add('hidden-folder');
                    }
                } else {
                    if (textContentLower.includes('other bookmarks') || textContentLower.includes('bookmarks bar')) {
                        h2.classList.remove('hidden-folder');
                    }
                }
            });
        } else {
            document.getElementById('hide_default_folders').checked = false;
            const h2s = document.querySelectorAll('h2');
            h2s.forEach(h2 => {
                const textContentLower = h2.textContent.toLowerCase();
                if (textContentLower.includes('other bookmarks') || textContentLower.includes('bookmarks bar')) {
                    h2.classList.remove('hidden-folder');
                }
            });
        }
    });
}

//////////////////////////////////
//// Discard Settings Changes ////
//////////////////////////////////

document.getElementById('discard_changes').onclick = function () {
    setStyles();
    document.getElementById('save_changes').disabled = true;
    document.getElementById('discard_changes').disabled = true;
    const live = document.getElementById('live');
    live.textContent = '';
    live.style.display = 'none';
    setTimeout(() => {
        live.textContent = 'Changes discarded.';
        live.style.color = '#ffffff';
        live.style.display = 'block';
        live.style.backgroundColor = '#444444';
    }, 500);
}

//////////////////////////////////
///// Manage Details/Summary /////
//////////////////////////////////

document.querySelector('main').addEventListener('focusin', () => {
    document.getElementById('customize').open = false;
});

document.addEventListener('click', (event) => {
    const details = document.querySelector('details');
    if (details.open && !details.contains(event.target)) {
        details.open = false;
    }
});
