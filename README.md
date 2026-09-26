# Tanishq Pandey — Personal Photography Archive

A bespoke, high-performance photography portfolio website featuring the interactive **Scroll Fan Cards** radial aperture showcase, ambient **WebGL Chromatic Dispersion Ribbon**, and 49 photographs with authentic camera EXIF metadata.

---

## Deploying to Vercel

You can deploy this site to Vercel in 3 simple ways:

### Method 1: Using Vercel CLI (Fastest — 1 Minute)
If you have Node.js / npm installed:
1. Open your terminal in this project directory:
   ```bash
   cd "/Users/tanishqpandey/Documents/Projects/Photography Portfolio"
   ```
2. Run:
   ```bash
   npx vercel
   ```
3. Follow the prompts:
   - *Set up and deploy?* Press `y`
   - *Which scope?* Select your personal account
   - *Link to existing project?* `N`
   - *What's your project's name?* `tanishq-photography` (or press Enter)
   - *In which directory is your code located?* Press Enter (`./`)
   - *Want to modify these settings?* `N`
4. In under 30 seconds, Vercel will give you a live production URL (e.g. `https://tanishq-photography.vercel.app`)!

---

### Method 2: Via GitHub & Vercel Dashboard (Recommended for Continuous Updates)
1. Push this project to GitHub:
   ```bash
   git add .
   git commit -m "Complete personal photography portfolio with responsive design"
   git branch -M main
   # Create a new repository on github.com (e.g. photography-portfolio)
   git remote add origin https://github.com/YOUR_USERNAME/photography-portfolio.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically build and assign a free `.vercel.app` domain (and automatically re-deploy whenever you push new photos!).

---

### Method 3: Drag & Drop (Zero Terminal Needed)
1. Go to [vercel.com/new](https://vercel.com/new) and log in.
2. Under "Deploy without Git", drag and drop this entire folder (`Photography Portfolio`).
3. Click **Deploy**!

---

## Local Development
To run locally:
```bash
python3 -m http.server 8088
```
Then visit `http://localhost:8088/` in your browser.
