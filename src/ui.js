import './ui.css';
import _ from "lodash";
import $ from "jquery";

let emojiUnicodeList = [];
let selectedEmojis = []; // Array to store selected emoji SVGs

$(document).ready(function () {
    fetchEmojiUnicodes();
    setupEventListeners();
});

// On clicking tabs
$(document).on("click", "ul.tabs li", function () {
    const category = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    populateEmojis(emojiUnicodeList[category]);
    $(this).addClass('current');
    $('#emoji-container').scrollTop(0);
});

// Adding shadow on scroll
$('#emoji-container').on('scroll', function () {
    if (!$('#emoji-container').scrollTop()) {
        $('.container').removeClass('shadow');
    } else {
        $('.container').addClass('shadow');
    }
});

// Function to setup additional event listeners
const setupEventListeners = () => {
    document.getElementById('create-grid-button').addEventListener('click', () => {
        if (selectedEmojis.length > 0) {
            const pattern = document.getElementById('pattern-selector').value; // Get selected pattern
            parent.postMessage({
                pluginMessage: {
                    type: 'create-pattern',
                    pattern: pattern, // Pass the selected pattern
                    emojis: selectedEmojis
                }
            }, '*');
        } else {
            alert('Please select at least one emoji.');
        }
    });

    document.getElementById('clear-selection-button').addEventListener('click', () => {
        $('.selected-emoji').removeClass('selected-emoji');
        selectedEmojis = [];
    });

    setupPatternControls();
};

// Populate Emojis
const populateEmojis = (list) => {
    let emojiUnicodes = '';
    for (let i = 0; i < list.length; i++) {
        if (!emojiUnicodes.includes(list[i].char)) {
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
        imgs[i].onclick = function () {
            fetchImg(this, src);
        };
    }
};

// Fetch Emoji Unicodes
const fetchEmojiUnicodes = () => {
    fetch("https://unpkg.com/emoji.json@13.1.0/emoji.json")
        .then(res => res.json())
        .then((emojiList) => {
            emojiUnicodeList = emojiList;
            emojiUnicodeList = _.groupBy(emojiList, (emoji) => {
                return emoji.category.substr(0, emoji.category.indexOf('(')).trim();
            });

            // Filter out the Component category
            delete emojiUnicodeList['Component'];

            // Create tabs for each category
            for (const key in emojiUnicodeList) {
                $('#tab-list').append('<li class="tab-link" data-tab="' + key + '">' + key + '</li>');
            }
            $('.tab-link').eq(0).click();
        })
        .catch(() => {
            console.log('There was an issue while fetching the emoji list');
            document.getElementById('emoji-container').setAttribute('style', 'display:none');
            document.getElementById('error').setAttribute('style', 'display:flex');
        });
};

// Toggle Emoji Selection
const toggleEmojiSelection = (emojiElement, emojiSVG) => {
    const isSelected = $(emojiElement).hasClass('selected-emoji');
    if (isSelected) {
        $(emojiElement).removeClass('selected-emoji');
        selectedEmojis = selectedEmojis.filter(e => e !== emojiSVG);
    } else {
        $(emojiElement).addClass('selected-emoji');
        selectedEmojis.push(emojiSVG);
    }
};

// Fetch SVG code of clicked Emoji and toggle its selection
const fetchImg = (emojiElement, url) => {
    fetch(url).then(r => r.arrayBuffer()).then(buff => {
        let blob = new Blob([new Uint8Array(buff)], { type: "image/svg+xml" });
        const reader = new FileReader();
        reader.onload = () => {
            toggleEmojiSelection(emojiElement, reader.result);
        };
        reader.readAsText(blob);
    });
};

// Function to receive events from Figma
onmessage = e => {
    if (!e.data) return;
    const data = e.data.pluginMessage.data;
    const type = e.data.pluginMessage.type;
};

const setupPatternControls = () => {
    const patternSelector = document.getElementById('pattern-selector');
    const controls = document.querySelector('.pattern-controls');
    
    patternSelector.addEventListener('change', (e) => {
        // Show/hide relevant controls based on pattern
        const pattern = e.target.value;
        if (pattern === 'floating' || pattern === 'wave') {
            controls.style.display = 'block';
        } else {
            controls.style.display = 'none';
        }
    });
    
    // Update pattern parameters when controls change
    document.getElementById('size-control').addEventListener('input', updatePattern);
    document.getElementById('density-control').addEventListener('input', updatePattern);
    document.getElementById('rotation-control').addEventListener('input', updatePattern);
    document.getElementById('speed-control').addEventListener('input', updatePattern);
};

const updatePattern = _.debounce(() => {
    if (selectedEmojis.length > 0) {
        const pattern = document.getElementById('pattern-selector').value;
        parent.postMessage({
            pluginMessage: {
                type: 'create-pattern',
                pattern: pattern,
                emojis: selectedEmojis,
                size: parseFloat(document.getElementById('size-control').value),
                density: parseInt(document.getElementById('density-control').value),
                rotation: parseInt(document.getElementById('rotation-control').value),
                speed: parseFloat(document.getElementById('speed-control').value)
            }
        }, '*');
    }
}, 100);
