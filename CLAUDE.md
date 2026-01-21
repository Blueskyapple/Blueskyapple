# CLAUDE.md - AI Assistant Guide

## Repository Overview

**Repository Type**: GitHub Profile Repository
**Purpose**: Special `username/username` repository that displays on the GitHub profile page
**Primary Language**: Markdown
**Status**: Active Profile Repository

This is a special GitHub repository where the `README.md` file is automatically displayed on the user's GitHub profile page at `github.com/Blueskyapple`. It serves as a personal introduction and portfolio showcase.

## Repository Structure

```
Blueskyapple/
├── .git/                   # Git version control
├── README.md               # Profile content (displayed on GitHub profile)
└── CLAUDE.md              # This file - AI assistant documentation
```

### File Inventory

1. **README.md** (368 bytes)
   - The main profile content
   - Visible on `github.com/Blueskyapple`
   - Contains: introduction, interests, learning goals, collaboration interests

## Codebase Characteristics

### Current State
- **No source code**: This is a documentation-only repository
- **No dependencies**: No package managers, build systems, or external libraries
- **No configuration files**: No .gitignore, build configs, or CI/CD pipelines
- **Minimal structure**: Single markdown file for profile display

### Technology Stack
- Pure Markdown documentation
- Git version control
- GitHub-hosted repository

## Development Workflows

### Making Changes to Profile Content

1. **Read Before Editing**
   - Always read `README.md` before making modifications
   - Understand existing content structure and tone

2. **Edit with Purpose**
   - Keep content concise and professional
   - Use GitHub-flavored Markdown
   - Consider visibility (this appears on public profile)

3. **Preview Considerations**
   - Changes appear immediately on profile after push
   - Verify markdown rendering locally if unsure
   - Check for proper emoji display (👋, 👀, 🌱, 💞️, 📫)

### Git Workflow

#### Branch Strategy
- **Development branches**: Must follow pattern `claude/claude-md-*`
- **Current branch**: `claude/claude-md-mko17m69xkzhwtzf-puiQw`
- **Main branch**: Used for production profile content

#### Commit Conventions
- Use clear, descriptive commit messages
- Examples:
  - "Update README.md" (for content changes)
  - "Add skills section to profile"
  - "Update contact information"
  - "Add project showcase section"

#### Push Requirements
- Always use: `git push -u origin <branch-name>`
- Branch must start with `claude/` and end with matching session ID
- Retry logic: On network failures, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)

### Pull Request Guidelines

When creating PRs for this repository:
- **Title**: Brief description of profile changes
- **Body**: Explain what was updated and why
- **Review**: Changes are visible publicly, so ensure accuracy
- Target the main branch for merging

## Key Conventions for AI Assistants

### Content Guidelines

1. **Tone and Style**
   - Keep profile content friendly and professional
   - First-person perspective ("I'm interested in...")
   - Balance personal and professional information
   - Avoid excessive emoji usage unless requested

2. **Markdown Best Practices**
   - Use GitHub-flavored Markdown
   - Test emoji rendering (common: 👋 👀 🌱 💞️ 📫 🚀 ⚡ 🔭)
   - Use bullet points for lists
   - Keep line length reasonable for readability

3. **Content Sections** (Common patterns for profile READMEs)
   - Introduction/greeting
   - Current interests
   - Learning goals
   - Collaboration interests
   - Contact information
   - Optional: Stats, badges, projects, skills

### Security Considerations

1. **Personal Information**
   - Avoid including sensitive personal data
   - Contact info should be professional (GitHub, LinkedIn, email)
   - No phone numbers, addresses, or private information

2. **Links and URLs**
   - Verify all external links before adding
   - Use HTTPS where available
   - Avoid shortened URLs (use full URLs for transparency)

### When to Ask for Clarification

Ask the user before:
- Adding personal contact information
- Changing the tone or style significantly
- Adding controversial or sensitive topics
- Including external images or badges
- Adding GitHub stats or activity widgets
- Restructuring the entire profile

### Common Tasks

#### Adding a Skills Section
```markdown
### 🛠️ Skills & Technologies
- **Languages**: Python, JavaScript, etc.
- **Frameworks**: React, Node.js, etc.
- **Tools**: Git, Docker, etc.
```

#### Adding Projects
```markdown
### 🚀 Featured Projects
- [Project Name](link) - Brief description
```

#### Adding Stats/Badges
```markdown
![GitHub Stats](https://github-readme-stats.vercel.app/api?username=Blueskyapple)
```

#### Adding Contact Links
```markdown
### 📫 Connect with Me
- 🐦 Twitter: [@handle]
- 💼 LinkedIn: [Profile](url)
- 📧 Email: address@example.com
```

## Repository-Specific Notes

### Current Content Structure
The README.md currently follows GitHub's default profile template:
- Greeting with emoji
- Four main points (interests, learning, collaboration, contact)
- HTML comment explaining special repository status

### Expansion Opportunities
This profile could be enhanced with:
- Detailed skills and technologies
- Featured projects and repositories
- GitHub statistics widgets
- Social media links
- Blog or portfolio links
- Current work or education
- Fun facts or hobbies

### Maintenance Notes
- **Update frequency**: Profile content can change as interests/skills evolve
- **Visibility**: All changes are publicly visible on GitHub profile
- **Testing**: Preview markdown locally before pushing
- **Backups**: Git history preserves all versions

## Git Configuration

### Remote Information
- **Remote name**: origin
- **Remote URL**: http://local_proxy@127.0.0.1:29509/git/Blueskyapple/Blueskyapple

### Recent Commits
```
09c2bb4 - Update README.md (current)
fa629f2 - Create README.md (initial)
```

## Best Practices for AI Assistants

### Do's ✅
- Read existing content before suggesting changes
- Maintain consistent tone and style
- Use proper markdown formatting
- Verify links and references
- Keep content concise and scannable
- Consider mobile viewing experience
- Preserve existing structure unless asked to change
- Commit and push changes when complete

### Don'ts ❌
- Don't add content without user approval for profiles
- Don't include sensitive personal information
- Don't use broken links or images
- Don't over-complicate the profile
- Don't add features that break on GitHub's renderer
- Don't push to wrong branch
- Don't skip reading files before editing
- Don't create unnecessary files

## Troubleshooting

### Common Issues

**Issue**: Push fails with 403 error
- **Cause**: Branch name doesn't match session ID pattern
- **Solution**: Ensure branch starts with `claude/` and ends with matching session ID

**Issue**: Markdown not rendering correctly
- **Cause**: GitHub-flavored Markdown differences
- **Solution**: Test locally or use GitHub's markdown preview

**Issue**: Emoji not displaying
- **Cause**: Platform/encoding issues
- **Solution**: Use standard Unicode emoji

**Issue**: Images not loading
- **Cause**: Invalid URL or hosting issues
- **Solution**: Use reliable image hosting (GitHub assets, imgur, etc.)

## Additional Resources

### GitHub Profile README References
- [GitHub Profile README Guide](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile)
- [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme)
- [GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats)

### Markdown Resources
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet)

## Version History

- **Current Version**: Initial CLAUDE.md creation
- **Last Updated**: 2026-01-21
- **Maintainer**: AI Assistant Documentation

---

**Note for AI Assistants**: This repository is intentionally minimal. It's a profile README, not a code project. Focus on content quality, clarity, and proper markdown formatting rather than technical implementation details.
