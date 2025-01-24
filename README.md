# Kiepskie TV

🔗 Test yourself: [Vercel link](https://kiepskie-tv.vercel.app/)

Inspired by Polish popular sitcom "Świat Według Kiepskich", you can put any your own video into legendary "Okił" finctional brand television, and watch Arnold Boczek react to it.

**100% offline** - all processing is done on edge, thanks to FFmpeg-wasm (excluding hosting and necessary static assets, of course.).

Here's an example output of what you can expect, when using your video. For this example I used well-known movie [Big Buck Bunny](https://en.wikipedia.org/wiki/Big_Buck_Bunny).

https://github.com/knuurr/kiepskie-tv/assets/135069967/700ad5d5-4a7f-4f3a-8f78-10bb1349f685

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - for static site generation and routing
- **UI Components**: [DaisyUI](https://daisyui.com/) - for beautiful, ready-to-use components
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - for utility-first CSS
- **Icons**: [Heroicons](https://heroicons.com/) (via [unplugin-icons](https://github.com/unplugin/unplugin-icons)) - for consistent, beautiful icons
- **Video Processing**: [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) - for client-side video manipulation
- **Loading States**: [Animated Loading Skeletons](https://delba.dev/blog/animated-loading-skeletons-with-tailwind) - for elegant shimmer effects using TailwindCSS
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) (via [svelte-chartjs](https://github.com/SauravKanchan/svelte-chartjs)) - for interactive and responsive charts

## Key Features

- 🎬 Client-side video processing
- 🎨 Beautiful, responsive UI
- 🔄 Offline-first functionality
- 📱 Mobile-friendly design
- ⚡ Fast, static site generation
- 📊 Interactive data visualization

---

# Building

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
