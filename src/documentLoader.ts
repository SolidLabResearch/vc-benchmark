
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
            present:false, // Log URLs present in contexts
            missing: true}, // Log URLs not present in contexts
        documents: false // Log resolved document
    }
}

export const createDocumentLoader = (
    contexts: any,
    registry?: IRegistry
    ) => {

    const options = createDocumentLoaderOptionsDefault;

    if(options.logging.loadedContextNames)
        console.log('Loaded contexts: ', Object.keys(contexts))

    return async (url:string) => {
        if(url === undefined)
            throw new Error('URL is undefined!')
        if (url in contexts) {
            if(options.logging.urls.present)
                console.log(`URL: ${url}`)
            if(options.logging.documents)
                logv2(contexts[url], `📄Document:`)

            return {
                contextUrl: undefined, // this is for a context via a link header
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                document: contexts[url], // this is the actual document that was loaded
                documentUrl: url, // this is the actual context URL after redirects
            }
        }

        if(registry!!) {

            const resolvedDocument = registry!.resolve(url)
            return {
                contextUrl: undefined,
                document: resolvedDocument,
                documentUrl: url,
            }
        }

        // No document to be loaded.
        if(options.logging.urls.missing)
            console.log(`⚠️Missing URL: ${url}`)

        // return empty document if `url` is not in local contexts
        return {
            contextUrl: undefined,
            documentUrl: url,
            document: {},
        }
    }
}
export const localDocumentLoader = createDocumentLoader(CONTEXTS)

export const defaultContexts = CONTEXTS
