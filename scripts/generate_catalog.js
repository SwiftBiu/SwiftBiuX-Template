const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const catalogDir = path.join(rootDir, 'catalog');
// Base URL for downloading plugins from the latest release
const baseUrl = 'https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/';

// Map category IDs to Material Symbols icons for the frontend
const categoryIcons = {
    'text-processing': 'edit_note',
    'devtools': 'build',
    'productivity': 'speed',
    'online-services': 'cloud',
    'data-creative': 'palette',
    'system': 'settings',
    'utilities': 'extension' // Fallback
};

// Function to parse README.md and extract category structure
function parseReadmeCategories() {
    const readmePath = path.join(rootDir, 'README.md');
    let content = '';
    
    try {
        content = fs.readFileSync(readmePath, 'utf8');
    } catch (e) {
        console.error('Failed to read README.md:', e);
        return { categoryMap: {}, categories: [] };
    }

    const categoryMap = {};
    const categories = [];
    
    // Split content by H3 headers (### )
    // This assumes the README structure is: ### Icon Chinese (English)
    const sections = content.split(/^###\s+/m);
    
    // Skip the first chunk (intro text before first H3)
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const firstLineEnd = section.indexOf('\n');
        const headerLine = section.substring(0, firstLineEnd).trim();
        
        // Regex to parse header: "✍️ 文本处理与转换 (Text Processing)"
        // Captures: 1. Chinese Title (with icon), 2. English Title
        const headerMatch = headerLine.match(/^(?:.\s+)?(.+?)\s+\((.+?)\)$/);
        
        if (headerMatch) {
            // Clean up titles
            let zhTitle = headerMatch[1].trim();
            // Remove emoji if it's at the start of zhTitle (simple check)
            zhTitle = zhTitle.replace(/^[\u{1F300}-\u{1F9FF}|[\u2600-\u26FF]\s*/u, '');
            
            const enTitle = headerMatch[2].trim();
            
            // Generate ID from English title: "Text Processing" -> "text-processing"
            const id = enTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            // Determine icon
            const icon = categoryIcons[id] || 'extension';
            
            categories.push({
                id: id,
                title: { en: enTitle, zh: zhTitle },
                icon: icon
            });
            
            // Find all download links in this section to map plugins to this category
            // Looking for: .../releases/latest/download/{pluginDirName}.swiftbiux
            const linkRegex = /releases\/latest\/download\/(.+?)\.swiftbiux/g;
            let match;
            while ((match = linkRegex.exec(section)) !== null) {
                const pluginDirName = match[1];
                categoryMap[pluginDirName] = id;
            }
        }
    }
    
    return { categoryMap, categories };
}

// 1. Parse README to get dynamic categories and mapping
console.log('Parsing README.md for categories...');
const { categoryMap, categories } = parseReadmeCategories();
console.log(`Found ${categories.length} categories and mapped ${Object.keys(categoryMap).length} plugins.`);

const plugins = [];

// 2. Scan directories for plugins
const files = fs.readdirSync(rootDir);
console.log('Scanning directories for plugins...');

files.forEach(file => {
    const pluginDir = path.join(rootDir, file);
    const manifestPath = path.join(pluginDir, 'manifest.json');

    // Check if it's a directory and has a manifest.json
    if (fs.statSync(pluginDir).isDirectory() && fs.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // Infer Type based on permissions and UI
            let type = 'Local';
            if (manifest.ui) {
                type = 'Web App';
            } else if (manifest.permissions && manifest.permissions.includes('network')) {
                type = 'Network';
            }

            // Determine Category from the map generated from README
            // Fallback to 'utilities' if not found in README
            const categoryId = categoryMap[file] || 'utilities';

            // Construct Plugin Object
            const plugin = {
                id: manifest.identifier,
                name: manifest.name,
                description: {
                    en: manifest.description,
                    // Fallback to English if no Chinese description is available in manifest
                    // TODO: Update manifests to support multi-language descriptions
                    zh: manifest.description 
                },
                icon: manifest.icon || 'extension',
                version: manifest.version,
                type: type,
                author: manifest.author || 'Unknown',
                downloadUrl: `${baseUrl}${file}.swiftbiux`,
                categoryId: categoryId
            };

            // Add author URL if known (hardcoded for now, can be in manifest later)
            if (manifest.author === 'zwpaper') {
                plugin.authorUrl = 'https://github.com/zwpaper';
            }

            plugins.push(plugin);
            console.log(`Processed plugin: ${manifest.name} (${file}) -> Category: ${categoryId}`);
        } catch (e) {
            console.error(`Error processing ${file}:`, e);
        }
    }
});

const catalog = {
    generatedAt: new Date().toISOString(),
    categories: categories,
    plugins: plugins
};

// Ensure catalog directory exists
if (!fs.existsSync(catalogDir)){
    fs.mkdirSync(catalogDir, { recursive: true });
}

// Write the catalog file
fs.writeFileSync(path.join(catalogDir, 'plugins.json'), JSON.stringify(catalog, null, 2));
console.log(`Successfully generated catalog with ${plugins.length} plugins at catalog/plugins.json`);