# Background push notifications

Background reminders require Firebase Cloud Functions, Cloud Scheduler, and a VAPID key pair. The app must be deployed with the same Firebase project configured in `src/lib/firebase.ts`.

1. Install the Firebase CLI and sign in with an account that can deploy Functions:

   ```sh
   npm install --global firebase-tools
   firebase login
   ```

2. Generate a VAPID key pair:

   ```sh
   npx web-push generate-vapid-keys
   ```

3. Set the three Functions secrets. Use the public/private values from the generated key pair and a contact address or URL you control for the subject:

   ```sh
   firebase functions:secrets:set VAPID_PUBLIC_KEY --project wadebicycle
   firebase functions:secrets:set VAPID_PRIVATE_KEY --project wadebicycle
   firebase functions:secrets:set VAPID_SUBJECT --project wadebicycle
   ```

4. Deploy the Functions:

   ```sh
   firebase deploy --only functions,firestore:indexes --project wadebicycle
   ```

The scheduled dispatcher runs once per minute and sends only reminders for the user's current local date. Cloud Scheduler requires the Firebase project to use the Blaze billing plan. Users must be signed in, grant notification permission, and enable notifications on each device.

Keep the VAPID private key secret. Never add it to frontend environment variables or commit it to the repository.
