import { memo, useEffect, useRef, useState, useCallback } from 'react'
import classNames from 'classnames'
import useDarkMode from './dark-mode'
import styles from './text.module.css'
import { Button } from 'react-bootstrap'
import { TwitterTweetEmbed } from 'react-twitter-embed'
import YouTube from 'react-youtube'
import LoadErrorIcon from '@/svgs/file-warning-line.svg'
import Link from 'next/link'
import Moon from '@/svgs/moon-fill.svg'

const Loading = ({ provider, src, className, style, error }) => {
  let host = provider
  try {
    host = new URL(src).hostname
  } catch (e) {
    console.error(e)
  }
  return (
    <div className={classNames(styles.embedLoading, className)} style={style}>
      <div className={styles.embedLoadingMessage}>
        {error ? <LoadErrorIcon className='fill-grey' /> : <Moon className='spin fill-grey' />}
        <div>{error ? `${provider} embed is not available at the moment.` : `loading ${provider}...`}</div>
        <Link href={src} target='_blank' rel='noopener nofollow noreferrer'>
          view on {host}
        </Link>
      </div>
    </div>
  )
}

function LoaderContainer ({ provider, src, loaded, error, className, containerClassName, containerStyle, children }) {
  if (error) {
    return <Loading provider={provider} src={src} className={className} error={error} />
  }
  return (
    <>
      {!loaded && <Loading provider={provider} src={src} className={className} error={error} />}
      <div className={containerClassName} style={{ display: loaded ? 'block' : 'none', ...containerStyle }}>
        {children}
      </div>
    </>
  )
}

function TweetSkeleton ({ className }) {
  return (
    <div className={classNames(styles.tweetsSkeleton, className)}>
      <div className={styles.tweetSkeleton}>
        <div className={`${styles.img} clouds`} />
        <div className={styles.content1}>
          <div className={`${styles.line} clouds`} />
          <div className={`${styles.line} clouds`} />
          <div className={`${styles.line} clouds`} />
        </div>
      </div>
    </div>
  )
}

export const NostrEmbed = memo(function NostrEmbed ({ src, className, topLevel, id, iframeRef, loaded, error }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!iframeRef.current) return

    const setHeightFromIframe = (e) => {
      if (e.origin !== 'https://njump.me' || !e?.data?.height || e.source !== iframeRef.current.contentWindow) return
      iframeRef.current.height = `${e.data.height}px`
    }

    window?.addEventListener('message', setHeightFromIframe)

    // https://github.com/vercel/next.js/issues/39451
    iframeRef.current.src = `https://njump.me/${id}?embed=yes`

    return () => window?.removeEventListener('message', setHeightFromIframe)
  }, [iframeRef.current, id])

  return (
    <>
      <LoaderContainer provider='nostr' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.nostrContainer, !show && styles.twitterContained, className)}>
        <iframe
          ref={iframeRef}
          width={topLevel ? '550px' : '350px'}
          style={{ maxWidth: '100%' }}
          height={iframeRef.current?.height || (topLevel ? '200px' : '150px')}
          frameBorder='0'
          sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
          allow=''
        />
        {!show &&
          <Button size='md' variant='info' className={styles.twitterShowFull} onClick={() => setShow(true)}>
            <div>show full note</div>
            <small className='fw-normal fst-italic'>or other stuff</small>
          </Button>}
      </LoaderContainer>
    </>
  )
})

const SpotifyEmbed = function SpotifyEmbed ({ src, className, iframeRef, loaded, error }) {
  // https://open.spotify.com/track/1KFxcj3MZrpBGiGA8ZWriv?si=f024c3aa52294aa1
  // Remove any additional path segments
  const url = new URL(src)
  url.pathname = url.pathname.replace(/\/intl-\w+\//, '/')

  useEffect(() => {
    if (!iframeRef.current) return

    const id = url.pathname.split('/').pop()

    // https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const options = {
        uri: `spotify:episode:${id}`
      }
      const callback = (EmbedController) => {}
      IFrameAPI.createController(iframeRef.current, options, callback)
    }

    return () => { window.onSpotifyIframeApiReady = null }
  }, [iframeRef.current, url.pathname])

  return (
    <LoaderContainer provider='spotify' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.spotifyWrapper, className)}>
      <iframe
        ref={iframeRef}
        title='Spotify Web Player'
        src={`https://open.spotify.com/embed${url.pathname}`}
        width='100%'
        height='152'
        allowFullScreen
        frameBorder='0'
        allow='encrypted-media; clipboard-write;'
        style={{ borderRadius: '12px' }}
        sandbox='allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin'
      />
    </LoaderContainer>
  )
}

