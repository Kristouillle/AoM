# Sources

The local seed data is based on normalized facts from these Age of Empires Series Wiki pages:

- [Pantheon](https://ageofempires.fandom.com/wiki/Pantheon)
- [Unit (Age of Mythology)](https://ageofempires.fandom.com/wiki/Unit_(Age_of_Mythology))
- [Building (Age of Mythology)](https://ageofempires.fandom.com/wiki/Building_(Age_of_Mythology))
- [God](https://ageofempires.fandom.com/wiki/God)
- [God power](https://ageofempires.fandom.com/wiki/God_power)
- [Technology (Age of Mythology)](https://ageofempires.fandom.com/wiki/Technology_(Age_of_Mythology))

Fandom pages state that community content is available under CC-BY-SA unless otherwise noted. Keep source URLs attached to any generated or curated records. Avoid copying full article descriptions into the app; store gameplay facts and short original notes instead.

Unit and building icons in `assets/icons/` are downloaded from Fandom-hosted image URLs matched by `tools/import-icons.mjs`. The generated manifest keeps both the gameplay source page and the image source URL for each matched icon.

Unit stats, attack values, unit upgrade chains, and technology effect snippets in `data/generated/aom-details.js` are extracted from unit and technology infobox/table data by `tools/import-details.mjs`. These generated records should keep source URLs attached and remain factual summaries rather than copied article prose.
