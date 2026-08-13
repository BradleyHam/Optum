import type {StructureResolver} from 'sanity/structure'

const pages = [
  ['home', 'Home'],
  ['heating', 'Heating'],
  ['plumbing', 'Plumbing'],
  ['ventilation', 'Ventilation & Cooling'],
  ['servicing', 'Servicing'],
  ['about', 'About'],
  ['our-work', 'Our Work'],
] as const

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Optum website')
    .items([
      S.listItem()
        .title('Website wording')
        .child(
          S.list()
            .title('Website wording')
            .items(
              pages.map(([key, title]) =>
                S.listItem()
                  .title(title)
                  .id(`page-${key}`)
                  .child(S.document().schemaType('pageContent').documentId(`page.${key}`).title(title)),
              ),
            ),
        ),
      S.divider(),
      S.documentTypeListItem('project').title('Completed projects'),
    ])
