import './ui.css';
import _ from "lodash";
import $ from "jquery";
import figmaSvgContent from '../assets/additional_emojis/figma.svg?raw';

let emojiUnicodeList = [];
let selectedEmojis = []; // Array to store selected emoji SVGs
const emojiCache = new Map(); // For caching parsed emojis
let selectedEmojiIds = new Set(); // Track selected emoji IDs

// Create a data URI from the SVG content
const figmaSvgDataUri = `data:image/svg+xml;base64,${btoa(figmaSvgContent)}`;

// Define design tools emojis with the data URI
const designToolsEmojis = [
  { id: 'figma', dataUri: figmaSvgDataUri, svgContent: figmaSvgContent, alt: 'Figma' }
];

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

    // Ensure grid pattern is selected by default if none selected
    if (!document.querySelector('.pattern-card.selected')) {
        document.querySelector('[data-pattern="grid"]').classList.add('selected');
    }

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
        selectedEmojiIds.clear();
    });

    setupPatternControls();
};

// Populate Emojis
const populateEmojis = (list) => {
    const container = document.getElementById('emoji-container');
    container.innerHTML = '';

    if (!list || list.length === 0) return;
    
    // Create a regular emoji list and a custom emoji list
    const regularEmojis = list.filter(emoji => emoji.char);
    const customEmojis = list.filter(emoji => emoji.dataUri || emoji.src);
    
    // Handle regular emojis first
    if (regularEmojis.length > 0) {
        // Store full list for pagination
        const uniqueEmojis = Array.from(new Set(regularEmojis.map(item => item.char)));
        let currentPage = 0;
        const itemsPerPage = 50;
        
        const loadMoreEmojis = () => {
            const start = currentPage * itemsPerPage;
            const end = start + itemsPerPage;
            const pageEmojis = uniqueEmojis.slice(start, end);
            
            if (pageEmojis.length === 0) return;
            
            pageEmojis.forEach(emoji => {
                const div = document.createElement('div');
                div.className = 'emoji-wrapper';
                div.textContent = emoji;
                container.appendChild(div);
            });
            
            twemoji.parse(container, {
                folder: 'svg',
                ext: '.svg',
                size: 128,
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                callback: (icon, options) => {
                    const url = `${options.base}${options.size}/${icon}${options.ext}`;
                    // Check if this emoji was previously selected
                    if (selectedEmojiIds.has(icon)) {
                        setTimeout(() => {
                            const img = container.querySelector(`img[src*="${icon}"]`);
                            if (img) {
                                img.classList.add('selected-emoji');
                            }
                        }, 0);
                    }
                    if (!emojiCache.has(url)) {
                        emojiCache.set(url, true);
                    }
                    return url;
                }
            });
            
            currentPage++;
        };
        
        // Initial load
        loadMoreEmojis();
        
        // Add scroll handler for regular emojis
        container.onscroll = _.throttle(() => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadMoreEmojis();
            }
        }, 200);
    }
    
    // Now handle custom emojis - append them at the top
    if (customEmojis.length > 0) {
        const customContainer = document.createElement('div');
        customContainer.className = 'custom-emojis-container';
        customContainer.style.display = 'flex';
        customContainer.style.flexWrap = 'wrap';
        customContainer.style.justifyContent = 'flex-start';
        
        customEmojis.forEach(emoji => {
            const div = document.createElement('div');
            div.className = 'emoji-wrapper';
            
            const img = document.createElement('img');
            img.src = emoji.dataUri || emoji.src;
            img.alt = emoji.alt || emoji.id;
            img.dataset.emojiId = emoji.id;
            
            // Add the 'emoji' class to match Twitter emojis styling
            img.className = 'emoji';
            
            if (selectedEmojiIds.has(emoji.id)) {
                img.classList.add('selected-emoji');
            }
            
            img.onclick = function() {
                // Use the already available SVG content
                const svgContent = emoji.svgContent;
                
                // Toggle selection
                if (img.classList.contains('selected-emoji')) {
                    img.classList.remove('selected-emoji');
                    selectedEmojiIds.delete(emoji.id);
                    
                    // Remove from selectedEmojis
                    const index = selectedEmojis.findIndex(svg => svg === svgContent);
                    if (index !== -1) {
                        selectedEmojis.splice(index, 1);
                    }
                } else {
                    img.classList.add('selected-emoji');
                    selectedEmojiIds.add(emoji.id);
                    selectedEmojis.push(svgContent);
                }
            };
            
            img.onload = function() {
                console.log(`Figma emoji dimensions - Natural: ${img.naturalWidth}x${img.naturalHeight}, Rendered: ${img.width}x${img.height}, Style: ${getComputedStyle(img).width}x${getComputedStyle(img).height}`);
            };
            
            div.appendChild(img);
            customContainer.appendChild(div);
        });
        
        // Insert custom emojis at the top of the container
        if (container.firstChild) {
            container.insertBefore(customContainer, container.firstChild);
        } else {
            container.appendChild(customContainer);
        }
    }
    
    // Click handler for regular emojis using event delegation
    container.onclick = (e) => {
        const emojiWrapper = e.target.closest('img:not([data-emoji-id])');
        if (emojiWrapper) {
            fetch(emojiWrapper.src)
                .then(r => r.text())
                .then(svgContent => {
                    toggleEmojiSelection(emojiWrapper, svgContent);
                })
                .catch(err => console.error('Error fetching SVG:', err));
        }
    };
};

