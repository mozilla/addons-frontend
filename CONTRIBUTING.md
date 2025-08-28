# Contributing to Mozilla Add-ons Frontend

Thank you for your interest in contributing! 🎉
This document explains how you can contribute to **Mozilla Add-ons Frontend**
 project and other Mozilla Add-ons repositories.

Mozilla values contributions of all kinds—whether it’s fixing a bug, improving documentation, providing UX feedback, or reporting a security issue.

## 🚀 Ways to Contribute

### 🧑‍💻 Code Contributions
- Fix bugs, add new features, or refactor existing code.
- Make sure your code follows our [coding guidelines](#) and passes tests.

### 🎨 Design Contributions
- Share UI/UX suggestions, mockups, or specs.
- Coordinate with the [Mozilla Open Design team](https://github.com/mozilla/OpenDesign).

### 📚 Documentation
- Improve clarity and grammar.
- Fix broken links or outdated information.
- Add missing setup steps or usage examples.

### 🐛 Bug Reports
- Report reproducible issues with clear steps to reproduce.
- Include environment details (browser, OS, version).

### 🔒 Security Issues
- **Do not open a GitHub Issue for security bugs.**
- Report through [Bugzilla Web Security Form](https://bugzilla.mozilla.org/form.web.bounty).
- See [Security Guidelines](#) for more details.

## 🚀 Getting Started

Follow these steps to set up your development environment:

### 1. Fork the Repository  
Click the **Fork** button on the [addons-frontend](https://github.com/mozilla/addons-frontend) repo.

### 2. Clone Your Fork  
```bash
git clone https://github.com/<your-username>/addons-frontend.git
cd addons-frontend
```

### 3. Set Up Environment

- Install **Node.js** (LTS recommended).  
- Install project dependencies:  

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```
This will spin up a local development server.

## 🌿 Branching and Pull Requests

To keep contributions clean and organized:

- 🌱 Work from a **feature branch** (not `main`):  
  ```bash
  git checkout -b fix/no-data-collection-message


## 💻 Code Style

To maintain consistency across the project:

- 📌 Follow the existing **JavaScript/React** style used in the repo  
- 🧹 Run linting before pushing:  
  ```bash
  npm run lint


## 🎨 Design Contributions

If you’d like to contribute to UI/UX improvements:

- ✅ Confirm specs with Mozilla designers before starting work  
- 🖼️ Share design discussions in the [Mozilla Open Design repo](https://github.com/mozilla/open-design)  
- 🔗 Cross-link issues between repos  
  - Example: *This relates to `mozilla/addons-frontend#2782`*  


## 📖 Documentation Contributions

Help us keep our documentation clear, accurate, and up-to-date.  

You can contribute by:  

- ✍️ Improving clarity and grammar  
- 🔗 Fixing broken links  
- 🛠️ Updating setup and usage instructions when needed  

When submitting documentation updates:  

- Place changes in the **`/docs`** folder  
- Or add inline comments where relevant  
- Submit via a Pull Request (PR)  


## 🐛 Bug Reports

If you encounter a bug or have a feature request, please use **[GitHub Issues](https://github.com/mozilla/addons-frontend/issues)**.

When reporting, include as much detail as possible:

- 🔄 **Steps to reproduce**  
- ✅ **Expected behavior**  
- ❌ **Actual behavior**  
- 🖼️ **Screenshots** (if applicable)  


## 🔒 Security Guidelines

⚠️ **Do not report security vulnerabilities via GitHub issues or email.**

Instead, please:

- 🛡️ Submit vulnerabilities through the [Mozilla Bug Bounty Program](https://www.mozilla.org/en-US/security/bug-bounty/).  
- 🐞 Use [Bugzilla’s Web Security Bug Form](https://bugzilla.mozilla.org/form.web.bug).  
- 📖 Read the [Bug Bounty FAQ](https://www.mozilla.org/en-US/security/bug-bounty/faq/) for more information.  


## 🌐 Community and Communication

- 💬 Join discussions on [Mozilla Discourse](https://discourse.mozilla.org/).  
- 📰 Stay updated through the [Mozilla Add-ons Blog](https://blog.mozilla.org/addons/).  
- 🤝 Always be respectful and follow the [Mozilla Community Participation Guidelines](https://www.mozilla.org/about/governance/policies/participation/).  


## ✅ Contribution Checklist

Before submitting your Pull Request (PR), please make sure you have:

- [ ] Followed the setup and style guidelines.  
- [ ] Added or updated tests (if applicable).  
- [ ] Documented any changes (if applicable).  
- [ ] Linked the relevant issue (e.g., `Fixes #issue-number`).  
- [ ] Confirmed changes with the design team (for UI/UX modifications).  
- [ ] Ensured all CI checks are passing.  


## 🙌 Thank You

Your contributions help make **Firefox Add-ons** better for millions of users worldwide.  
We’re excited to review your PRs and welcome you to the Mozilla community! 🚀  
