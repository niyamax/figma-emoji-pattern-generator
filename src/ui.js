import './ui.css';
import _ from "lodash";
import $ from "jquery";

let emojiUnicodeList = [];
let selectedEmojis = []; // Array to store selected emoji SVGs
const emojiCache = new Map(); // For caching parsed emojis
let selectedEmojiIds = new Set(); // Track selected emoji IDs

// Replace the designToolsEmojis definition with inline SVG content
const figmaSvgContent = `<svg width="23.82" height="35.14" viewBox="0 0 61 90" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_57_8)">
  <path d="M15.5 90C23.78 90 30.5 83.28 30.5 75V60H15.5C7.22 60 0.5 66.72 0.5 75C0.5 83.28 7.22 90 15.5 90Z" fill="#0ACF83"/>
  <path d="M0.5 45C0.5 36.72 7.22 30 15.5 30H30.5V60H15.5C7.22 60 0.5 53.28 0.5 45Z" fill="#A259FF"/>
  <path d="M0.5 15C0.5 6.72 7.22 0 15.5 0H30.5V30H15.5C7.22 30 0.5 23.28 0.5 15Z" fill="#F24E1E"/>
  <path d="M30.5 0H45.5C53.78 0 60.5 6.72 60.5 15C60.5 23.28 53.78 30 45.5 30H30.5V0Z" fill="#FF7262"/>
  <path d="M60.5 45C60.5 53.28 53.78 60 45.5 60C37.22 60 30.5 53.28 30.5 45C30.5 36.72 37.22 30 45.5 30C53.78 30 60.5 36.72 60.5 45Z" fill="#1ABCFE"/>
  </g>
  <defs>
  <clipPath id="clip0_57_8">
  <rect width="60.012" height="90" fill="white" transform="translate(0.493896)"/>
  </clipPath>
  </defs>
</svg>`;

// Create a data URI from the SVG content
const figmaSvgDataUri = `data:image/svg+xml;base64,${btoa(figmaSvgContent)}`;

// Define design tools emojis with the data URI
const designToolsEmojis = [
  { id: 'figma', dataUri: figmaSvgDataUri, svgContent: figmaSvgContent, alt: 'Figma' }
];

