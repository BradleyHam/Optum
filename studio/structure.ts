import type {StructureResolver} from 'sanity/structure'

const pages = [
  ['home', 'Home'],
  ['heating', 'Heating'],
  ['plumbing', 'Plumbing'],
  ['ventilation', 'Ventilation & Cooling'],
  ['servicing', 'Servicing'],
  ['our-work', 'Our Work'],
  ['about', 'About'],
] as const

export const structure: StructureResolver = (S) => {
  const projects = S.documentTypeListItem('project')
    .title('Completed projects')
    .child(
      S.documentTypeList('project')
        .title('Completed projects')
        .defaultOrdering([{field: 'order', direction: 'asc'}]),
    )

  return S.list()
    .title('Optum website')
    .items([
      S.listItem()
        .title('Website wording')
        .child(
          S.list()
            .title('Website wording')
            .items([
              ...pages.map(([key, title]) =>
                S.listItem()
                  .title(title)
                  .id(`page-${key}`)
                  .child(
                    S.document().schemaType('pageContent').documentId(`page.${key}`).title(title),
                  ),
              ),
              S.divider(),
              projects,
            ]),
        ),
      S.divider(),
      projects,
    ])
}
