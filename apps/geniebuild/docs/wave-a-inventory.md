# Wave A control inventory

Status after foundation: `works` = wired through shared cascade; `verify` = apply path exists, confirm in QA.

| Control | Key | Canvas (ElementsSection) | SiteNextJS | Status |
|---------|-----|--------------------------|------------|--------|
| Heading color | `color` | yes (explicit override wins) | same module | works |
| Heading secondary | `secondaryHeadingColor` | yes | same | works |
| Heading font* | fontFamily/size/weight/… | yes | same | works |
| Heading align | `textAlign` | yes | same | works |
| Text color | `color` | yes | same | works |
| Text link | `linkColor` | yes | same | works |
| Button fill/text/border | backgroundColor/color/borderColor | yes | same | works |
| Badge colors | backgroundColor/color/borderColor | yes | same | works |
| Feature-box title/desc/icon | `titleColor`/`descriptionColor`/`icon*` | yes (`resolveElementColor`) | same | works |
| Nav link colors | color/hoverColor/activeColor | yes | same | works |
| Image object-fit/radius | aspectRatio/objectFit/… | yes | same | verify |
| Section bg color/gradient/image | `styles.background` | resolveSectionBackground | same | works |
| Margin/padding (Layout) | margin*/padding* | LayoutSpacingBlock → style | CSS + inline | works |