// In your emoji categories array or object, add the new category
// const emojiCategories = [
//   // ... existing categories ...
//   {
//     name: 'Design Tools',
//     emojis: designToolsEmojis
//   }
// ];

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

    // Check if we're dealing with custom emojis with dataUri (our design tools)
    if (list && list.length > 0 && list[0].dataUri) {
        console.log("Loading custom emojis with dataUri");
        
        list.forEach(emoji => {
            const div = document.createElement('div');
            div.className = 'emoji-wrapper';
            
            const img = document.createElement('img');
            img.src = emoji.dataUri;
            img.alt = emoji.alt || emoji.id;
            img.dataset.emojiId = emoji.id;
            
            // Calculate proper dimensions to maintain aspect ratio
            // Original SVG is 61x90, we want to match the standard emoji size of 42px
            // while preserving the aspect ratio
            const aspectRatio = 61/90;
            const height = 42; // Match standard emoji height
            const width = Math.round(height * aspectRatio); // ~28px
            
            img.width = width;
            img.height = height;
            img.style.cursor = 'pointer';
            img.style.padding = '8px';
            
            if (selectedEmojiIds.has(emoji.id)) {
                img.classList.add('selected-emoji');
            }
            
            img.onclick = function() {
                console.log("Custom emoji clicked:", emoji.id);
                
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
                
                console.log('Selected emojis count:', selectedEmojis.length);
            };
            
            div.appendChild(img);
            container.appendChild(div);
        });
    }
    // Handle regular emojis
    else if (list && list.length > 0 && list[0].src) {
        console.log("Loading custom emojis:", list); // Debug log
        
        // These are custom emojis with src property
        list.forEach(emoji => {
            const div = document.createElement('div');
            div.className = 'emoji-wrapper';
            
            // Create an image element for the SVG
            const img = document.createElement('img');
            
            // Use an absolute path that works with Figma plugin architecture
            // The path should be relative to the manifest.json file
            img.src = emoji.src;
            img.alt = emoji.alt || emoji.id;
            img.dataset.emojiId = emoji.id;
            img.width = 42;  // Match size with other emojis
            img.height = 42;
            img.style.cursor = 'pointer';
            img.style.padding = '8px';
            
            // Check if this emoji was previously selected
            if (selectedEmojiIds.has(emoji.id)) {
                img.classList.add('selected-emoji');
            }
            
            // Direct click handler on the image
            img.addEventListener('click', function() {
                console.log("Custom emoji clicked:", emoji.id); // Debug log
                
                // For custom emojis, we'll use a hardcoded path to the SVG file
                const pluginDir = figma.root ? figma.root.getPluginData('dir') : '';
                const svgPath = `${pluginDir}/assets/additional_emojis/figma.svg`;
                
                // Fetch the SVG content directly
                fetch(emoji.src)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
                        }
                        return response.text();
                    })
                    .then(svgContent => {
                        console.log("SVG content loaded, length:", svgContent.length); // Debug log
                        toggleDirectEmojiSelection(img, svgContent, emoji.id);
                    })
                    .catch(err => {
                        console.error("Error loading SVG:", err);
                        
                        // Fallback - use the SVG content we already have
                        const svgContent = `<svg width="30" height="45" viewBox="0 0 61 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_57_8)">
                            <path d="M15.5 90C23.78 90 30.5 83.28 30.5 75V60H15.5C7.22 60 0.5 66.72 0.5 75C0.5 83.28 7.22 90 15.5 90Z" fill="#0ACF83"/>
                            <path d="M0.5 45C0.5 36.72 7.22 30 15.5 30H30.5V60H15.5C7.22 60 0.5 53.28 0.5 45Z" fill="#A259FF"/>
                            <path d="M0.5 15C0.5 6.72 7.22 0 15.5 0H30.5V30H15.5C7.22 30 0.5 23.28 0.5 15Z" fill="#F24E1E"/>
                            <path d="M30.5 0H45.5C53.78 0 60.5 6.72 60.5 15C60.5 23.28 53.78 30 45.5 30H30.5V0Z" fill="#FF7262"/>
                            <path d="M60.5 45C60.5 53.28 53.78 60 45.5 60C37.22 60 30.5 53.28 30.5 45C30.5 36.72 37.22 30 45.5 30C53.78 30 60.5 36.72 60.5 45Z" fill="#1ABCFE"/>
                            </g>
                            <defs>
                            <clipPath id="clip0_57_8">
                            <rect width="60.012" height="90" fill="white" transform="translate(0.493896)"/>
                            </clipPath>
                            </defs>
                            </svg>`;
                        
                        toggleDirectEmojiSelection(img, svgContent, emoji.id);
                    });
            });
            
            div.appendChild(img);
            container.appendChild(div);
        });
    } else {
        // Regular twemoji handling
        // Store full list for pagination
        const uniqueEmojis = Array.from(new Set(list.map(item => item.char)));
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
        
        // Scroll handler for infinite loading
        container.onscroll = _.throttle(() => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadMoreEmojis();
            }
        }, 200);
        
        // Click handler using event delegation
        container.onclick = (e) => {
            const emojiWrapper = e.target.closest('img');
            if (emojiWrapper) {
                fetch(emojiWrapper.src)
                    .then(r => r.text())
                    .then(svgContent => {
                        toggleEmojiSelection(emojiWrapper, svgContent);
                    })
                    .catch(err => console.error('Error fetching SVG:', err));
            }
        };
    }
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

            // Add our custom Design Tools category
            emojiUnicodeList['Design Tools'] = designToolsEmojis;

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
