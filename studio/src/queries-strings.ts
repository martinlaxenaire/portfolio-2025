export const gameQueryString = `*[
  _type == "gameContent"
  && slug.current == "game"
][0]{
  title,
  "levels": levels[]->{
    title,
    type,
    pointsNeeded,
    contentUnlocked,
    tip
  },
  "features": features[]->{
    title,
    type,
    pointsNeeded,
    contentUnlocked,
    tip
  },
}`

export const homeQueryString = `*[
  _type == "page"
  && slug.current == "martin-laxenaire"
][0]{
  title,
  seoTitle,
  seoDescription,
  baseline,
  intro,
  projectsTitle,
  projectsDescription,
  "projects": projects[]->{
    title,
    date,
    url,
    stack,
    "cover": select(
      defined(cover.asset) => cover.asset->{
        _id,
        url
      },
      null
    )
  },
  yearsTitle,
  processDescription,
  invoicesTitle,
  invoicesDescription,
  recognition,
  openSourceTitle,
  openSourceDescription,
  openSourceLegend,
  footerTitle,
  footerDescription,
  "socials": socials[]->{
    title,
    date,
    url,
  },
}`

// export const homeQueryString = `*[
//   _type == "page"
//   && slug.current == "martin-laxenaire"
// ][0]{
//   title,
//   baseline,
//   intro,
//   "years": years[]->{
//     title,
//     date,
//     videos
//   },
//   projectsTitle,
//   "projects": projects[]->{
//     title,
//     date,
//     url,
//     stack,
//     "cover": select(
//       defined(cover.asset) => cover.asset->{
//         _id,
//         url
//       },
//       null
//     )
//   },
//   recognition,
//   openSource
// }`
