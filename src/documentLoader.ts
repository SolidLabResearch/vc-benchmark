import {CONTEXTS} from "./contexts";
import {logv2} from "./utils/log";
import {IRegistry} from "./interfaces";

interface CreateDocumentLoaderOptionsDefault {
  logging: { urls: { missing: boolean; present: boolean }; documents: boolean; loadedContextNames: boolean };
}

export const createDocumentLoaderOptionsDefault: CreateDocumentLoaderOptionsDefault = {
  logging: {
    loadedContextNames: true,
    urls: {
      present: false, // Log URLs present in contexts
      missing: true
    }, // Log URLs not present in contexts
    documents: false // Log resolved document
  }
}

const fetchJsonDocument = async (url: string) => {
  const response = await fetch(url, {headers: {Accept: 'application/ld+json'}})
  let document = undefined
  switch (response.headers.get('content-type')) {
    case 'application/json':
    case 'application/ld+json':
    case 'application/ld+did+json':
      document = await response.json()
      break;
    default:
      throw new Error(
        `Error: ${response.headers.get('content-type')} not yet supported.
                        Status: ${response.status} - ${response.statusText}
                        URL: ${response.url}
                        `
      )
  }
  return document
}
export const createDocumentLoader = (
  contexts: any,
  registry?: IRegistry
) => {

  const options = createDocumentLoaderOptionsDefault;
  const cache = new Map<string, any>()

  if (options.logging.loadedContextNames)
    console.log('Loaded contexts: ', Object.keys(contexts))

  return async (url: string) => {
    if (url === undefined)
      throw new Error('URL is undefined!')

    // Check loaded contexts
    if (url in contexts) {
      if (options.logging.urls.present)
        console.log(`URL: ${url}`)
      if (options.logging.documents)
        logv2(contexts[url], `📄Document:`)

      return {
        contextUrl: undefined, // this is for a context via a link header
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        document: contexts[url], // this is the actual document that was loaded
        documentUrl: url, // this is the actual context URL after redirects
      }
    }

    if (registry!!) {
      const resolvedDocument = registry!.resolve(url)
      return {
        contextUrl: undefined,
        document: resolvedDocument,
        documentUrl: url,
      }
    }

    // If present, return from cache
    if (cache.has(url)) {
      return {
        contextUrl: undefined,
        documentUrl: url,
        document: cache.get(url)
      }
    }

    // Lastly, try to resolve from the network & cache
    const document = await fetchJsonDocument(url)
    cache.set(url, document)
    return {
      contextUrl: undefined,
      documentUrl: url,
      document
    }
  }
}
export const localDocumentLoader = createDocumentLoader(CONTEXTS)

export const defaultContexts = CONTEXTS
