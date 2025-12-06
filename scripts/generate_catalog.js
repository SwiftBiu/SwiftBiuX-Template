const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
// Base URL for downloading plugins from the latest release
const baseUrl = 'https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/';

// Manual category mapping for existing plugins
// In the future, we can add a "category" field to manifest.json to automate this
const categoryMap = {
    'cny': 'text-processing',
    'JSONFormatter': 'text-processing',
    'Base64Converter': 'text-processing',
    'WordCount': 'text-processing',
    'TimestampConverter': 'text-processing',
    'CaseConverter': 'text-processing',
    'TextCleaner': 'text-processing',
    'RegexExtractor': 'text-processing',
    'MarkdownTableFormatter': 'text-processing',
    'HashCalculator': 'text-processing',
    'SlugGenerator': 'text-processing',
    'Gemini': 'online-services',
    'GeminiImage': 'online-services',
    'MultiSearch': 'online-services',
    'OpenAIRewriter': 'online-services',
    'AdvancedTranslator': 'online-services',
    'CurrencyConverter': 'online-services',
    'CurrencyConverterLite': 'online-services'
};

const categories = [
    {
        id: 'text-processing',
        title: { en: 'Text Processing', zh: '文本处理' },
        icon: 'edit_note'
    },
    {
        id: 'online-services',
        title: { en: 'Online Services & AI', zh: '在线服务与 AI' },
        icon: 'cloud'
    },
    {
        id: 'utilities',
        title: { en: 'Utilities', zh: '实用工具' },
        icon: 'build'
    }
];

const plugins = [];

// Read all directories in the root
const files = fs.readdirSync(rootDir);

console.log('Scanning for plugins...');

files.forEach(file => {
    const pluginDir = path.join(rootDir, file);
    const manifestPath = path.join(pluginDir, 'manifest.json');

    // Check if it's a directory and has a manifest.json
    if (fs.statSync(pluginDir).isDirectory() && fs.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // 1. Infer Type based on permissions and UI
            let type = 'Local';
            if (manifest.ui) {
                type = 'Web App';
            } else if (manifest.permissions && manifest.permissions.includes('network')) {
                type = 'Network';
            }

            // 2. Determine Category
            const categoryId = categoryMap[file] || 'utilities';

            // 3. Construct Plugin Object
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
            console.log(`Processed plugin: ${manifest.name} (${file})`);
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

// Ensure dist directory exists
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the catalog file
fs.writeFileSync(path.join(distDir, 'plugins.json'), JSON.stringify(catalog, null, 2));
console.log(`Successfully generated catalog with ${plugins.length} plugins at dist/plugins.json`);