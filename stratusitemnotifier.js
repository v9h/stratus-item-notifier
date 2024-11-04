// ==UserScript==
// @name         Item Notifier
// @include      http://www.strrev.com/
// @namespace    http://www.strrev.com/
// @version      2024-11-04
// @description  Notifies user when new items are available
// @author       goth
// @match        *://www.strrev.com/*
// @icon         https://www.strrev.com/img/logo_R.svg
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const categoryApiUrl = 'https://www.strrev.com/apisite/catalog/v1/search/items?category=Featured&limit=28&sortType=0';

    function getLastSeenItemId() {
        return localStorage.getItem('lastSeenItemId');
    }

    function setLastSeenItemId(itemId) {
        localStorage.setItem('lastSeenItemId', itemId);
    }

    function getCsrfToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.getAttribute('content') : null;
    }

    async function fetchItems() {
        try {
            const csrfToken = getCsrfToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            const response = await fetch(categoryApiUrl, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                checkForNewItems(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    }

    function checkForNewItems(items) {
        const mostRecentItem = items[0];
        const lastSeenItemId = getLastSeenItemId();
        if (!lastSeenItemId || mostRecentItem.id > lastSeenItemId) {
            setLastSeenItemId(mostRecentItem.id);
            notifyUser(mostRecentItem.id);
        }
    }

    function notifyUser(itemId) {
        const notification = new Notification("New Item Available!", {
            body: 'Press this notification to be redirected'
        });

        notification.onclick = () => {
            window.open(`https://www.strrev.com/catalog/${itemId}/Notify`);
        };
    }

    function requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function init() {
        requestNotificationPermission();
        setInterval(fetchItems, 5000);
    }

    init();
})();
