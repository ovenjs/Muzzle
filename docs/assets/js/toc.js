// Muzzle Documentation - Table of Contents JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const tocContainer = document.getElementById('table-of-contents');
    
    if (!tocContainer) {
        return;
    }
    
    // Generate table of contents from headings
    function generateTOC() {
        const content = document.querySelector('.page-content');
        if (!content) {
            return;
        }
        
        const headings = content.querySelectorAll('h2, h3, h4');
        if (headings.length === 0) {
            tocContainer.parentElement.style.display = 'none';
            return;
        }
        
        let tocHTML = '<ul>';
        let lastLevel = 2; // Start with h2
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent;
            const id = heading.id || `heading-${index}`;
            
            // Set ID if not already set
            if (!heading.id) {
                heading.id = id;
            }
            
            // Adjust nesting level
            if (level > lastLevel) {
                tocHTML += '<ul>';
            } else if (level < lastLevel) {
                tocHTML += '</ul>'.repeat(lastLevel - level);
            }
            
            // Add TOC item
            tocHTML += `<li><a href="#${id}" class="toc-h${level}">${text}</a></li>`;
            
            lastLevel = level;
        });
        
        // Close any open lists
        tocHTML += '</ul>'.repeat(lastLevel - 2);
        
        tocContainer.innerHTML = tocHTML;
        
        // Add smooth scrolling
        addSmoothScrolling();
        
        // Highlight active section
        highlightActiveSection();
    }
    
    // Add smooth scrolling to TOC links
    function addSmoothScrolling() {
        const tocLinks = tocContainer.querySelectorAll('a');
        
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without triggering navigation
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
    }
    
    // Highlight active section in TOC based on scroll position
    function highlightActiveSection() {
        const headings = document.querySelectorAll('.page-content h2, .page-content h3, .page-content h4');
        const tocLinks = tocContainer.querySelectorAll('a');
        
        if (headings.length === 0 || tocLinks.length === 0) {
            return;
        }
        
        function updateActiveLink() {
            const scrollPosition = window.scrollY;
            const headerHeight = document.querySelector('.header').offsetHeight;
            
            let activeHeading = null;
            
            // Find the heading that is currently in view
            headings.forEach(heading => {
                const headingTop = heading.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                if (headingTop <= scrollPosition + 10) {
                    activeHeading = heading;
                }
            });
            
            // If no heading is found (e.g., at the top of the page), use the first heading
            if (!activeHeading && headings.length > 0) {
                activeHeading = headings[0];
            }
            
            // Update active link in TOC
            tocLinks.forEach(link => {
                link.classList.remove('active');
                
                if (activeHeading && link.getAttribute('href') === `#${activeHeading.id}`) {
                    link.classList.add('active');
                }
            });
        }
        
        // Update on scroll
        window.addEventListener('scroll', updateActiveLink);
        
        // Update on load
        updateActiveLink();
        
        // Update when hash changes
        window.addEventListener('hashchange', updateActiveLink);
    }
    
    // Generate TOC on page load
    generateTOC();
    
    // Regenerate TOC if content changes (for dynamic content)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                generateTOC();
            }
        });
    });
    
    const content = document.querySelector('.page-content');
    if (content) {
        observer.observe(content, { childList: true, subtree: true });
    }
});