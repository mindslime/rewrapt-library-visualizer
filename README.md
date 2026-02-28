# ReWrapt 🎵

Visualize your music library. Explore genres, eras, and your taste evolution through stunning interactive data visualizations.

**ReWrapt** is a Next.js web application that connects with the Spotify API to analyze and visualize your listening habits. It transforms your playlists and top tracks into dynamic, interconnected graphs and timelines.

## ✨ Features

- **Interactive Data Visualization**: Switch between distinct viewing modes—like interactive clustering and chronological timelines—powered by **D3.js** and **Framer Motion**.
- **Blazing Fast Performance**: Implements robust client-side caching using IndexedDB (`idb`) to drastically reduce Spotify API calls and ensure near-instantaneous load times.
- **Premium User Experience**: Designed with **Tailwind CSS v4** and fluid animations for a modern, engaging, and premium interface.
- **First Time User Experience (FTUE)**: Includes an interactive guided tour to teach new users how to navigate the platform.
- **Demo Mode**: Allows users to explore the visualization features using mock data without needing to authenticate.
- **Waitlist Mode**: Integrates a seamless waitlist sign-up process using **Resend**.
- **Seamless Authentication**: Integrates `next-auth` for secure, frictionless Spotify OAuth login.

## 🛠 Tech Stack

- **Framework**: [Next.js v15+](https://nextjs.org/) (App Router, React 19)
- **Visualization**: [D3.js](https://d3js.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Caching**: [idb](https://github.com/jakearchibald/idb) (IndexedDB)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Spotify Developer account

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/spotify-music-map.git
   cd spotify-music-map
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Spotify Developer API credentials and a NextAuth secret:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_SECRET=your_generated_secret_key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Explore:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is open-sourced under the MIT License.
