## ChaiTea Chat

### Getting Started

#### To Run locally follow these steps
- Go to env file, enter all the required API Keys for the app to function
- We are using BetterAuth, so we need to run better auth migrations for auth to work.
```
npm run ba-generate
npm run ba-migrate
```
-Lastly, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

- You can add the new Models as per your liking in models.tsx file, it will automatically get picked in the App.

