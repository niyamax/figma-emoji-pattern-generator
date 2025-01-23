import './ui.css';
import _ from "lodash";
import $ from "jquery";

let emojiUnicodeList = [];
let selectedEmojis = []; // Array to store selected emoji SVGs
const emojiCache = new Map(); // For caching parsed emojis

$(function() {
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
    
    // Scroll the tab into view
    scrollTabIntoView(this);
    
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
    // Pattern selection
    document.querySelectorAll('.pattern-card:not(.disabled)').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.pattern-card').forEach(c => {
                c.classList.remove('selected');
            });
            card.classList.add('selected');
        });
    });

    document.getElementById('create-grid-button').addEventListener('click', () => {
        if (selectedEmojis.length > 0) {
            const selectedPattern = document.querySelector('.pattern-card.selected');
            if (!selectedPattern) {
                alert('Please select a pattern style.');
                return;
            }
            
            parent.postMessage({
                pluginMessage: {
                    type: 'create-pattern',
                    pattern: selectedPattern.dataset.pattern,
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
    const container = document.getElementById('emoji-container');
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    
    // Use Set for unique emojis
    const uniqueEmojis = new Set(list.map(item => item.char));
    
    // Process emojis in chunks to prevent UI blocking
    const processChunk = (emojis, index = 0) => {
        const chunkSize = 50;
        const chunk = Array.from(emojis).slice(index, index + chunkSize);
        
        if (chunk.length === 0) return;
        
        chunk.forEach(emoji => {
            const div = document.createElement('div');
            div.className = 'emoji-wrapper';
            div.textContent = emoji;
            fragment.appendChild(div);
        });
        
        if (index === 0) {
            container.appendChild(fragment);
        }
        
        // Parse emojis with Twemoji
        twemoji.parse(container, {
            folder: 'svg',
            ext: '.svg',
            size: 128,
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
            callback: (icon, options) => {
                const url = `${options.base}${options.size}/${icon}${options.ext}`;
                if (emojiCache.has(url)) {
                    return false; // Skip if already cached
                }
                return url;
            }
        });
        
        // Process next chunk
        if (index + chunkSize < emojis.size) {
            requestAnimationFrame(() => processChunk(emojis, index + chunkSize));
        }
    };
    
    // Start processing chunks
    processChunk(uniqueEmojis);
    
    // Use event delegation for click handling
    container.onclick = (e) => {
        const img = e.target.closest('img');
        if (img) {
            fetchImg(img, img.src);
        }
    };
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

// Add this new function for smooth scrolling
function scrollTabIntoView(tabElement) {
    const container = document.querySelector('.tabs');
    const tab = tabElement;
    
    // Get positions
    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;
    const tabLeft = tab.offsetLeft;
    const tabRight = tabLeft + tab.clientWidth;
    
    // Check if tab is not fully visible
    if (tabLeft < containerLeft || tabRight > containerRight) {
        // Calculate the scroll position to center the tab
        const scrollPosition = tabLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
        
        // Smooth scroll to position
        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }
}

// Add scroll shadow effect
const tabContainer = document.querySelector('.tabs');
tabContainer.addEventListener('scroll', () => {
    const container = document.querySelector('.container');
    if (tabContainer.scrollLeft > 0) {
        container.classList.add('shadow');
    } else {
        container.classList.remove('shadow');
    }
});