const Embed = memo(function Embed ({ src, provider, id, meta, className, topLevel }) {
  const [darkMode] = useDarkMode()
  const [overflowing, setOverflowing] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)

  const noIframe = provider === 'youtube' || provider === 'twitter'
  const iframeRef = useRef(null)
  const handleLoad = useCallback(() => {
    setLoaded(true)
    if (provider === 'nostr') {
      iframeRef?.current?.contentWindow?.postMessage({ setDarkMode: darkMode }, '*')
    }
  }, [provider, darkMode])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  const clearLoadTimeout = useLoadTimeout({
    iframeRef: noIframe ? null : iframeRef,
    onLoad: handleLoad,
    onError: handleError
  })

  useEffect(() => setReady(true), [])
  if (!ready || error) {
    return <Loading provider={provider} src={src} className={className} error={error} />
  }

  // This Twitter embed could use similar logic to the video embeds below
  if (provider === 'twitter') {
    return (
      <LoaderContainer provider='twitter' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.twitterContainer, !show && styles.twitterContained, className)}>
        <TwitterTweetEmbed
          tweetId={id}
          options={{ theme: darkMode ? 'dark' : 'light', width: topLevel ? '550px' : '350px' }}
          key={darkMode ? '1' : '2'}
          placeholder={<TweetSkeleton className={className} />}
          onLoad={() => { setOverflowing(true); clearLoadTimeout(); setLoaded(true) }}
        />
        {overflowing && !show &&
          <Button size='lg' variant='info' className={styles.twitterShowFull} onClick={() => setShow(true)}>
            show full tweet
          </Button>}
      </LoaderContainer>
    )
  }

  if (provider === 'nostr') {
    return (
      <NostrEmbed src={src} className={className} topLevel={topLevel} id={id} iframeRef={iframeRef} loaded={loaded} error={error} />
    )
  }

  if (provider === 'wavlake') {
    return (
      <LoaderContainer provider='wavlake' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.wavlakeWrapper, className)}>
        <iframe
          ref={iframeRef}
          src={`https://embed.wavlake.com/track/${id}`} width='100%' height='380' frameBorder='0'
          allow='encrypted-media'
          sandbox='allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-same-origin'
        />
      </LoaderContainer>
    )
  }

  if (provider === 'spotify') {
    return (
      <SpotifyEmbed src={src} className={className} iframeRef={iframeRef} loaded={loaded} error={error} />
    )
  }

  if (provider === 'youtube') {
    return (
      <LoaderContainer provider='youtube' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.videoWrapper, className)}>
        <div className={classNames(styles.videoWrapper, className)}>
          <YouTube
            videoId={id}
            className={styles.videoContainer}
            opts={{
              playerVars: {
                start: meta?.start || 0
              }
            }}
            onReady={() => { clearLoadTimeout(); setLoaded(true) }}
            onError={() => { clearLoadTimeout(); setError(true) }}
          />
        </div>
      </LoaderContainer>
    )
  }

  if (provider === 'rumble') {
    return (
      <LoaderContainer provider='rumble' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.videoWrapper, className)}>
        <div className={styles.videoContainer}>
          <iframe
            ref={iframeRef}
            title='Rumble Video'
            allowFullScreen
            src={meta?.href}
            sandbox='allow-scripts'
          />
        </div>
      </LoaderContainer>
    )
  }

  if (provider === 'peertube') {
    return (
      <LoaderContainer provider='peertube' src={src} loaded={loaded} error={error} containerClassName={classNames(styles.videoWrapper, className)}>
        <div className={styles.videoContainer}>
          <iframe
            ref={iframeRef}
            title='PeerTube Video'
            allowFullScreen
            src={meta?.href}
            sandbox='allow-scripts'
          />
        </div>
      </LoaderContainer>
    )
  }

  return null
})

const useLoadTimeout = ({ iframeRef, timeout = 15000, onLoad, onError }) => {
  const timeoutRef = useRef(null)

  useEffect(() => {
    const iframeEl = iframeRef?.current
    const handleLoad = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      onLoad?.()
    }

    const handleError = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      onError?.()
    }

    if (iframeEl) {
      iframeEl.addEventListener('load', handleLoad)
      iframeEl.addEventListener('error', handleError)
    }
    timeoutRef.current = setTimeout(handleError, timeout)

    return () => {
      if (iframeEl) {
        iframeEl.removeEventListener('load', handleLoad)
        iframeEl.removeEventListener('error', handleError)
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [timeout, onLoad, onError])

  const clear = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  return clear
}

export default Embed
