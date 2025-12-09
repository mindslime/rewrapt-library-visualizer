# Spotify App Setup Guide

To use the Music Map, you need to create a Spotify App to get a Client ID and Client Secret.

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **"Create App"**.
3. Fill in the name (e.g., "My Music Map") and description.
4. In the **Redirect URIs** field, add:
   ```
   http://127.0.0.1:3000/api/auth/callback/spotify
   ```
5. Check the boxes to agree to the terms and click **Save**.
6. On the app page, click **"Settings"**.
7. Copy the **Client ID** and **Client Secret** (you may need to click "View client secret").
8. Open the `.env.example` file in your project, copy it to `.env.local` (create this file if it doesn't exist), and paste your credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_SECRET=generate_a_random_string_here
   NEXTAUTH_URL=http://127.0.0.1:3000
   ```
   *(Tip: You can generate a random secret by typing `openssl rand -base64 32` in your terminal)*
