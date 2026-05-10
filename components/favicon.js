import { createContext, useContext, useMemo, useState } from 'react'
import { useHasNewNotes } from './use-has-new-notes'
import { useDomainSeo } from './domain-seo'
import Head from 'next/head'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'

const FAVICONS = {
  default: '/favicon.png',
  notify: '/favicon-notify.png',
  comments: '/favicon-comments.png',
  notifyWithComments: '/favicon-notify-with-comments.png'
}

const getFavicon = (hasNewNotes, hasNewComments) => {
  if (hasNewNotes && hasNewComments) return FAVICONS.notifyWithComments
  if (hasNewNotes) return FAVICONS.notify
  if (hasNewComments) return FAVICONS.comments
  return FAVICONS.default
}

export const FaviconContext = createContext()

export default function FaviconProvider ({ children }) {
  const hasNewNotes = useHasNewNotes()
  const [hasNewComments, setHasNewComments] = useState(false)
  const seo = useDomainSeo()
  const brandFavicon = seo?.faviconId ? `${PUBLIC_MEDIA_URL}/${seo.faviconId}` : null

  // TODO: per-domain favicons don't surface notifications / live comments yet
  const favicon = useMemo(() => {
    if (brandFavicon) return brandFavicon
    return getFavicon(hasNewNotes, hasNewComments)
  }, [hasNewNotes, hasNewComments, brandFavicon])

  const contextValue = useMemo(() => ({
    favicon,
    hasNewNotes,
    hasNewComments,
    setHasNewComments
  }), [favicon, hasNewNotes, hasNewComments, setHasNewComments])

  return (
    <FaviconContext.Provider value={contextValue}>
      <Head>
        <link rel='shortcut icon' href={favicon} />
      </Head>
      {children}
    </FaviconContext.Provider>
  )
}

export function useFavicon () {
  return useContext(FaviconContext)
}
