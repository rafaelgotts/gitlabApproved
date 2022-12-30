async function showCount() {
    var mergeRequests = document.getElementsByClassName('merge-request');

    for (let i = 0; i < mergeRequests.length; i++) {
        var approveInfo = mergeRequests[i].querySelector('li.d-none.d-sm-inline-block.has-tooltip.text-success');
        if (approveInfo) {
            approveInfo.childNodes[2].data = '\n' + approveInfo.title.replace(/approver.*/g, 'Approved');
        }
    }
}

async function unshowCount() {
    var mergeRequests = document.getElementsByClassName('merge-request');

    for (let i = 0; i < mergeRequests.length; i++) {
        var approveInfo = mergeRequests[i].querySelector('li.d-none.d-sm-inline-block.has-tooltip.text-success');
        if (approveInfo) {
            approveInfo.childNodes[2].data = '\nApproved\n';
        }
    }
}

async function isGitlabsMRPage(url) {
    if (typeof(url) === 'undefined') {
        return false
    }

    var gitlab = 'https://gitlab';
    var merge = 'merge_requests';

    if (url.startsWith(gitlab) && url.includes(merge)) {
        // console.log(url + ' is gitlab MR');
        return true
    }

    // console.log(url + ' inst gitlab MR');
    return false
}

async function updateApproved(tabId) {
    // console.log('Updating approved for tab: ' + tabId);
    const toggleState = await chrome.action.getBadgeText({ });

    if (toggleState === "ON") {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                func: showCount,
            }
        )
    } else if (toggleState === "OFF") {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                func: unshowCount,
            }
        )
    }
}


chrome.runtime.onInstalled.addListener(async () => {
    await chrome.action.setBadgeText({
        text: "OFF",
    });
});


chrome.action.onClicked.addListener(async (tab) => {
    const prevState = await chrome.action.getBadgeText({});
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    await chrome.action.setBadgeText({
        text: nextState,
    });

    if (await isGitlabsMRPage(tab.url)) {
        await updateApproved(tab.id)
    }
})


chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // console.log('onActivated event listened. info: ' + activeInfo);

    let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    // console.log('onActivated event tabs.get tab. ' + tab);

    if (await isGitlabsMRPage(tab.url)) {
        await updateApproved(tab.id)
    }
})


chrome.tabs.onUpdated.addListener(async (tabId, tab) => {
    // console.log('onUpdated event listened. tabId: ' + tabId + ' tab: ' + tab);

    if (tab.status === 'complete') {

        // console.log('onUpdated tab.status completed. tab: ' + tabId);
        let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

        let url = tab.url
        let queryTabId = tab.id

        // console.log('tabs.query tabid: ' + queryTabId + ' and url: ' + url);

        if (await isGitlabsMRPage(url)) {
            await updateApproved(tabId)
        }
    }
})