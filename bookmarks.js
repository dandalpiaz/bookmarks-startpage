document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const startPage = urlParams.get('start');

    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
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
    });

    function findStartNode(nodes, targetName) {
        for (const node of nodes) {
            if (node.title === targetName && node.children) {
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
                container.appendChild(heading);

                const folderLink = document.createElement('a');
                folderLink.href = level === 1 ? 'bookmarks.html' : '?start=' + node.title;
                folderLink.textContent = level === 1 ? '^' : '>';
                folderLink.setAttribute('aria-label', level === 1 ? 'Go to bookmarks homepage' : "Go to " + node.title + " folder");
                if (heading.textContent !== 'My Bookmarks') {
                    heading.appendChild(folderLink);
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

                            li.appendChild(favicon);
                            li.appendChild(link);
                            ul.appendChild(li);
                        }
                    });
                }

                displayBookmarks(node.children.filter(child => child.children), container, level + 1);
            }
        });
    }
});

// Wait for 10 milliseconds after the page has loaded
window.addEventListener('load', () => {
    setTimeout(() => {
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
            document.title = h1.textContent.slice(0, -1) + ' - Bookmarks Viewer';
        } else {
            document.title = h1.textContent + ' - Bookmarks Viewer';
        }
        
    }, 10);
});

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

const r = document.querySelector(':root');

document.getElementById('bg_color').oninput = function () {
	r.style.setProperty('--user-background-color', this.value);
    r.style.setProperty('--scrollbar-color', lightenOrDarkenColor(this.value, 27));
}

document.getElementById('title_color').oninput = function () {
    r.style.setProperty('--user-title-color', this.value);
}

document.getElementById('heading_color').oninput = function () {
    r.style.setProperty('--user-heading-color', this.value);
}

document.getElementById('link_color').oninput = function () {
    r.style.setProperty('--user-link-color', this.value);
}

document.getElementById('title_font').onchange = function () {
    r.style.setProperty('--user-title-font', this.value);
}

document.getElementById('heading_font').onchange = function () {
    r.style.setProperty('--user-heading-font', this.value);
}

document.getElementById('link_font').onchange = function () {
    r.style.setProperty('--user-link-font', this.value);
}

document.getElementById('column_size').onchange = function () {
    r.style.setProperty('--user-column-size', this.value + 'px');
}

document.getElementById('settings').onsubmit = function () {
    const bgColor = document.getElementById('bg_color').value;
    chrome.storage.sync.set({ bgColor: bgColor });

    const titleColor = document.getElementById('title_color').value;
    chrome.storage.sync.set({ titleColor: titleColor });

    const headingColor = document.getElementById('heading_color').value;
    chrome.storage.sync.set({ headingColor: headingColor });

    const linkColor = document.getElementById('link_color').value;
    chrome.storage.sync.set({ linkColor: linkColor });

    const titleFont = document.getElementById('title_font').value;
    chrome.storage.sync.set({ titleFont: titleFont });

    const headingFont = document.getElementById('heading_font').value;
    chrome.storage.sync.set({ headingFont: headingFont });

    const linkFont = document.getElementById('link_font').value;
    chrome.storage.sync.set({ linkFont: linkFont });

    const columnSize = document.getElementById('column_size').value;
    chrome.storage.sync.set({ columnSize: columnSize });

    const live = document.getElementById('live');
    live.textContent = 'Settings saved successfully!';
    live.style.color = 'lightgreen';
    live.style.display = 'block';
    live.style.fontSize = '13px';
    live.style.textAlign = 'center';
    live.style.marginBottom = '15px';

    return false;
}

chrome.storage.sync.get('bgColor', function (data) {
	r.style.setProperty('--user-background-color', data.bgColor || '#000000');
    document.getElementById('bg_color').value = data.bgColor || '#000000';
    r.style.setProperty('--scrollbar-color', lightenOrDarkenColor(data.bgColor, 27) || '#444444');
});

chrome.storage.sync.get('titleColor', function (data) {
    r.style.setProperty('--user-title-color', data.titleColor || '#ffffff');
    document.getElementById('title_color').value = data.titleColor || '#ffffff';
});

chrome.storage.sync.get('headingColor', function (data) {
    r.style.setProperty('--user-heading-color', data.headingColor || '#52ff94');
    document.getElementById('heading_color').value = data.headingColor || '#52ff94';
});

chrome.storage.sync.get('linkColor', function (data) {
    r.style.setProperty('--user-link-color', data.linkColor || '#b0e0e6');
    document.getElementById('link_color').value = data.linkColor || '#b0e0e6';
});

chrome.storage.sync.get('titleFont', function (data) {
    r.style.setProperty('--user-title-font', data.titleFont || 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
    document.getElementById('title_font').value = data.titleFont || 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
});

chrome.storage.sync.get('headingFont', function (data) {
    r.style.setProperty('--user-heading-font', data.headingFont || 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif');
    document.getElementById('heading_font').value = data.headingFont || 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif';
});

chrome.storage.sync.get('linkFont', function (data) {
    r.style.setProperty('--user-link-font', data.linkFont || 'Noto Serif');
    document.getElementById('link_font').value = data.linkFont || 'Noto Serif';
});

chrome.storage.sync.get('columnSize', function (data) {
    if (data.columnSize) {
        r.style.setProperty('--user-column-size', data.columnSize.toString() + 'px' || '215px');
    }
    document.getElementById('column_size').value = data.columnSize || '215';
});

document.getElementById('discard_changes').onclick = function () {
    location.reload();
}

document.querySelector('main').addEventListener('focusin', () => {
    document.getElementById('customize').open = false;
});
