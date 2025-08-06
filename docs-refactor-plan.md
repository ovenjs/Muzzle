# Muzzle Documentation Refactor Plan

## Overview
This document outlines the plan for refactoring the Muzzle documentation to improve its visual appearance, navigation, and user experience while maintaining GitHub Pages compatibility.

## Current State Analysis
- Currently using Jekyll with `jekyll-theme-slate`
- Markdown files with Jekyll front matter
- Basic navigation through `header_pages` configuration
- Uses Kramdown for markdown processing and Rouge for syntax highlighting
- No custom HTML/CSS files present

## Proposed New Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header (Site Title, Search Bar, Mobile Menu Toggle)         │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │          Content Area                             │
│ Navigation│                                                 │
│          │  - Page Title                                    │
│ - Home   │  - Table of Contents (for long pages)            │
│ - Getting│  - Main Content                                  │
│   Started│  - Code Blocks (with syntax highlighting)        │
│ - API Ref │  - Tables, Alerts, Notes                        │
│ - Config │                                                   │
│ - Examples│                                                   │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

### Key Features
1. **Dark Theme**: Professional dark color scheme with good contrast
2. **Sidebar Navigation**: Collapsible sidebar with all documentation sections
3. **Responsive Design**: Works well on desktop, tablet, and mobile
4. **Syntax Highlighting**: Enhanced code block styling with Rouge
5. **Search Functionality**: Integrated search for finding content quickly
6. **Table of Contents**: Auto-generated TOC for long pages
7. **Improved Typography**: Better fonts and spacing for readability

## File Structure Plan

```
docs/
├── _config.yml                    # Updated Jekyll configuration
├── index.md                       # Home page (updated)
├── getting-started.md             # (existing, will be updated)
├── api-reference.md               # (existing, will be updated)
├── configuration.md               # (existing, will be updated)
├── examples/
│   ├── index.md                   # (existing, will be updated)
│   ├── discord-bot-moderation.md  # (existing, will be updated)
│   ├── express-comment-moderation.md # (existing, will be updated)
│   └── react-form-validation.md   # (existing, will be updated)
├── _layouts/                      # New directory
│   ├── default.html               # Main layout template
│   ├── home.html                  # Home page layout
│   └── page.html                  # Regular page layout
├── _includes/                     # New directory
│   ├── header.html                # Header section
│   ├── sidebar.html               # Sidebar navigation
│   ├── footer.html                # Footer section
│   ├── search.html                # Search functionality
│   └── toc.html                   # Table of contents
├── assets/                        # New directory
│   ├── css/
│   │   ├── style.css              # Main stylesheet
│   │   ├── syntax.css             # Syntax highlighting
│   │   └── responsive.css         # Responsive design
│   └── js/
│       ├── sidebar.js             # Sidebar toggle functionality
│       ├── search.js              # Search functionality
│       └── toc.js                 # Table of contents generation
└── 404.md                         # Custom 404 page
```

## Implementation Steps

### 1. Create Custom HTML Layouts
- Create `_layouts` directory with layout templates
- Create `_includes` directory with reusable components
- Implement responsive header with search functionality
- Design collapsible sidebar navigation

### 2. Develop CSS Styles
- Create main stylesheet with dark theme
- Implement responsive design for all screen sizes
- Style typography, tables, lists, and other elements
- Add custom styles for alerts, notes, and warnings
- Enhance code block appearance with syntax highlighting

### 3. Implement JavaScript Functionality
- Create sidebar toggle functionality for mobile
- Implement search functionality
- Add table of contents generation for long pages
- Add smooth scrolling and other UX improvements

### 4. Update Jekyll Configuration
- Modify `_config.yml` to use custom theme
- Configure navigation, collections, and defaults
- Set up syntax highlighting with Rouge
- Configure plugins and other settings

### 5. Update Content
- Modify existing markdown files to work with new layout
- Add front matter where needed
- Improve content structure and formatting
- Add internal links for better navigation

### 6. Test and Optimize
- Test on GitHub Pages
- Validate HTML, CSS, and accessibility
- Optimize for performance
- Test on various devices and browsers

## Design Specifications

### Color Scheme (Dark Theme)
- Background: `#1a1a1a` (very dark gray)
- Surface: `#2d2d2d` (dark gray)
- Text Primary: `#e0e0e0` (light gray)
- Text Secondary: `#a0a0a0` (medium gray)
- Accent: `#4a9eff` (blue)
- Accent Hover: `#6bb0ff` (lighter blue)
- Code Background: `#1e1e1e` (very dark gray)
- Code Border: `#333333` (dark gray)

### Typography
- Font Family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Font Sizes:
  - Body: 16px
  - H1: 32px
  - H2: 24px
  - H3: 20px
  - H4: 18px
  - Code: 14px
- Line Height: 1.6
- Font Weight: 400 (normal), 600 (semibold for headings)

### Responsive Breakpoints
- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsible)
- Desktop: > 1024px (sidebar always visible)

## Next Steps
1. Review and approve this plan
2. Switch to code mode to implement the files
3. Test the implementation on GitHub Pages
4. Make any necessary adjustments based on feedback

## Questions for Review
1. Are there any specific features you'd like to prioritize?
2. Do you have any preferences for the color scheme or design elements?
3. Are there any additional sections or pages you'd like to add to the documentation?
4. Do you want to maintain the existing content structure, or would you like to reorganize it?