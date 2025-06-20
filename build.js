const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Configure marked for security
marked.setOptions({
    headerIds: false,
    mangle: false
});

async function readTemplate(name) {
    const templatePath = path.join(__dirname, 'src', 'templates', `${name}.html`);
    return await fs.readFile(templatePath, 'utf-8');
}

async function processMarkdown(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { attributes, body } = frontMatter(content);
    const html = marked.parse(body);
    return { attributes, html };
}

async function applyTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
}

// Function to get excerpt from HTML content
function getExcerpt(html, length = 200) {
    // Remove HTML tags and get plain text
    const text = html.replace(/<[^>]*>/g, '');
    // Get first paragraph or truncate to length
    const excerpt = text.split('\n')[0] || text.slice(0, length);
    return excerpt.length > length ? excerpt.slice(0, length) + '...' : excerpt;
}

// Function to format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function buildSite() {
    try {
        // Create dist directories
        await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'dist', 'templates'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'dist', 'posts'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'dist', 'styles'), { recursive: true });

        // Copy CSS files
        const stylesDir = path.join(__dirname, 'src', 'styles');
        const distStylesDir = path.join(__dirname, 'dist', 'styles');
        const cssFiles = await fs.readdir(stylesDir);
        for (const file of cssFiles) {
            await fs.copyFile(
                path.join(stylesDir, file),
                path.join(distStylesDir, file)
            );
        }

        // Copy template files
        const templatesDir = path.join(__dirname, 'src', 'templates');
        const distTemplatesDir = path.join(__dirname, 'dist', 'templates');
        const templateFiles = ['header.html', 'footer.html'];
        for (const file of templateFiles) {
            await fs.copyFile(
                path.join(templatesDir, file),
                path.join(distTemplatesDir, file)
            );
        }

        // Process index.html
        try {
            console.log('Reading index.html...');
            const indexContent = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
            const updatedContent = indexContent
                .replace(/href="dist\//g, 'href="')
                .replace(/fetch\(`dist\//g, 'fetch(`');
            await fs.writeFile(path.join(__dirname, 'dist', 'index.html'), updatedContent);
        } catch (error) {
            console.error('Error handling index.html:', error);
            throw error;
        }

        // Process regular pages
        const pagesDir = path.join(__dirname, 'src', 'pages');
        const pageFiles = await fs.readdir(pagesDir);
        for (const file of pageFiles) {
            if (!file.endsWith('.md') || file === 'blog.md') continue;

            const filePath = path.join(pagesDir, file);
            const { attributes, html } = await processMarkdown(filePath);
            const template = await readTemplate(attributes.template || 'base');
            
            const finalHtml = await applyTemplate(template, {
                title: attributes.title || 'Untitled',
                content: html
            });

            const outputPath = path.join(__dirname, 'dist', file.replace('.md', '.html'));
            await fs.writeFile(outputPath, finalHtml);
        }

        // Process blog posts and gather metadata
        const postsDir = path.join(__dirname, 'src', 'posts');
        const postFiles = await fs.readdir(postsDir);
        const posts = [];
        
        for (const file of postFiles) {
            if (!file.endsWith('.md')) continue;

            const filePath = path.join(postsDir, file);
            const { attributes, html } = await processMarkdown(filePath);
            const template = await readTemplate(attributes.template || 'base');
            
            // Store post metadata
            posts.push({
                title: attributes.title,
                date: attributes.date,
                author: attributes.author,
                excerpt: getExcerpt(html),
                url: `/posts/${file.replace('.md', '.html')}`,
                filename: file
            });

            const finalHtml = await applyTemplate(template, {
                title: attributes.title || 'Untitled',
                content: html
            });

            const outputPath = path.join(__dirname, 'dist', 'posts', file.replace('.md', '.html'));
            await fs.writeFile(outputPath, finalHtml);
        }

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Generate blog listing page
        const blogTemplate = await readTemplate('base');
        const blogListingHtml = `
            <h1>Latest Insights on Membership Sites</h1>
            
            <p>Stay up to date with the latest trends, strategies, and best practices for building and growing successful membership communities.</p>
            
            <div class="blog-posts">
                ${posts.map(post => `
                    <article class="blog-post">
                        <h2><a href="${post.url}">${post.title}</a></h2>
                        <div class="post-meta">
                            <span class="date">${formatDate(post.date)}</span> · 
                            <span class="author">${post.author}</span>
                        </div>
                        <p class="excerpt">${post.excerpt}</p>
                        <a href="${post.url}" class="read-more">Read More →</a>
                    </article>
                `).join('\n')}
            </div>
        `;

        const finalBlogHtml = await applyTemplate(blogTemplate, {
            title: 'Blog | MembersHub',
            content: blogListingHtml
        });

        await fs.writeFile(path.join(__dirname, 'dist', 'blog.html'), finalBlogHtml);

        console.log('Site built successfully!');
        console.log(`Processed ${posts.length} blog posts`);
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
}

buildSite(); 