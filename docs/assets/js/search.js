// Muzzle Documentation - Search JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) {
        return;
    }
    
    // Search index for all documentation pages
    let searchIndex = [
        {
            title: "Muzzle Documentation",
            url: "/",
            content: "Muzzle is a powerful text filtering library for Node.js applications. It provides real-time content filtering with customizable word lists and parameterized filtering."
        },
        {
            title: "Getting Started",
            url: "/getting-started/",
            content: "Welcome to Muzzle! This guide will help you get up and running with Muzzle in your Node.js application in just a few minutes. Installation, basic usage, custom banned words, advanced configuration, batch processing, error handling, integration examples, best practices."
        },
        {
            title: "API Reference",
            url: "/api-reference/",
            content: "Muzzle API Reference. Muzzle class, constructor, initialize method, filterText method, filterBatch method, getStatus method, MuzzleConfig interface, TextFilteringOptions interface, BannedWordsSource interface, ParameterHandlingOptions interface, FilterResult interface, BatchResult interface, StatusResult interface, WordMatch interface, Error types."
        },
        {
            title: "Configuration",
            url: "/configuration/",
            content: "Muzzle Configuration Guide. Text filtering options, banned words source, case sensitivity, whole word matching, exact phrase matching, maximum text length, text preprocessing, parameter handling, severity mapping, examples, advanced configuration."
        },
        {
            title: "Examples",
            url: "/examples/",
            content: "Muzzle Examples. Explore practical examples of using Muzzle in different applications and frameworks. Express comment moderation, React form validation, Discord bot moderation."
        },
        {
            title: "Express Comment Moderation",
            url: "/examples/express-comment-moderation/",
            content: "Express Comment Moderation Example. This example demonstrates how to implement comment moderation in an Express.js application using Muzzle to filter inappropriate content in real-time. Problem statement, prerequisites, implementation, project setup, create the Express app, configure Muzzle, implement middleware, test the implementation, explanation, key features, variations, next steps."
        },
        {
            title: "React Form Validation",
            url: "/examples/react-form-validation/",
            content: "React Form Validation Example. This example demonstrates how to implement real-time text validation in React forms using Muzzle to provide immediate feedback to users when they enter inappropriate content. Problem statement, prerequisites, implementation, project setup, create the comment form component, add CSS styles, update the app component, run the application, test the implementation, explanation, key features, variations, next steps."
        },
        {
            title: "Discord Bot Moderation",
            url: "/examples/discord-bot-moderation/",
            content: "Discord Bot Moderation Example. This example demonstrates how to create a Discord bot that automatically moderates messages using Muzzle to filter inappropriate content in real-time. Problem statement, prerequisites, implementation, project setup, configure environment variables, create the bot structure, set up the database, configure Muzzle, create logger utility, create event handlers, create slash commands, create the main bot file, test the implementation, explanation, key features, variations, next steps."
        }
    ];
    
    // Handle search input
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(function() {
            performSearch(query);
        }, 300);
    });
    
    // Perform search
    function performSearch(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length === 0) {
            searchResults.classList.remove('active');
            return;
        }
        
        const results = searchIndex.map(item => {
            let score = 0;
            let titleMatches = [];
            let contentMatches = [];
            
            // Calculate relevance score
            searchTerms.forEach(term => {
                // Check title matches (higher weight)
                const titleLower = item.title.toLowerCase();
                const titleIndex = titleLower.indexOf(term);
                if (titleIndex !== -1) {
                    score += 10; // Higher weight for title matches
                    titleMatches.push({
                        term: term,
                        index: titleIndex
                    });
                }
                
                // Check content matches
                const contentLower = item.content.toLowerCase();
                let contentIndex = contentLower.indexOf(term);
                while (contentIndex !== -1) {
                    score += 1;
                    contentMatches.push({
                        term: term,
                        index: contentIndex
                    });
                    contentIndex = contentLower.indexOf(term, contentIndex + 1);
                }
            });
            
            return {
                item: item,
                score: score,
                titleMatches: titleMatches,
                contentMatches: contentMatches
            };
        })
        .filter(result => result.score > 0) // Only include results with a score > 0
        .sort((a, b) => b.score - a.score); // Sort by score (descending)
        
        displaySearchResults(results, query);
    }
    
    // Display search results
    function displaySearchResults(results, query) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    No results found for "${query}"
                </div>
            `;
        } else {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                // Highlight search terms in title and content
                const highlightedTitle = highlightText(result.item.title, query);
                
                // Generate excerpt with highlighted terms
                const excerpt = generateExcerpt(result.item.content, result.contentMatches, query);
                
                resultItem.innerHTML = `
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-excerpt">${excerpt}</div>
                `;
                
                resultItem.addEventListener('click', function() {
                    window.location.href = result.item.url;
                });
                
                searchResults.appendChild(resultItem);
            });
        }
        
        searchResults.classList.add('active');
    }
    
    // Generate excerpt with highlighted search terms
    function generateExcerpt(content, matches, query) {
        if (!matches || matches.length === 0) {
            return content.substring(0, 150) + '...';
        }
        
        // Sort matches by position
        matches.sort((a, b) => a.index - b.index);
        
        // Get the first match position
        const firstMatch = matches[0];
        const startPos = Math.max(0, firstMatch.index - 50);
        const endPos = Math.min(content.length, startPos + 200);
        
        let excerpt = content.substring(startPos, endPos);
        if (startPos > 0) {
            excerpt = '...' + excerpt;
        }
        if (endPos < content.length) {
            excerpt = excerpt + '...';
        }
        
        return highlightText(excerpt, query);
    }
    
    // Highlight text matching search query
    function highlightText(text, query) {
        if (!query) return text;
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideSearch = searchInput.contains(event.target) || 
                                  searchResults.contains(event.target);
        
        if (!isClickInsideSearch) {
            searchResults.classList.remove('active');
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(event) {
        const activeItems = searchResults.querySelectorAll('.search-result-item');
        
        if (event.key === 'ArrowDown' && activeItems.length > 0) {
            event.preventDefault();
            const firstItem = activeItems[0];
            firstItem.classList.add('highlighted');
            firstItem.focus();
        }
    });
    
    // Add keyboard navigation to search results
    searchResults.addEventListener('keydown', function(event) {
        const activeItems = searchResults.querySelectorAll('.search-result-item');
        const currentIndex = Array.from(activeItems).findIndex(item => 
            item.classList.contains('highlighted')
        );
        
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentIndex < activeItems.length - 1) {
                activeItems[currentIndex].classList.remove('highlighted');
                activeItems[currentIndex + 1].classList.add('highlighted');
                activeItems[currentIndex + 1].focus();
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentIndex > 0) {
                activeItems[currentIndex].classList.remove('highlighted');
                activeItems[currentIndex - 1].classList.add('highlighted');
                activeItems[currentIndex - 1].focus();
            } else {
                activeItems[currentIndex].classList.remove('highlighted');
                searchInput.focus();
            }
        } else if (event.key === 'Enter' && currentIndex >= 0) {
            event.preventDefault();
            activeItems[currentIndex].click();
        } else if (event.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.focus();
        }
    });
    
    // Remove highlight class when mouse hovers over a different item
    searchResults.addEventListener('mouseover', function(event) {
        const hoveredItem = event.target.closest('.search-result-item');
        if (hoveredItem) {
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.classList.remove('highlighted');
            });
        }
    });
});