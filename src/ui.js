import './ui.css'
import _ from "lodash";
import $ from "jquery";

let emojiUnicodeList = [];
let selectedEmojis = []; // Array to store selected emoji SVGs

$(document).ready(function () {
    fetchEmojiUnicodes();
    setupEventListeners(); // Setting up additional event listeners
});

// On clicking tabs
$(document).on("click","ul.tabs li", function(){
    const category = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    populateEmojis(emojiUnicodeList[category]);
    $(this).addClass('current');
    $('#emoji-container').scrollTop(0);
});

// Adding shadow on scroll
$('#emoji-container').on('scroll', function() {
    if (!$('#emoji-container').scrollTop()) {
        $('.container').removeClass('shadow')
    } else {
        $('.container').addClass('shadow')
    }
})

// Function to setup additional event listeners
const setupEventListeners = () => {
    // Event listener for grid generation button
    document.getElementById('create-grid-button').addEventListener('click', () => {
        if (selectedEmojis.length > 0) {
            parent.postMessage({
                pluginMessage: {
                    type: 'create-grid',
                    emojis: selectedEmojis,
                    gridRows: 5, // Set your desired grid size or make it configurable
                    gridCols: 5,
                    spacing: 10 // Set your desired spacing or make it configurable
                }
            }, '*');
        } else {
            alert('Please select at least one emoji.');
        }
    });

    // Event listener for clear selection button
    document.getElementById('clear-selection-button').addEventListener('click', () => {
        selectedEmojis = [];
        updateSelectedEmojisDisplay();
    });
}

// Listing all the Emojis from the unicode list onto the view
const populateEmojis = (list) => {
    let emojiUnicodes = '';
    for(let i=0; i<list.length; i++) {
        if(!emojiUnicodes.includes(list[i].char)) {
            emojiUnicodes += list[i].char;
        }
    }
    document.getElementById('emoji-container').textContent = emojiUnicodes;

    twemoji.parse(document.getElementById('emoji-container'), {
        folder: 'svg',
        ext: '.svg',
        size: 128,
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
    });

    let imgs = document.getElementsByTagName("img");
    for (let i = 0; i < imgs.length; i++) {
        let src = imgs[i].src;
        imgs[i].onclick = function() {fetchImg(src)};
    }
}

/* Fetching the unicodelist from
 * https://github.com/amio/emoji.json
 */
const fetchEmojiUnicodes = () => {
    fetch("https://unpkg.com/emoji.json@12.1.0/emoji.json")
    .then(res => res.json())
    .then((emojiList) => {
        emojiUnicodeList = emojiList;
        emojiUnicodeList = _.groupBy(emojiList, (emoji) => {
            return emoji.category.substr(0, emoji.category.indexOf('(')).trim();
        });

        // Adding appropriate category tabs
        for (const key in emojiUnicodeList) {
            $('#tab-list').append('<li class="tab-link" data-tab="' + key +'">' + key + '</li>');
        }
        $('.tab-link').eq(0).click();

    })
    .catch(() => {
        console.log('There was an issue while fetching the emoji list');
        document.getElementById('emoji-container').setAttribute('style', 'display:none');
        document.getElementById('error').setAttribute('style', 'display:flex');
    });
}

// Function to update UI with selected emojis
const updateSelectedEmojisDisplay = () => {
    const container = document.getElementById('selected-emojis-container');
    container.innerHTML = selectedEmojis.join(' '); // Display selected emojis
}

// Fetching svg code of selected Emoji and adding to the selection
const fetchImg = url => {
    fetch(url).then(r => r.arrayBuffer()).then(buff => {
        let blob = new Blob([new Uint8Array(buff)], {type: "image/svg+xml"});
        const reader = new FileReader();
        reader.onload = () => {
            selectedEmojis.push(reader.result);
            updateSelectedEmojisDisplay(); // Update UI with selected emojis
        };
        reader.readAsText(blob);
    });
}

// Function to receive events from Figma
onmessage = e => {
    if (!e.data) return;

    const data = e.data.pluginMessage.data;
    const type = e.data.pluginMessage.type;
};
