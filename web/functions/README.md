# Ask Claude for the website portal

The website (GitHub Pages) has no server, so Ask Claude needs one small Firebase function that holds the Anthropic API key.

1. Get an API key at console.anthropic.com (billed per use; quick answers usually cost cents a day for a small team).
2. In the Firebase console, switch the project to the Blaze (pay as you go) plan. Cloud Functions need it.
3. On a computer with Node 20: `npm i -g firebase-tools`, `firebase login`, then in a folder with these files:
   - `firebase init functions` (pick the existing project, JavaScript; keep these index.js / package.json),
   - `firebase functions:secrets:set ANTHROPIC_API_KEY` (paste the key when asked; it is never put in the page),
   - `firebase deploy --only functions` (it asks for `OWQ_OWNER_EMAIL`: the owner's Google email).
4. Copy the function address it prints (ends in `askClaude`), open the portal as the Agency Owner, go to Team > Ask Claude, paste it and Save. Everyone has Ask Claude after a reload.

Only people on Team Access can use it (it checks their sign-in), each person is limited to 30 questions per 10 minutes, and "Search the web" uses Anthropic's web search tool.
