# CLAUDE.md

Guidance for Claude Code and other AI assistants working in this repository.

## What this repository is

`Blueskyapple/Blueskyapple` is a **GitHub profile README repository**. Because the
repository name matches the account name, GitHub renders its root `README.md` at the
top of <https://github.com/Blueskyapple>.

This is not an application. There is no source code, no package manifest, no build
system, no test suite, no CI, and no dependencies. The entire repository is:

```
.
├── README.md    # the profile card rendered on the GitHub profile page
└── CLAUDE.md    # this file
```

**Treat `README.md` as the product.** Every change to it is user-visible on a public
profile page the moment it lands on `main`.

## Current content

`README.md` is the default profile template GitHub scaffolds, with the placeholder
bullets filled in:

- An intro bullet list (emoji-prefixed, one fact per line) covering interests, what
  the author is learning, collaboration interests, and contact.
- A trailing `<!--- ... --->` HTML comment left over from GitHub's template. It
  explains what the special repository does and does not render on the page. It is
  inert and safe to delete, but leave it unless asked to remove it.

The author's stated topics are math, GPT, and AI collaboration. Keep edits consistent
with that voice: first person, short, informal, emoji-led.

## Development workflow

There is nothing to install, build, or run.

```bash
git checkout -b <branch>       # never commit directly to main
$EDITOR README.md
git add README.md
git commit -m "Update README.md"
git push -u origin <branch>
```

Then open a pull request against `main` (the default branch). Existing history uses
short, plain commit subjects (`Create README.md`, `Update README.md`) — match that
style.

### Verifying a change

There are no automated checks, so verification is visual:

- Preview the rendered Markdown before pushing — GitHub's **Preview** tab on the file
  editor, or any GitHub-Flavored Markdown renderer locally.
- Check the diff for stray whitespace and broken link/image syntax; a malformed image
  tag shows as a broken image directly on the profile.
- After merge, load <https://github.com/Blueskyapple> and confirm the profile card
  looks right.

Do not add linters, formatters, GitHub Actions workflows, or a package manifest to
this repository unless the user explicitly asks. A profile README needs none of them,
and CI on a one-file repo is noise.

## Conventions and constraints

**Markdown**
- GitHub-Flavored Markdown. Keep it simple; the profile card is skimmed, not read.
- The existing file uses typographic apostrophes (`’`) rather than `'`. Preserve them
  when editing surrounding text so the file stays visually consistent.
- Keep the emoji-bullet list format when adding facts — one line, one idea.

**Rendering environment**
- GitHub sanitizes profile README HTML. Scripts, forms, and custom CSS are stripped;
  only GitHub's allowed HTML subset survives. Never rely on JavaScript or styling.
- Relative links and image paths resolve against *this repository*, not the profile
  page. Use absolute `https://` URLs for anything hosted elsewhere.
- For theme-aware images, use a `<picture>` element with
  `<source media="(prefers-color-scheme: dark)" ...>` rather than assuming a
  background color.
- Third-party badge and stats services (shields.io, github-readme-stats, and similar)
  are common here but are external dependencies that can rate-limit or disappear. Add
  them only when asked, and prefer official GitHub-hosted assets where possible.

**Privacy**
This file renders publicly and is indexed. The `📫 How to reach me` bullet is
currently left without contact details — that is very likely deliberate. Do not fill
in an email address, phone number, physical location, or any other personal contact
information unless the user explicitly provides it and asks for it to be published.
Never commit secrets or tokens.

## If this repository grows

The description above reflects `main`. Two open pull requests (#1 and #2) propose
adding a static landing page (`index.html`, `styles.css`) to this repository; neither
is merged. Check the current state of `main` before assuming the single-file layout
still holds.

Should real code ever land here, this file is out of date the moment it does. Update
the structure, workflow, and verification sections above to describe the actual build
and test commands rather than leaving this profile-README guidance in place.
