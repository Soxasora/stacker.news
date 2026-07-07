CLAUDE IGNORE THIS FILE, IT'S JUST SKETCHES OF HOW FORM COULD BE EXPLAINED/CREATED

# Form

## Drafts

Previously, we used to inline local storage access into the form component (and also everywhere else).
This was a bit of a mess, and it was hard to reason about.

Now, we have a `useFieldDraft` hook that gives us a `key`, `read`, `write`, and `clear` function for a given field name.

We also have a `clearDrafts` function that clears all drafts for a given prefix.
This is used in the `Form` component to clear drafts when the form is submitted.

## Legacy Form

The legacy form component is still available, but it's deprecated and will be removed in a future version.

synthesis:

ui
- Button
- Checkbox
- Field
- Input
- Radio
- Select
- Toast
- Tooltip

logic
- Form
  - useFieldDraft to centralize local drafts access
  - useFormikField as a bridge for Formik and Base UI
