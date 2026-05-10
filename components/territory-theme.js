import { Button } from 'react-bootstrap'
import { Form, Input, Select, SubmitButton } from './form'
import { useMutation, useQuery } from '@apollo/client/react'
import { subThemeSchema } from '@/lib/validate'
import { useToast } from '@/components/toast'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'
import { SUB_THEME, UPSERT_SUB_THEME } from '@/fragments/subs'
import { FileUpload } from './file-upload'
import { useField, useFormikContext } from 'formik'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useDomain } from './territory-domains'
import SnIcon from '@/svgs/sn.svg'

const SubThemeContext = createContext(null)

export const SubThemeProvider = ({ theme: ssrTheme, children }) => {
  const [theme, setTheme] = useState(ssrTheme ?? null)

  useEffect(() => {
    if (ssrTheme !== undefined) {
      setTheme(ssrTheme)
    }
  }, [ssrTheme])

  return (
    <SubThemeContext.Provider value={theme}>
      {children}
    </SubThemeContext.Provider>
  )
}

/**
 * returns the active sub theme, or null when no custom domain is in scope.
 * shape: { primaryColor, secondaryColor, linkColor, brandColor, logoId, defaultMode }
 *
 * to roll theming out to every sub, drop the useDomain() gate here AND in
 * api/ssrApollo.js (where theme is only fetched when domain is present).
 */
export const useSubTheme = () => {
  const { domain } = useDomain()
  const theme = useContext(SubThemeContext)
  if (!domain) return null
  return theme
}

// SN defaults from styles/globals.scss
const SN_DEFAULTS = {
  primaryColor: '#FADA5E',
  secondaryColor: '#F6911D',
  linkColor: '#007cbe',
  brandColor: '#FADA5E'
}

const normalizeColorOverride = (value, fallback) =>
  value && value !== fallback ? value : null

function ColorField ({ label, name, hint }) {
  return (
    <Input
      label={label}
      name={name}
      type='color'
      hint={hint}
      style={{ minWidth: '4rem', cursor: 'pointer' }}
    />
  )
}

// uploads via the presigned-POST flow; the form holds the upload id and the
// preview url is either the freshly uploaded one or derived from that id.
function ThemeAssetField ({ label, name, hint, defaultAsset, logo, width = 48, height = 48, accept = 'image/*' }) {
  const [field, , helpers] = useField(name)
  const formik = useFormikContext()
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
          {/* fallback to SN icon when no other logo is set */}
          {logo && !previewUrl && (
            <SnIcon
              width={width}
              height={height}
              style={{ objectFit: 'contain', fill: formik.values.brandColor, filter: `drop-shadow(0 0 6px ${formik.values.primaryColor})` }}
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

export function TerritoryThemeForm ({ sub }) {
  const [upsertSubTheme] = useMutation(UPSERT_SUB_THEME)
  const { data, refetch } = useQuery(SUB_THEME, {
    variables: { sub: sub.name },
    ssr: false,
    nextFetchPolicy: 'cache-and-network'
  })
  const toaster = useToast()
  const theme = data?.sub?.theme

  const initial = useMemo(() => ({
    primaryColor: theme?.primaryColor || SN_DEFAULTS.primaryColor,
    secondaryColor: theme?.secondaryColor || SN_DEFAULTS.secondaryColor,
    linkColor: theme?.linkColor || SN_DEFAULTS.linkColor,
    brandColor: theme?.brandColor || SN_DEFAULTS.brandColor,
    logoId: theme?.logoId || null,
    defaultMode: theme?.defaultMode || 'SYSTEM'
  }), [theme])

  const onSubmit = async (values) => {
    // values matching the scss defaults are stored as null so the cascade applies
    const input = {
      primaryColor: normalizeColorOverride(values.primaryColor, SN_DEFAULTS.primaryColor),
      secondaryColor: normalizeColorOverride(values.secondaryColor, SN_DEFAULTS.secondaryColor),
      linkColor: normalizeColorOverride(values.linkColor, SN_DEFAULTS.linkColor),
      brandColor: normalizeColorOverride(values.brandColor, SN_DEFAULTS.brandColor),
      logoId: values.logoId || null,
      defaultMode: values.defaultMode?.toUpperCase() || null
    }
    try {
      await upsertSubTheme({ variables: { subName: sub.name, input } })
      refetch()
      toaster.success('appearance saved, may take a few minutes to take effect')
    } catch (error) {
      toaster.danger(error.message)
    }
  }

  return (
    <Form
      initial={initial}
      schema={subThemeSchema}
      onSubmit={onSubmit}
      enableReinitialize
      className='mt-2'
    >
      <h6 className='mt-2 mb-3'>colors</h6>
      <div className='d-flex flex-wrap gap-3'>
        <ColorField label='primary' name='primaryColor' />
        <ColorField label='secondary' name='secondaryColor' />
        <ColorField label='link' name='linkColor' />
        <ColorField label='brand' name='brandColor' hint='nav logo fill (defaults to primary)' />
      </div>
      <h6 className='mt-4 mb-3'>logo</h6>
      <ThemeAssetField
        label='logo'
        name='logoId'
        hint='shown in the nav (replaces the SN icon). PNG/SVG recommended, square crop.'
        logo
        width={36}
        height={36}
      />
      <h6 className='mt-4 mb-3'>color mode</h6>
      <Select
        label='default theme for newbies'
        name='defaultMode'
        items={['SYSTEM', 'LIGHT', 'DARK']}
        hint="user's toggle still wins after they pick once"
      />
      <div className='mt-3 d-flex justify-content-end'>
        <SubmitButton variant='primary'>save appearance</SubmitButton>
      </div>
    </Form>
  )
}
