# App Store legal pages

These pages are for **App Store Connect** and public linking.

## GitHub Pages setup

1. Push this repo to GitHub (if not already).
2. In the repo: **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Branch: **main** (or default), Folder: **/docs**.
5. Save. After a minute or two, the site will be live.

## URLs (after enabling Pages)

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name:

- **Privacy Policy:** `https://meeesterj.github.io/FGPFT/privacy.html`
- **Terms of Use:** `https://meeesterj.github.io/FGPFT/terms.html`
- **Index (links to both):** `https://meeesterj.github.io/FGPFT/`

Use the **Privacy Policy** URL in App Store Connect under App Information → Privacy Policy URL. Use the **Terms** URL in the optional field if your app has one.

## When updating Privacy or Terms of Use

**Update both places** so in-app and web stay in sync:

- **Web (App Store / public links):** `docs/privacy.html` and `docs/terms.html`
- **In-app views:** `ios/App/App/Views/PrivacyView.swift` and `ios/App/App/Views/TermsView.swift`
