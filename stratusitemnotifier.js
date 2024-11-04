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

    let lastSeenItemId = null;

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
            if (data.items && data.items.length > 0) {
                checkForNewItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    }

    function checkForNewItems(items) {
        for (let item of items) {
            if (!lastSeenItemId || item.id > lastSeenItemId) {
                lastSeenItemId = item.id;
                notifyUser(item);
            }
        }
    }

    function notifyUser(item) {
        const notification = new Notification("New Item Available!", {
            body: `Check out the new item: ${item.name}`
        });

        notification.onclick = () => {
            window.open(`https://www.strrev.com/catalog/${item.id}/`);
        };
    }

    function requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function init() {
        requestNotificationPermission();
        setInterval(fetchItems, 5000); // 10 seconds
    }

    init();
})();