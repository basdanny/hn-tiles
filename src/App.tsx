import React, { useState, useEffect } from 'react';
import { Search, X, Link as LinkIcon } from 'lucide-react';
import { getUrlThumbnail } from './utils/urlThumbnails';

interface HNHit {
  title: string;
  url: string;
  story_text: string | null;
  _highlightResult: {
    title: { value: string };
    url: { matchedWords: string[] };
  };
}

type ThumbnailDictionary = { [key: string]: string };

function App() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchTags');
    return saved ? JSON.parse(saved) : [];
  });
  const [results, setResults] = useState<HNHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<ThumbnailDictionary>({});

  useEffect(() => {
    localStorage.setItem('searchTags', JSON.stringify(searchTags));
    if (searchTags.length > 0) {
      fetchResults();
    }
  }, [searchTags]);

  useEffect(() => {    
    if (results.length > 0) {
      fetchThumbnails(results);
    }
  }, [results]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const query = searchTags.join(' ');
      const response = await fetch(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`);
      const data = await response.json();
      const dataHits = data.hits as HNHit[];
      setResults(dataHits);

    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThumbnails = async (dataHits: HNHit[]) => {
    const existingThumbnails = JSON.parse(localStorage.getItem('thumbnails') || '{}');    
      const thumbnailsToFetch = dataHits.filter(hit => !existingThumbnails[hit.url]);
      const newThumbnails: { [key: string]: string | null }[] = [];
      for (const hit of thumbnailsToFetch) {        
        const thumbnail = await getUrlThumbnail(hit.url);
        newThumbnails.push({ [hit.url]: thumbnail });
      }
      const limitedSizeExistingThumbnails = Object.entries(existingThumbnails).slice(-50).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const allThumbnails = { ...limitedSizeExistingThumbnails, ...Object.assign({}, ...newThumbnails) };      
      localStorage.setItem('thumbnails', JSON.stringify(allThumbnails));
      setThumbnails(allThumbnails);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && !searchTags.includes(searchInput.trim())) {
      setSearchTags([...searchTags, searchInput.trim()]);
      setSearchInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSearchTags(searchTags.filter(tag => tag !== tagToRemove));
  };

  const invalidUrl = (url: string | null) => {
    return !url || url.startsWith('/') || url.startsWith('.');
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="mb-4 flex items-center bg-orange-500 text-white font-verdana">
          <a href="https://news.ycombinator.com"><img src="https://news.ycombinator.com/y18.svg" width="18" height="18" className="mr-2 border border-white ml-1" /></a>
          Hacker News
        </h2>
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter search terms..."
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search size={20} />
            </button>
          </form>

          {searchTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (searchTags.length > 0 && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((hit, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hit?._highlightResult?.url?.matchedWords.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {hit?.url ? (<a
                      href={hit?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 flex items-center gap-2"
                    >
                      {hit?.title}
                      <LinkIcon size={16} className="inline" />
                    </a>
                    ) : hit?.title
                    }
                  </h3>
                  {hit?.story_text && (
                    <p className="text-gray-600 line-clamp-3 group">
                      <div dangerouslySetInnerHTML={{ __html: hit.story_text || '' }} data-tooltip-target="tooltip-storytext" data-tooltip-trigger="click" className="cursor-pointer" data-tooltip-placement="top" />
                      <div id="tooltip-storytext" role="tooltip" className="inline-block absolute invisible group-hover:visible z-10 p-2 bg-gray-500 text-gray-100 rounded">
                        <div dangerouslySetInnerHTML={{ __html: hit.story_text || '' }} />
                      </div>
                    </p>
                  )}
                  {!invalidUrl(hit.url) && (
                    <div className="h-48 bg-gray-200 relative">
                      <img
                        src={thumbnails[hit.url] || 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='}
                        alt={hit.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && results.length === 0 && searchTags.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            No results found for your search terms.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;