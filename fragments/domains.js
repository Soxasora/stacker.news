import { gql } from 'graphql-tag'

export const DOMAIN_FIELDS = gql`
  fragment DomainFields on Domain {
    domainName
    status
    subName
  }
`

export const DOMAIN_VERIFICATION_RECORD_FIELDS = gql`
  fragment DomainVerificationRecordFields on DomainVerificationRecord {
    id
    type
    recordName
    recordValue
    status
    lastCheckedAt
  }
`

export const DOMAIN_VERIFICATION_RECORD_MAP_FIELDS = gql`
  ${DOMAIN_VERIFICATION_RECORD_FIELDS}
  fragment DomainVerificationRecordMapFields on DomainVerificationRecordMap {
    CNAME {
      ...DomainVerificationRecordFields
    }
    SSL {
      ...DomainVerificationRecordFields
    }
  }
`

export const DOMAIN_VERIFICATION_ATTEMPT_FIELDS = gql`
  fragment DomainVerificationAttemptFields on DomainVerificationAttempt {
    id
    stage
    status
    message
    createdAt
  }
`

export const DOMAIN_CERTIFICATE_FIELDS = gql`
  fragment DomainCertificateFields on DomainCertificate {
    id
    certificateArn
    status
  }
`

export const DOMAIN_FULL_FIELDS = gql`
  ${DOMAIN_FIELDS}
  ${DOMAIN_VERIFICATION_RECORD_MAP_FIELDS}
  ${DOMAIN_VERIFICATION_ATTEMPT_FIELDS}
  fragment DomainFullFields on Domain {
    ...DomainFields
    records {
      ...DomainVerificationRecordMapFields
    }
    attempts {
      ...DomainVerificationAttemptFields
    }
  }
`

export const DOMAIN_SEO_FIELDS = gql`
  fragment DomainSeoFields on DomainSeo {
    title
    tagline
    faviconId
  }`

export const GET_DOMAIN = gql`
  ${DOMAIN_FULL_FIELDS}
  query Domain($subName: String!) {
    domain(subName: $subName) {
      ...DomainFullFields
    }
  }
`

export const GET_DOMAIN_SEO = gql`
  ${DOMAIN_SEO_FIELDS}
  query DomainSeo($subName: String!) {
    domain(subName: $subName) {
      seo {
        ...DomainSeoFields
      }
    }
  }
`

export const SET_DOMAIN = gql`
  mutation SetDomain($subName: String!, $domainName: String) {
    setDomain(subName: $subName, domainName: $domainName) {
      domainName
    }
  }
`

export const UPSERT_DOMAIN_SEO = gql`
  ${DOMAIN_SEO_FIELDS}
  mutation UpsertDomainSeo($subName: String!, $seo: DomainSeoInput!) {
    upsertDomainSeo(subName: $subName, seo: $seo) {
      ...DomainSeoFields
    }
  }
`
