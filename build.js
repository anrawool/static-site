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

async function buildSite() {
    try {
        // Create dist directory if it doesn't exist
        await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });

        // Copy CSS files
        const stylesDir = path.join(__dirname, 'src', 'styles');
        const distStylesDir = path.join(__dirname, 'dist', 'styles');
        await fs.mkdir(distStylesDir, { recursive: true });
        const cssFiles = await fs.readdir(stylesDir);
        for (const file of cssFiles) {
            await fs.copyFile(
                path.join(stylesDir, file),
                path.join(distStylesDir, file)
            );
        }

        // Process pages
        const pagesDir = path.join(__dirname, 'src', 'pages');
        const files = await fs.readdir(pagesDir);
        
        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const filePath = path.join(pagesDir, file);
            const { attributes, html } = await processMarkdown(filePath);
            const template = await readTemplate(attributes.template || 'base');
            
            const finalHtml = await applyTemplate(template, {
                title: attributes.title || 'Untitled',
                content: html
            });

            const outputPath = path.join(
                __dirname,
                'dist',
                file.replace('.md', '.html')
            );
            await fs.writeFile(outputPath, finalHtml);
        }

        console.log('Site built successfully!');
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
}

buildSite(); 