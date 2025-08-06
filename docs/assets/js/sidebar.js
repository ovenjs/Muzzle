// Muzzle Documentation - Sidebar JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const navSections = document.querySelectorAll('.nav-section');
    
    // Toggle sidebar on mobile
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // Toggle hamburger menu animation
            const spans = sidebarToggle.querySelectorAll('span');
            if (sidebar.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = sidebarToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                
                // Reset hamburger menu animation
                const spans = sidebarToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // Toggle navigation sections
    navSections.forEach(section => {
        const header = section.querySelector('.nav-section-header');
        const toggle = section.querySelector('.nav-toggle');
        const sublist = section.querySelector('.nav-sublist');
        
        if (header && toggle && sublist) {
            header.addEventListener('click', function() {
                sublist.classList.toggle('expanded');
                
                // Rotate toggle arrow
                if (sublist.classList.contains('expanded')) {
                    toggle.style.transform = 'rotate(180deg)';
                } else {
                    toggle.style.transform = 'rotate(0deg)';
                }
            });
            
            // Check if any link in the sublist is active
            const activeLink = sublist.querySelector('.nav-link.active');
            if (activeLink) {
                sublist.classList.add('expanded');
                toggle.style.transform = 'rotate(180deg)';
            }
        }
    });
    
    // Set active navigation link based on current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath && currentPath.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        } else if (linkPath === '/' && currentPath === '/') {
            link.classList.add('active');
        }
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 767) {
                sidebar.classList.remove('active');
                
                // Reset hamburger menu animation
                if (sidebarToggle) {
                    const spans = sidebarToggle.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        }, 250);
    });
});