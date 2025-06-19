# Simple Static Site Generator

A lightweight static site generator built with HTML, CSS, and JavaScript. Uses Markdown for content management and minimal dependencies for simplicity.

## Features

- Simple landing page
- Blog support with Markdown
- About and FAQ pages
- Markdown to HTML conversion
- No complex frameworks

## Project Structure

```
src/
  ├── pages/      # Static pages (About, FAQ, etc.)
  ├── posts/      # Blog posts in Markdown
  ├── templates/  # HTML templates
  └── styles/     # CSS files
dist/            # Generated static site
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the build script:
   ```bash
   npm run build
   ```

3. Serve the site locally:
   ```bash
   npm run serve
   ```

## Writing Content

- Add new pages in `src/pages/` using Markdown
- Add blog posts in `src/posts/` using Markdown
- Each Markdown file should include front matter for metadata