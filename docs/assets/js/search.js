// Muzzle Documentation - Search JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) {
        return;
    }
    
    // Simple search implementation using page content
    // In a real implementation, this would use a proper search index
    let searchIndex = [];
    
    // Build search index from page content
    function buildSearchIndex() {
        // For a static site, we would typically pre-build this index
        // For this example, we'll use a simple approach with the current page
        const pageTitle = document.title;
        const pageContent = document.querySelector('.page-content')?.textContent || '';
        const pageUrl = window.location.pathname;
        
        searchIndex = [{
            title: pageTitle,
            url: pageUrl,
            content: pageContent.substring(0, 500) + '...' // Truncate for preview
        }];
        
        // In a real implementation, we would include all pages in the site
        // This is a simplified version for demonstration
    }
    
    // Initialize search index
    buildSearchIndex();
    
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
        const results = searchIndex.filter(item => {
            const searchTerm = query.toLowerCase();
            return (
                item.title.toLowerCase().includes(searchTerm) ||
                item.content.toLowerCase().includes(searchTerm)
            );
        });
        
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
                
                // Highlight search term in title and content
                const highlightedTitle = highlightText(result.title, query);
                const highlightedContent = highlightText(result.content, query);
                
                resultItem.innerHTML = `
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-excerpt">${highlightedContent}</div>
                `;
                
                resultItem.addEventListener('click', function() {
                    window.location.href = result.url;
                });
                
                searchResults.appendChild(resultItem);
            });
        }
        
        searchResults.classList.add('active');
    }
    
    // Highlight text matching search query
    function highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
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