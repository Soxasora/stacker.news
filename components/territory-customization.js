import { Form, Input } from './form'
import { domainSeoSchema, subThemeSchema } from '@/lib/validate'
import { truncateDesc } from '@/lib/domains/seo'
import { useField } from 'formik'
import { useState } from 'react'
import { useToast } from './toast'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'
import { FileUpload } from './file-upload'
import { Button } from 'react-bootstrap'
import SnIcon from '@/svgs/sn.svg'
import styles from './territory-customization.module.css'

// uploads via the presigned-POST flow; the form holds the upload id and the
// preview url is either the freshly uploaded one or derived from that id.
function AssetField ({ label, name, hint, defaultAsset, width = 48, height = 48, accept = 'image/*' }) {
  const [field, , helpers] = useField(name)
  const [uploading, setUploading] = useState(false)
  const [freshUrl, setFreshUrl] = useState(null)
  const toaster = useToast()

  const previewUrl = freshUrl || (field.value ? `${PUBLIC_MEDIA_URL}/${field.value}` : defaultAsset)

  return (
    <div className='mb-3'>
      <label className='form-label'>{label}</label>
      <div className='d-flex align-items-end gap-3'>
        <div className={styles.preview}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={`${name} preview`}
              width={width}
              height={height}
              className={styles.previewImage}
            />
          )}
        </div>
        <div className='d-flex flex-column gap-2'>
          <div className='d-flex align-items-center gap-2'>
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
              <Button size='sm' variant='secondary' disabled={uploading}>
                {uploading ? 'uploading…' : (field.value ? 'replace' : 'upload')}
              </Button>
            </FileUpload>
            {field.value && (
              <Button
                size='sm' variant='danger'
                onClick={() => { helpers.setValue(null); setFreshUrl(null) }}
              >
                remove
              </Button>
            )}
          </div>
          {hint && <small className='text-muted'>{hint}</small>}
        </div>
      </div>
    </div>
  )
}

export function TerritoryThemeForm ({ sub }) {
  return (
    <Form
      initial={{}}
      schema={subThemeSchema}
      enableReinitialize
      className='mt-2 mb-4'
    >
      <AssetField
        label='site logo'
        name='logoId'
        hint='shown in the nav (in place of the SN icon)'
        width={64}
        height={64}
        defaultAsset={<SnIcon />}
      />
      <div className='row'>
        <Input
          groupClassName='col-4'
          label='primary color'
          name='primaryColor'
          type='color'
          className={styles.colorInput}
        />
        <Input
          groupClassName='col-4'
          label='secondary color'
          name='secondaryColor'
          type='color'
          className={styles.colorInput}
        />
        <Input
          groupClassName='col-4'
          label='link color'
          name='linkColor'
          type='color'
          className={styles.colorInput}
        />
      </div>
    </Form>
  )
}

export function TerritoryDomainSeoForm ({ sub }) {
  return (
    <Form
      initial={{}}
      schema={domainSeoSchema}
      enableReinitialize
      className='mt-2'
    >
      <AssetField
        label='site favicon'
        name='faviconId'
        hint='shown in browser tabs on your custom domain. 32x32 recommended'
        width={64}
        height={64}
        defaultAsset='/favicon.png'
      />
      <Input
        label='site title'
        name='title'
        placeholder={`~${sub?.name}`}
        hint='the page title of your territory, defaults to its name if left blank'
      />
      <Input
        as='textarea'
        rows={3}
        label='site tagline'
        name='tagline'
        placeholder={truncateDesc(sub, 120)}
        hint='the page description of your territory, defaults to the territory description if left blank'
      />
    </Form>
  )
}
