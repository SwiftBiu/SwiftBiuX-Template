function isHostOrSubdomain(host, domain) {
    return host === domain || host.endsWith(`.${domain}`);
}

function normalizeCandidateURL(value) {
    return String(value || '')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .trim()
        .replace(/[\])},.;!?]+$/g, '');
}

function isSupportedVideoURL(value) {
    try {
        const host = new URL(normalizeCandidateURL(value)).hostname.toLowerCase();
        return host === 'youtu.be'
            || isHostOrSubdomain(host, 'youtube.com')
            || isHostOrSubdomain(host, 'x.com')
            || isHostOrSubdomain(host, 'twitter.com')
            || isHostOrSubdomain(host, 'tiktok.com')
            || isHostOrSubdomain(host, 'instagram.com')
            || isHostOrSubdomain(host, 'facebook.com')
            || host === 'fb.watch'
            || isHostOrSubdomain(host, 'vimeo.com');
    } catch (_) {
        return false;
    }
}

function supportedVideoURLsFromText(text) {
    const normalizedText = String(text || '')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/&amp;/gi, '&');
    const domainPattern = /(?:^|[^a-z0-9.-])((?:https?:\/\/)?(?:www\.)?(?:(?:[a-z0-9-]+\.)*youtube\.com|youtu\.be|(?:[a-z0-9-]+\.)*x\.com|(?:[a-z0-9-]+\.)*twitter\.com|(?:[a-z0-9-]+\.)*tiktok\.com|(?:[a-z0-9-]+\.)*instagram\.com|(?:[a-z0-9-]+\.)*facebook\.com|fb\.watch|(?:[a-z0-9-]+\.)*vimeo\.com)(?=[/?#]|$)(?:[/?#][^\s<>"'()[\]{}]*)?)/gi;
    const results = [];
    let match;
    while ((match = domainPattern.exec(normalizedText)) !== null) {
        const value = match[1];
        const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        results.push(normalizeCandidateURL(withScheme));
    }
    return results;
}

function firstSupportedVideoURLFromContext(context) {
    const candidates = supportedVideoURLsFromText(context && context.selectedText);

    const remoteFiles = Array.isArray(context && context.selectedRemoteFiles)
        ? context.selectedRemoteFiles
        : [];
    remoteFiles.forEach((item) => {
        if (item && (item.url || item.fileURL)) candidates.push(normalizeCandidateURL(item.url || item.fileURL));
    });

    for (const normalized of candidates) {
        if (isSupportedVideoURL(normalized)) return normalized;
    }
    return null;
}

function isAvailable(context) {
    const url = firstSupportedVideoURLFromContext(context);
    return {
        isAvailable: true,
        isContextMatch: Boolean(url)
    };
}

function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: 'ui/index.html',
        width: 520,
        height: 650,
        isFloating: true,
        title: 'Apify Video Downloader'
    });
}
