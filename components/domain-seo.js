import { Button, InputGroup } from 'react-bootstrap'
import { Form, Input, SubmitButton } from './form'
import { useMutation, useQuery } from '@apollo/client/react'
import { domainSeoSchema, MAX_BRANDING_TEXT_LENGTH, MAX_BRANDING_TAGLINE_LENGTH } from '@/lib/validate'
import { useToast } from '@/components/toast'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'
import { DOMAIN_SEO, UPSERT_DOMAIN_SEO } from '@/fragments/subs'
import { GET_DOMAIN } from '@/fragments/domains'
import { FileUpload } from './file-upload'
import { useField } from 'formik'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useDomain } from './territory-domains'
import removeMd from 'remove-markdown'

const DomainSeoContext = createContext(null)

export const DomainSeoProvider = ({ seo: ssrSeo, children }) => {
  const [seo, setSeo] = useState(ssrSeo ?? null)

  useEffect(() => {
    if (ssrSeo !== undefined) {
      setSeo(ssrSeo)
    }
  }, [ssrSeo])

  return (
    <DomainSeoContext.Provider value={seo}>
      {children}
    </DomainSeoContext.Provider>
  )
}

/**
 * returns the active domain SEO, or null when no custom domain is in scope.
 * shape: { title, tagline, ogImageId, faviconId }
 *
 * permanently gated by useDomain(): SEO is only meaningful when the sub IS
 * the site (custom domain). On stacker.news/~mysub the page belongs to SN
 * and inherits SN's title/description/og:*.
 */
export const useDomainSeo = () => {
  const { domain } = useDomain()
  const seo = useContext(DomainSeoContext)
  if (!domain) return null
  return seo
}

// uploads via the presigned-POST flow; the form holds the upload id and the
// preview url is either the freshly uploaded one or derived from that id.
function SeoAssetField ({ label, name, hint, defaultAsset, width = 48, height = 48, accept = 'image/*' }) {
  const [field, , helpers] = useField(name)
  const [uploading, setUploading] = useState(false)
  const [freshUrl, setFreshUrl] = useState(null)
  const toaster = useToast()

  const previewUrl = freshUrl || (field.value ? `${PUBLIC_MEDIA_URL}/${field.value}` : defaultAsset)

  return (
    <div className='mb-3'>
      <label className='form-label'>{label}</label>
      <div className='d-flex align-items-center gap-2'>
        <div style={{ borderRadius: '0.4rem', border: '1px solid var(--theme-borderColor)', padding: '0.1rem' }}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={`${name} preview`}
              width={width}
              height={height}
              style={{ objectFit: 'contain', borderRadius: 4, background: 'var(--theme-inputBg)' }}
            />
          )}
        </div>
        <FileUpload
          allow={accept}
          avatar
          onUpload={() => setUploading(true)}
          onSuccess={({ id, url }) => {
            setUploading(false)
            setFreshUrl(url)
            helpers.setValue(Number(id))
          }}
          onError={() => {
            setUploading(false)
            toaster.danger('upload failed')
          }}
        >
          <Button size='sm' variant='outline-secondary' disabled={uploading}>
            {uploading ? 'uploading…' : (field.value ? 'replace' : 'upload')}
          </Button>
        </FileUpload>
        {field.value && (
          <Button
            size='sm' variant='outline-danger'
            onClick={() => { helpers.setValue(null); setFreshUrl(null) }}
          >
            remove
          </Button>
        )}
      </div>
      {hint && <small className='text-muted d-block mt-1'>{hint}</small>}
    </div>
  )
}

// strips markdown, collapses whitespace, and clamps to max length so that
// sub.desc can be reused as a sane meta-description default
const taglineFromDesc = (desc) => {
  if (!desc) return ''
  const plain = removeMd(desc).replace(/\s+/g, ' ').trim()
  return plain.length > MAX_BRANDING_TAGLINE_LENGTH
    ? plain.slice(0, MAX_BRANDING_TAGLINE_LENGTH)
    : plain
}

const titleFromName = (name) => {
  if (!name) return ''
  return name.length > MAX_BRANDING_TEXT_LENGTH
    ? name.slice(0, MAX_BRANDING_TEXT_LENGTH)
    : name
}

export function TerritoryDomainSeoForm ({ sub }) {
  const [upsertDomainSeo] = useMutation(UPSERT_DOMAIN_SEO)
  const { data, refetch } = useQuery(DOMAIN_SEO, {
    variables: { sub: sub.name },
    ssr: false,
    nextFetchPolicy: 'cache-and-network'
  })
  // a Domain row must exist before we can save SEO (DomainSeo is FK'd to it)
  const { data: domainData } = useQuery(GET_DOMAIN, {
    variables: { subName: sub.name },
    ssr: false
  })
  const toaster = useToast()
  const seo = data?.sub?.domainSeo
  const hasDomain = !!domainData?.domain

  // first-time editors see title/tagline pre-seeded from the sub itself.
  // once a DomainSeo row exists we respect what the owner saved (including
  // explicit clears), so the seeded default does not silently re-appear.
  const initial = useMemo(() => {
    if (!seo) {
      return {
        title: titleFromName(sub.name),
        tagline: taglineFromDesc(sub.desc),
        ogImageId: null,
        faviconId: null
      }
    }
    return {
      title: seo.title || '',
      tagline: seo.tagline || '',
      ogImageId: seo.ogImageId || null,
      faviconId: seo.faviconId || null
    }
  }, [seo, sub.name, sub.desc])

  const onSubmit = async (values) => {
    const input = {
      title: values.title?.trim() || null,
      tagline: values.tagline?.trim() || null,
      ogImageId: values.ogImageId || null,
      faviconId: values.faviconId || null
    }
    try {
      await upsertDomainSeo({ variables: { subName: sub.name, input } })
      refetch()
      toaster.success('SEO saved, may take a few minutes to take effect')
    } catch (error) {
      toaster.danger(error.message)
    }
  }

  return (
    <Form
      initial={initial}
      schema={domainSeoSchema}
      onSubmit={onSubmit}
      enableReinitialize
      className='mt-2'
    >
      {!hasDomain && (
        <div className='alert alert-info' role='alert'>
          set up a custom domain to make these settings take effect
        </div>
      )}
      <Input
        label='site title'
        name='title'
        placeholder='stacker news'
        prepend={<InputGroup.Text>name</InputGroup.Text>}
        hint='replaces "stacker news" in the page title on your custom domain'
      />
      <Input
        label='tagline'
        name='tagline'
        placeholder='moderating forums with money'
        hint='the page description (meta) for your custom domain'
      />
      <h6 className='mt-4 mb-3'>assets</h6>
      <SeoAssetField
        label='favicon'
        name='faviconId'
        hint='shown in browser tabs on your custom domain. 32x32 PNG recommended.'
        defaultAsset='/favicon.png'
        width={32}
        height={32}
      />
      <SeoAssetField
        label='social preview'
        name='ogImageId'
        hint='og:image for social link previews on your custom domain. 1200x630 recommended.'
        defaultAsset={`https://capture.stacker.news/~${sub.name}`}
        width={1200 / 4}
        height={630 / 4}
      />
      <div className='mt-3 d-flex justify-content-end'>
        <SubmitButton variant='primary' disabled={!hasDomain}>save SEO</SubmitButton>
      </div>
    </Form>
  )
}
