// ==UserScript==
// @name         Item Notifier
// @include      http://www.strrev.com/
// @namespace    http://www.strrev.com/
// @version      1.2.14
// @description  Notifies user when new items are available with image
// @author       goth
// @match        *://www.strrev.com/*
// @icon         https://www.strrev.com/img/logo_R.svg
// @grant        none
// @updateURL    https://raw.githubusercontent.com/v9h/stratus-item-notifier/main/stratusitemnotifier.js
// @downloadURL  https://raw.githubusercontent.com/v9h/stratus-item-notifier/main/stratusitemnotifier.js
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

    async function fetchItemDetails(itemId) {
        try {
            const response = await fetch(`https://www.strrev.com/catalog/${itemId}/Notify`);
            if (!response.ok) throw new Error('Network response was not ok');

            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const itemNameElement = doc.querySelector('div.col-10 h1[class^="title-"]');
            const itemImageElement = doc.querySelector('img[src*="//images/thumbnails/"]');
            const itemName = itemNameElement ? itemNameElement.textContent : 'Unknown Item';
            const itemImage = itemImageElement ? itemImageElement.src : '';
            console.log(`Fetched item details: ${itemName}, ${itemImage}`);
            return { itemName, itemImage };
        } catch (error) {
            console.error('Failed to fetch item details:', error);
            return { itemName: 'Unknown Item', itemImage: '' };
        }
    }

    async function notifyUser(itemId) {
        const { itemName, itemImage } = await fetchItemDetails(itemId);
        console.log(`Creating notification for item: ${itemName}`);
        const notification = new Notification("New Item Available!", {
            body: `Press this notification to be redirected to ${itemName}.`,
            icon: itemImage
        });

        notification.onclick = () => {
            window.open(`https://www.strrev.com/catalog/${itemId}/Notify`);
        };
    }

    function requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log(`Notification permission: ${permission}`);
            });
        } else {
            console.log(`Notification permission: ${Notification.permission}`);
        }
    }

    function init() {
        console.log('Initializing script...');
        requestNotificationPermission();
        setInterval(fetchItems, 5000); // 5 seconds
    }

    init();
})();