// Update fetchImg function to handle SVG content consistently
const fetchImg = (emojiElement, url) => {
    fetch(url).then(r => r.text())  // Use text() instead of arrayBuffer()
        .then(svgContent => {
            toggleEmojiSelection(emojiElement, svgContent);
        })
        .catch(err => console.error('Error fetching SVG:', err));
};

// Update toggleEmojiSelection function
const toggleEmojiSelection = (emojiElement, svgContent) => {
    const isSelected = $(emojiElement).hasClass('selected-emoji');
    const iconMatch = emojiElement.src.match(/([0-9a-f-]+)\.svg/);
    
    if (iconMatch) {
        const iconId = iconMatch[1];
        if (isSelected) {
            $(emojiElement).removeClass('selected-emoji');
            selectedEmojiIds.delete(iconId);
            // Remove the exact SVG content
            const index = selectedEmojis.findIndex(svg => svg === svgContent);
            if (index !== -1) {
                selectedEmojis.splice(index, 1);
            }
            
            // Deselect other instances
            document.querySelectorAll(`img[src*="${iconId}"]`).forEach(img => {
                img.classList.remove('selected-emoji');
            });
        } else {
            $(emojiElement).addClass('selected-emoji');
            selectedEmojiIds.add(iconId);
            selectedEmojis.push(svgContent);
        }
    }
};

// Fetch Emoji Unicodes
const fetchEmojiUnicodes = () => {
    fetch("https://unpkg.com/emoji.json@13.1.0/emoji.json")
        .then(res => res.json())
        .then((emojiList) => {
            // Filter out unwanted emojis and sequences
            emojiList = emojiList.filter(emoji => {
                // Skip empty or invalid emojis
                if (!emoji.char || typeof emoji.char !== 'string') return false;
                
                // Skip variation selectors and zero-width joiners when alone
                if (emoji.char.match(/[\uFE0F\u200D]/)) return false;
                
                // Skip skin tone modifiers when they appear alone (not as part of another emoji)
                if (emoji.char.length === 2 && emoji.char.match(/[\u{1F3FB}-\u{1F3FF}]/u)) return false;

                // Skip Component category
                if (emoji.category.includes('Component')) return false;

                return true;
            });

            // Group by category
            emojiUnicodeList = _.groupBy(emojiList, (emoji) => {
                return emoji.category.substr(0, emoji.category.indexOf('(')).trim();
            });

            // Add the Figma emoji to Activities instead
            if (emojiUnicodeList['Activities']) {
                // Add our Figma emoji to the Activities category
                emojiUnicodeList['Activities'] = emojiUnicodeList['Activities'].concat(designToolsEmojis);
            } else {
                // If Activities category doesn't exist for some reason, create it
                emojiUnicodeList['Activities'] = designToolsEmojis;
            }

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

// New function for direct emoji selection without fetching
const toggleDirectEmojiSelection = (emojiElement, svgContent, emojiId) => {
    console.log("Toggling selection for:", emojiId); // Debug log
    
    const isSelected = emojiElement.classList.contains('selected-emoji');
    
    if (isSelected) {
        emojiElement.classList.remove('selected-emoji');
        selectedEmojiIds.delete(emojiId);
        // Remove the SVG content
        const index = selectedEmojis.findIndex(svg => svg === svgContent);
        if (index !== -1) {
            selectedEmojis.splice(index, 1);
        }
    } else {
        emojiElement.classList.add('selected-emoji');
        selectedEmojiIds.add(emojiId);
        selectedEmojis.push(svgContent);
    }
    
    console.log('Selected emojis count:', selectedEmojis.length);
};
