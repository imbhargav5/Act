function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

var fmode = persistenceAdapter.isFocusModeOn();
if (fmode) {
    chrome.browserAction.setIcon({path: "assets/img/icon" + "fmode.png"});
} else {
    chrome.browserAction.setIcon({path: "assets/img/icon" + "nofmode.png"});
}

function needsToBeBlocked(url, focusModeUrls) {
    var domain = extractDomain(url);
    var isFound = false;
    focusModeUrls.some(function (element, index, array) {
        if (domain.indexOf(element) > -1) {
            isFound = true;
            return true;
        }
    });
    return isFound;
}

function blockSite(tabId) {
    chrome.tabs.executeScript(tabId, {file: "assets/js/blocker.js"});
}

chrome.browserAction.onClicked.addListener(function (e) {
    var fmode = persistenceAdapter.isFocusModeOn();
    if (fmode) {
        chrome.browserAction.setIcon({path: "assets/img/icon" + "nofmode.png"});
        persistenceAdapter.exitFocusMode();
    } else {
        chrome.browserAction.setIcon({path: "assets/img/icon" + "fmode.png"});
        persistenceAdapter.enterFocusMode();
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var url = tab.url;
    if (url == undefined || url.trim() == "") {
        return;
    }

    if (!persistenceAdapter.isFocusModeOn()) {
        return;
    }

    if (needsToBeBlocked(url, persistenceAdapter.getFocusModeUrls())) {
        blockSite(tabId);
    }
});

chrome.tabs.onHighlighted.addListener(function (hinfo) {
    if (!persistenceAdapter.isFocusModeOn()) {
        return;
    }
    var tids = hinfo.tabIds;
    var focusModeUrls = persistenceAdapter.getFocusModeUrls();
    for(var i = 0; i < tids.length; i++) {
        chrome.tabs.get(tids[i], function (tabInfo) {
            if (needsToBeBlocked(tabInfo.url, focusModeUrls)) {
                blockSite(tabInfo.id);
            }
        });
    }
});

