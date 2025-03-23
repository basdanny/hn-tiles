const PROXY_BASE_URL = 'https://corsproxy.basdanny.workers.dev/';

export const getUrlThumbnail = async (url: string): Promise<string | null> => {        
    if (!url) 
        return null;

    try {
        const response = await fetch(PROXY_BASE_URL + url, {                        
            headers: {
                'Range': 'bytes=0-6144' // limit size of the fetched response to 6KB
            }
        });
        const html = await response.text();

        // Create a DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Look for og:image meta tag
        const ogImage = doc.querySelector('meta[property="og:image"]');        
        if (ogImage) {
            return ogImage.getAttribute('content') as string;
        }

        // Fallback to Twitter image
        const twitterImage = doc.querySelector('meta[name="twitter:image"]');
        if (twitterImage) {
            return twitterImage.getAttribute('content') as string;
        }

        // Fallback to favicon
        //const favicon = `https://www.google.com/s2/favicons?domain=${url}&sz=512`;        
        const favicon = `https://icon.horse/icon/${new URL(url).hostname}`;

        // // Look for title
        // let title = doc.querySelector('title')?.nodeValue;
        
        // // Look for description
        // let description = doc.querySelector('meta[property="description"]');
        // if (description) {
        //     return ogImage.getAttribute('content');
        // }

        return favicon;
    } catch (error) {
        console.error('Error fetching thumbnail (og:image):', error);
        return null;
    }
}
